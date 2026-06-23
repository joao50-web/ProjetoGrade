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
    console.log("\n[DEBUG] 1. Recebido no req.query:", req.query);

    const {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      coordenador_id,
      professor_id,
      departamento_id,
    } = req.query;

    const where = {};

    if (curso_id) where.curso_id = curso_id;
    if (ano_id) where.ano_id = ano_id;
    if (semestre_id) where.semestre_id = semestre_id;
    if (curriculo_id) where.curriculo_id = curriculo_id;

    if (coordenador_id && coordenador_id !== "null") {
      where.coordenador_id = coordenador_id;
    }

    if (professor_id && professor_id !== "null") {
      where.professor_id = professor_id;
    }

    if (departamento_id && departamento_id !== "null") {
      where.departamento_id = departamento_id;
    }

    console.log("[DEBUG] 2. Cláusula WHERE final:", where);

    let disciplinasValidas = [];

    if (curso_id) {
      const curso = await Curso.findByPk(curso_id, {
        include: [
          {
            model: Disciplina,
            as: "disciplinas",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });

      disciplinasValidas = curso?.disciplinas?.map((d) => d.id) || [];
      console.log("[DEBUG] Disciplinas válidas do curso encontradas:", disciplinasValidas.length);
    }

    const registros = await GradeHoraria.findAll({
      where,
      distinct: true,
      include: [
        {
          model: Disciplina,
          as: "disciplina",
          required: false,
          attributes: ["id", "nome", "codigo", "carga_horaria"],
        },
        { model: Departamento, as: "departamento", required: false },
        { model: Curso, as: "curso", required: false },
        { model: Pessoa, as: "professor", required: false },
        { model: Pessoa, as: "coordenador", required: false },
        { model: Horario, as: "horario", required: false },
        { model: DiaSemana, as: "diaSemana", required: false },
        { model: Ano, as: "ano", required: false },
        { model: Curriculo, as: "curriculo", required: false },
        { model: Semestre, as: "semestre", required: false },
      ],
      order: [
        [{ model: DiaSemana, as: "diaSemana" }, "id", "ASC"],
        [{ model: Horario, as: "horario" }, "id", "ASC"],
      ],
    });

    console.log(`[DEBUG] 3. GradeHoraria.findAll retornou ${registros.length} registros.`);

    const mapaMulticurso = new Map();

    registros.forEach((r) => {
      const chave = `${r.disciplina_id}-${r.curso_id}-${r.ano_id}-${r.semestre_id}-${r.curriculo_id}`;
      mapaMulticurso.set(chave, (mapaMulticurso.get(chave) || 0) + 1);
    });

    const resultado = registros.map((r) => {
      const chave = `${r.disciplina_id}-${r.curso_id}-${r.ano_id}-${r.semestre_id}-${r.curriculo_id}`;
      const multicurso = (mapaMulticurso.get(chave) || 0) > 1;

      /* 
         Se houver filtro por departamento (Mini Grade) e NÃO houver filtro por curso, 
         consideramos a disciplina como válida para que os dados apareçam.
      */
      const isDeptFilterOnly = !!departamento_id && !curso_id;
      const disciplinaValida = isDeptFilterOnly || (r.disciplina && (!curso_id || disciplinasValidas.includes(r.disciplina.id)));

      return {
        id: r.id,

        curso_id: r.curso_id,
        ano_id: r.ano_id,
        semestre_id: r.semestre_id,
        curriculo_id: r.curriculo_id,
        coordenador_id: r.coordenador_id,
        professor_id: r.professor_id,
        departamento_id: r.departamento_id,

        disciplina_id: r.disciplina_id,
        horario_id: r.horario_id,
        dia_semana_id: r.dia_semana_id,

        turma: r.turma || "", 

        curso: r.curso?.nome || "-",
        ano: r.ano?.descricao || r.ano?.ano || "-",
        semestre: r.semestre?.descricao || r.semestre?.nome || "-",
        curriculo: r.curriculo?.descricao || r.curriculo?.nome || "-",
        horario: r.horario?.descricao || "-",
        diaSemana: r.diaSemana?.nome || "-",

        disciplina: (disciplinaValida && r.disciplina)
          ? {
              id: r.disciplina.id,
              nome: r.disciplina.nome,
              codigo: r.disciplina.codigo,
              carga_horaria: r.disciplina.carga_horaria,
            }
          : null,

        professor: r.professor
          ? { id: r.professor.id, nome: r.professor.nome }
          : null,

        coordenador: r.coordenador
          ? { id: r.coordenador.id, nome: r.coordenador.nome }
          : null,

        departamento: r.departamento
          ? {
              id: r.departamento.id,
              nome: r.departamento.nome,
              sigla: r.departamento.sigla,
            }
          : null,

        disciplinaInvalida: !!r.disciplina && !disciplinaValida,
        multicurso,
      };
    });

    return res.json(resultado);
  } catch (err) {
    console.error("Erro ao buscar grade:", err);
    return res.status(500).json({ error: "Erro ao buscar grade" });
  }
};

