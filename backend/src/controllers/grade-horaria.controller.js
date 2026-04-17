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

/* ================= BUSCAR GRADE ================= */
exports.findByContext = async (req, res) => {
  try {
    let {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      professor_id,
      coordenador_id,
    } = req.query;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios não informados",
      });
    }

    const where = {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
    };

    if (professor_id !== undefined && professor_id !== "") {
      where.professor_id =
        professor_id === "null" || professor_id === "undefined"
          ? null
          : professor_id;
    }

    if (coordenador_id !== undefined && coordenador_id !== "") {
      where.coordenador_id =
        coordenador_id === "null" || coordenador_id === "undefined"
          ? null
          : coordenador_id;
    }

    const registros = await GradeHoraria.findAll({
      where,
      include: [
        { model: Disciplina, as: "disciplina", attributes: ["id", "codigo", "nome"] },
        { model: Horario, as: "horario", attributes: ["id", "descricao"] },
        { model: DiaSemana, as: "diaSemana", attributes: ["id", "descricao"] },
        { model: Pessoa, as: "professor", attributes: ["id", "nome"] },
        { model: Pessoa, as: "coordenador", attributes: ["id", "nome"] },
      ],
    });

    const resultado = registros.map((r) => ({
      id: r.id,
      horario_id: r.horario_id,
      dia_semana_id: r.dia_semana_id,
      disciplina_id: r.disciplina_id,
      professor_id: r.professor_id,
      coordenador_id: r.coordenador_id,
      professor: r.professor ? { id: r.professor.id, nome: r.professor.nome } : null,
      coordenador: r.coordenador
        ? { id: r.coordenador.id, nome: r.coordenador.nome }
        : null,
      disciplina: r.disciplina
        ? {
            id: r.disciplina.id,
            nome: r.disciplina.nome,
            codigo: r.disciplina.codigo,
          }
        : null,
    }));

    return res.json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar grade" });
  }
};

/* ================= SALVAR GRADE COMPLETA ================= */
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
    professor_id,
  } = contexto;

  const slotsValidos = slots.filter((slot) => slot.disciplina_id != null);

  if (slotsValidos.length === 0) {
    return res.status(400).json({
      error: "Nenhuma disciplina atribuída para salvar",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    // 🔥 1. LIMPA TODA A GRADE DO CONTEXTO (IMPORTANTE)
    await GradeHoraria.destroy({
      where: {
        curso_id,
        ano_id,
        semestre_id,
        curriculo_id,
      },
      transaction,
    });

    // 🔥 2. PREPARA NOVOS REGISTROS
    const novosRegistros = slotsValidos.map((slot) => ({
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      coordenador_id: coordenador_id ?? null,
      professor_id: professor_id ?? null,
      horario_id: slot.horario_id,
      dia_semana_id: slot.dia_semana_id,
      disciplina_id: slot.disciplina_id,
    }));

    // 🔥 3. VALIDA CONFLITO DE PROFESSOR
    for (const registro of novosRegistros) {
      if (registro.professor_id !== null) {
        const conflito = await GradeHoraria.findOne({
          where: {
            dia_semana_id: registro.dia_semana_id,
            horario_id: registro.horario_id,
            professor_id: registro.professor_id,
          },
          transaction,
        });

        if (conflito) {
          await transaction.rollback();
          return res.status(409).json({
            error: `Conflito: professor já possui aula nesse horário`,
          });
        }
      }
    }

    // 🔥 4. INSERE NOVA GRADE
    await GradeHoraria.bulkCreate(novosRegistros, { transaction });

    await transaction.commit();

    return res.json({
      message: "Grade salva com sucesso",
      inseridos: novosRegistros.length,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Erro ao salvar grade:", err);

    return res.status(500).json({
      error: "Erro ao salvar grade: " + err.message,
    });
  }
};

/* ================= SALVAR SLOT ================= */
exports.saveSlot = async (req, res) => {
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

    const [registro] = await GradeHoraria.upsert({
      curso_id,
      coordenador_id: coordenador_id ?? null,
      professor_id: professor_id ?? null,
      ano_id,
      semestre_id,
      curriculo_id,
      horario_id,
      dia_semana_id,
      disciplina_id: disciplina_id ?? null,
    });

    return res.json(registro);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao salvar slot" });
  }
};