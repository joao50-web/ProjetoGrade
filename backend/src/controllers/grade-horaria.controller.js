const { Op } = require("sequelize");

const {
  Curso,
  GradeHoraria,
  Disciplina,
  Pessoa,
  Horario,
  DiaSemana,
  Departamento,
  Ano,
  Curriculo,
  Semestre,
  sequelize,
} = require("../models");

/* ======================================================
   BUSCAR GRADE
====================================================== */

exports.findByContext = async (req, res) => {
  try {
    const {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      coordenador_id,
    } = req.query;

    const where = {};

    /* =========================================
       FILTROS
    ========================================= */

    if (curso_id)
      where.curso_id = curso_id;

    if (ano_id)
      where.ano_id = ano_id;

    if (semestre_id)
      where.semestre_id = semestre_id;

    if (curriculo_id)
      where.curriculo_id = curriculo_id;

    if (
      coordenador_id &&
      coordenador_id !== "null" &&
      coordenador_id !== "undefined"
    ) {
      where.coordenador_id =
        coordenador_id;
    }

    const registros =
      await GradeHoraria.findAll({
        where,

        include: [
          {
            model: Disciplina,
            as: "disciplina",
            required: false,
          },

          {
            model: Departamento,
            as: "departamento",
            required: false,
          },

          {
            model: Curso,
            as: "curso",
            required: false,
          },

          {
            model: Pessoa,
            as: "professor",
            required: false,
          },

          {
            model: Pessoa,
            as: "coordenador",
            required: false,
          },

          {
            model: Horario,
            as: "horario",
            required: false,
          },

          {
            model: DiaSemana,
            as: "diaSemana",
            required: false,
          },

          {
            model: Ano,
            as: "ano",
            required: false,
          },

          {
            model: Curriculo,
            as: "curriculo",
            required: false,
          },

          {
            model: Semestre,
            as: "semestre",
            required: false,
          },
        ],

        order: [
          [
            {
              model: DiaSemana,
              as: "diaSemana",
            },
            "id",
            "ASC",
          ],

          [
            {
              model: Horario,
              as: "horario",
            },
            "id",
            "ASC",
          ],
        ],
      });

    /* =========================================
       FORMATAR RETORNO
    ========================================= */

    const resultado =
      registros.map((r) => {

        const multicurso =
          registros.filter(
            (x) =>
              x.disciplina_id ===
                r.disciplina_id &&
              x.curso_id ===
                r.curso_id &&
              x.ano_id ===
                r.ano_id &&
              x.semestre_id ===
                r.semestre_id &&
              x.curriculo_id ===
                r.curriculo_id
          ).length > 1;

        return {
          id: r.id,

          /* IDs */

          curso_id:
            r.curso_id,

          ano_id:
            r.ano_id,

          semestre_id:
            r.semestre_id,

          curriculo_id:
            r.curriculo_id,

          coordenador_id:
            r.coordenador_id,

          professor_id:
            r.professor_id,

          departamento_id:
            r.departamento_id,

          disciplina_id:
            r.disciplina_id,

          horario_id:
            r.horario_id,

          dia_semana_id:
            r.dia_semana_id,

          /* TEXTO FORMATADO */

          curso:
            r.curso?.nome || "-",

          ano:
            r.ano?.descricao ||
            r.ano?.ano ||
            "-",

          semestre:
            r.semestre?.descricao ||
            r.semestre?.nome ||
            "-",

          curriculo:
            r.curriculo?.descricao ||
            r.curriculo?.nome ||
            "-",

          horario:
            r.horario?.descricao ||
            "-",

          diaSemana:
            r.diaSemana?.nome ||
            r.diaSemana?.descricao ||
            "-",

          /* OBJETOS */

          disciplina:
            r.disciplina
              ? {
                  id:
                    r.disciplina.id,

                  nome:
                    r.disciplina.nome,

                  codigo:
                    r.disciplina.codigo,
                }
              : null,

          professor:
            r.professor
              ? {
                  id:
                    r.professor.id,

                  nome:
                    r.professor.nome,
                }
              : null,

          coordenador:
            r.coordenador
              ? {
                  id:
                    r.coordenador.id,

                  nome:
                    r.coordenador.nome,
                }
              : null,

          departamento:
            r.departamento
              ? {
                  id:
                    r.departamento.id,

                  nome:
                    r.departamento.nome,

                  sigla:
                    r.departamento.sigla,
                }
              : null,

          multicurso,
        };
      });

    return res.json(resultado);

  } catch (err) {

    console.error(
      "Erro ao buscar grade:",
      err
    );

    return res.status(500).json({
      error:
        "Erro ao buscar grade",
    });
  }
};

/* ======================================================
   SALVAR GRADE COMPLETA
====================================================== */