/* ======================================================
   SALVAR GRADE
====================================================== */
exports.saveGrade = async (req, res) => {
  const { contexto, slots } = req.body;

  if (!contexto || !Array.isArray(slots)) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const {
    curso_id,
    ano_id,
    semestre_id,
    curriculo_id,
    coordenador_id,
  } = contexto;

  if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
    return res.status(400).json({ error: "Preencha os filtros principais" });
  }

  const mapa = new Map();

  slots.forEach((slot) => {
    if (slot.disciplina_id && slot.horario_id && slot.dia_semana_id) {
      const chave = `${slot.horario_id}-${slot.dia_semana_id}`;
      mapa.set(chave, slot);
    }
  });

  const slotsValidos = Array.from(mapa.values());

  const transaction = await sequelize.transaction();

  try {
    await GradeHoraria.destroy({
      where: {
        curso_id,
        ano_id,
        semestre_id,
        curriculo_id,
      },
      transaction,
    });

    const registros = slotsValidos.map((slot) => ({
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      coordenador_id: coordenador_id || null,
      professor_id: slot.professor_id || null,
      departamento_id: slot.departamento_id || null,
      horario_id: slot.horario_id,
      dia_semana_id: slot.dia_semana_id,
      disciplina_id: slot.disciplina_id,
      turma: slot.turma || null, 
    }));

    await GradeHoraria.bulkCreate(registros, { transaction });

    await transaction.commit();

    return res.json({
      message: "Grade salva com sucesso",
      inseridos: registros.length,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Erro ao salvar grade:", err);
    return res.status(500).json({ error: "Erro ao salvar grade" });
  }
};

/* ======================================================
   SALVAR SLOT
====================================================== */
exports.saveSlot = async (req, res) => {
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
      turma,
    } = req.body;

    if (
      !curso_id ||
      !ano_id ||
      !semestre_id ||
      !curriculo_id ||
      !horario_id ||
      !dia_semana_id
    ) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const registro = await GradeHoraria.create({
      curso_id,
      coordenador_id: coordenador_id || null,
      professor_id: professor_id || null,
      departamento_id: departamento_id || null,
      ano_id,
      semestre_id,
      curriculo_id,
      horario_id,
      dia_semana_id,
      disciplina_id: disciplina_id || null,
      turma: turma || null,
    });

    return res.json(registro);
  } catch (err) {
    console.error("Erro ao salvar slot:", err);
    return res.status(500).json({ error: "Erro ao salvar slot" });
  }
};

/* ======================================================
   DELETE GRADE
====================================================== */
exports.deleteGrade = async (req, res) => {
  try {
    const { curso_id, ano_id, semestre_id, curriculo_id } = req.body;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
      return res.status(400).json({
        error: "Filtros obrigatórios",
      });
    }

    const deleted = await GradeHoraria.destroy({
      where: {
        curso_id,
        ano_id,
        semestre_id,
        curriculo_id,
      },
    });

    return res.json({
      message: "Grade excluída com sucesso",
      deletados: deleted,
    });
  } catch (err) {
    console.error("Erro ao deletar grade:", err);
    return res.status(500).json({
      error: "Erro ao deletar grade",
    });
  }
};