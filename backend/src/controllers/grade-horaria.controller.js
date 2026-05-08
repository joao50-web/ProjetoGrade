const { Op } = require("sequelize");

const {
  Curso,
  GradeHoraria,
  Disciplina,
  Pessoa,
  Horario,
  DiaSemana,
  Departamento,
  sequelize,
} = require("../models");

/* ======================================================
   BUSCAR GRADE
====================================================== */

exports.findByContext = async (req, res) => {
  try {

    let {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      coordenador_id,
    } = req.query;

    const where = {};

    /* =========================================
       FILTROS OPCIONAIS
    ========================================= */

    if (curso_id)
      where.curso_id = curso_id;

    if (ano_id)
      where.ano_id = ano_id;

    if (semestre_id)
      where.semestre_id =
        semestre_id;

    if (curriculo_id)
      where.curriculo_id =
        curriculo_id;

    if (
      coordenador_id !== undefined &&
      coordenador_id !== ""
    ) {
      where.coordenador_id =
        coordenador_id === "null" ||
        coordenador_id === "undefined"
          ? null
          : coordenador_id;
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
            model: Curso,
            as: "curso",

            include: [
              {
                model: Departamento,
                as: "departamento",
              },
            ],
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
          },

          {
            model: DiaSemana,
            as: "diaSemana",
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

    const resultado =
      registros.map((r) => {

        const multicurso =
          registros.filter(
            (x) =>
              x.disciplina_id ===
              r.disciplina_id
          ).length > 1;

        return {
          id: r.id,

          curso_id:
            r.curso_id,

          departamento:
            r.curso
              ?.departamento
              ?.nome || "-",

          curso:
            r.curso?.nome || "-",

          disciplina_id:
            r.disciplina_id,

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

          professor_id:
            r.professor_id,

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

          horario:
            r.horario
              ?.descricao || "-",

          diaSemana:
            r.diaSemana
              ?.nome || "-",

          multicurso,
        };
      });

    return res.json(resultado);

  } catch (err) {

    console.error(err);

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

  /* =========================================
     VALIDAÇÕES
  ========================================= */

  if (!curso_id) {
    return res.status(400).json({
      error:
        "curso_id obrigatório",
    });
  }

  if (!ano_id) {
    return res.status(400).json({
      error:
        "ano_id obrigatório",
    });
  }

  if (!semestre_id) {
    return res.status(400).json({
      error:
        "semestre_id obrigatório",
    });
  }

  if (!curriculo_id) {
    return res.status(400).json({
      error:
        "curriculo_id obrigatório",
    });
  }

  /* =========================================
     REMOVE DUPLICADOS
  ========================================= */

  const mapaSlots =
    new Map();

  slots.forEach((slot) => {

    if (
      slot.disciplina_id &&
      slot.horario_id &&
      slot.dia_semana_id
    ) {

      const chave =
        `${slot.horario_id}-${slot.dia_semana_id}`;

      mapaSlots.set(
        chave,
        slot
      );
    }
  });

  const slotsValidos =
    Array.from(
      mapaSlots.values()
    );

  if (
    slotsValidos.length === 0
  ) {
    return res.status(400).json({
      error:
        "Nenhuma disciplina atribuída para salvar",
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

    const novosRegistros =
      slotsValidos.map(
        (slot) => ({
          curso_id,

          ano_id,

          semestre_id,

          curriculo_id,

          coordenador_id:
            coordenador_id ??
            null,

          professor_id:
            slot.professor_id ??
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
       CONFLITO PROFESSOR
    ========================================= */

    for (const registro of novosRegistros) {

      if (
        !registro.dia_semana_id ||
        !registro.horario_id
      ) {
        await transaction.rollback();

        return res.status(400).json({
          error:
            "dia_semana_id e horario_id são obrigatórios",
        });
      }

      if (
        registro.professor_id
      ) {

        const conflito =
          await GradeHoraria.findOne({
            where: {
              dia_semana_id:
                registro.dia_semana_id,

              horario_id:
                registro.horario_id,

              professor_id:
                registro.professor_id,

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
              "Conflito: professor já possui aula nesse horário",
          });
        }
      }
    }

    /* =========================================
       INSERE NOVA GRADE
    ========================================= */

    await GradeHoraria.bulkCreate(
      novosRegistros,
      {
        transaction,
      }
    );

    await transaction.commit();

    return res.json({
      message:
        "Grade salva com sucesso",

      inseridos:
        novosRegistros.length,
    });

  } catch (err) {

    await transaction.rollback();

    console.error(
      "Erro ao salvar grade:",
      err
    );

    return res.status(500).json({
      error:
        "Erro ao salvar grade: " +
        err.message,
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
            dia_semana_id,
            horario_id,
            professor_id,
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
       UPSERT
    ========================================= */

    const [registro] =
      await GradeHoraria.upsert({
        curso_id,

        coordenador_id:
          coordenador_id ??
          null,

        professor_id:
          professor_id ??
          null,

        ano_id,

        semestre_id,

        curriculo_id,

        horario_id,

        dia_semana_id,

        disciplina_id:
          disciplina_id ??
          null,
      });

    return res.json(
      registro
    );

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error:
        "Erro ao salvar slot",
    });
  }
};