exports.saveGrade = async (
  req,
  res
) => {

  const {
    contexto,
    slots,
  } = req.body;

  /* =========================================
     VALIDAÇÃO
  ========================================= */

  if (
    !contexto ||
    !Array.isArray(slots)
  ) {
    return res.status(400).json({
      error:
        "Dados inválidos",
    });
  }

  const {
    curso_id,
    ano_id,
    semestre_id,
    curriculo_id,
    coordenador_id,
  } = contexto;

  if (
    !curso_id ||
    !ano_id ||
    !semestre_id ||
    !curriculo_id
  ) {
    return res.status(400).json({
      error:
        "Preencha todos os filtros",
    });
  }

  /* =========================================
     REMOVE DUPLICADOS
  ========================================= */

  const mapa =
    new Map();

  slots.forEach((slot) => {

    if (
      slot.disciplina_id &&
      slot.horario_id &&
      slot.dia_semana_id
    ) {

      const chave =
        `${slot.horario_id}-${slot.dia_semana_id}`;

      mapa.set(
        chave,
        slot
      );
    }
  });

  const slotsValidos =
    Array.from(
      mapa.values()
    );

  if (
    slotsValidos.length === 0
  ) {
    return res.status(400).json({
      error:
        "Nenhuma disciplina selecionada",
    });
  }

  const transaction =
    await sequelize.transaction();

  try {

    /* =========================================
       REMOVE GRADE ANTIGA
    ========================================= */

    await GradeHoraria.destroy({
      where: {
        curso_id,
        ano_id,
        semestre_id,
        curriculo_id,
      },

      transaction,
    });

    /* =========================================
       NOVOS REGISTROS
    ========================================= */

    const registros =
      slotsValidos.map(
        (slot) => ({
          curso_id,

          ano_id,

          semestre_id,

          curriculo_id,

          coordenador_id:
            coordenador_id ||
            null,

          professor_id:
            slot.professor_id ||
            null,

          departamento_id:
            slot.departamento_id ||
            null,

          horario_id:
            slot.horario_id,

          dia_semana_id:
            slot.dia_semana_id,

          disciplina_id:
            slot.disciplina_id,
        })
      );

    /* =========================================
       VALIDA CONFLITO PROFESSOR
    ========================================= */

    for (const registro of registros) {

      if (
        registro.professor_id
      ) {

        const conflito =
          await GradeHoraria.findOne({
            where: {
              professor_id:
                registro.professor_id,

              horario_id:
                registro.horario_id,

              dia_semana_id:
                registro.dia_semana_id,

              [Op.not]: {
                curso_id,
                ano_id,
                semestre_id,
                curriculo_id,
              },
            },

            transaction,
          });

        if (conflito) {

          await transaction.rollback();

          return res.status(409).json({
            error:
              "Professor já possui aula nesse horário",
          });
        }
      }
    }

    /* =========================================
       SALVAR
    ========================================= */

    await GradeHoraria.bulkCreate(
      registros,
      {
        transaction,
      }
    );

    await transaction.commit();

    return res.json({
      message:
        "Grade salva com sucesso",

      inseridos:
        registros.length,
    });

  } catch (err) {

    await transaction.rollback();

    console.error(
      "Erro ao salvar grade:",
      err
    );

    return res.status(500).json({
      error:
        "Erro ao salvar grade",
    });
  }
};

/* ======================================================
   SALVAR SLOT
====================================================== */

exports.saveSlot = async (
  req,
  res
) => {

  try {

    const {
      curso_id,
      coordenador_id,
      professor_id,
      departamento_id,
      ano_id,
      semestre_id,
      curriculo_id,
      horario_id,
      dia_semana_id,
      disciplina_id,
    } = req.body;

    /* =========================================
       VALIDAÇÃO
    ========================================= */

    if (
      !curso_id ||
      !ano_id ||
      !semestre_id ||
      !curriculo_id ||
      !horario_id ||
      !dia_semana_id
    ) {
      return res.status(400).json({
        error:
          "Dados incompletos",
      });
    }

    /* =========================================
       CONFLITO PROFESSOR
    ========================================= */

    if (professor_id) {

      const conflito =
        await GradeHoraria.findOne({
          where: {
            professor_id,
            horario_id,
            dia_semana_id,
          },
        });

      if (conflito) {
        return res.status(409).json({
          error:
            "Professor já possui aula neste horário",
        });
      }
    }

    /* =========================================
       CREATE
    ========================================= */

    const registro =
      await GradeHoraria.create({
        curso_id,

        coordenador_id:
          coordenador_id ||
          null,

        professor_id:
          professor_id ||
          null,

        departamento_id:
          departamento_id ||
          null,

        ano_id,

        semestre_id,

        curriculo_id,

        horario_id,

        dia_semana_id,

        disciplina_id:
          disciplina_id ||
          null,
      });

    return res.json(registro);

  } catch (err) {

    console.error(
      "Erro ao salvar slot:",
      err
    );

    return res.status(500).json({
      error:
        "Erro ao salvar slot",
    });
  }
};