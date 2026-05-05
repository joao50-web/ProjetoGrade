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

    if (coordenador_id !== undefined && coordenador_id !== "") {
      where.coordenador_id =
        coordenador_id === "null" || coordenador_id === "undefined"
          ? null
          : coordenador_id;
    }

const registros = await GradeHoraria.findAll({
  where,
 include: [
  { model: Disciplina, as: "disciplina" },

  {
    model: Pessoa,
    as: "professor",
    required: false,
    include: [
      {
        model: require("../models").Cargo,
        as: "cargo",
        attributes: [],
        where: {
          descricao: {
            [Op.like]: "%Professor%",
          },
        },
      },
    ],
  },

  {
    model: Pessoa,
    as: "coordenador",
  },

  { model: Horario, as: "horario" },
  { model: DiaSemana, as: "diaSemana" },
]
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
  } = contexto;

  // 1. Filtra slots válidos e remove duplicatas de horário/dia vindas do frontend
  const slotsUnicos = [];
  const mapaSlots = new Map();

  slots.forEach(slot => {
    if (slot.disciplina_id != null) {
      const chave = `${slot.horario_id}-${slot.dia_semana_id}`;
      // Se houver duplicata no array enviado, mantém apenas a última definição
      mapaSlots.set(chave, slot);
    }
  });

  const slotsValidos = Array.from(mapaSlots.values());

  if (slotsValidos.length === 0) {
    return res.status(400).json({
      error: "Nenhuma disciplina atribuída para salvar",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    // 🔥 2. LIMPA TODA A GRADE DO CONTEXTO ATUAL
    // Isso evita o erro de Duplicate Entry ao tentar inserir o que já existia
    await GradeHoraria.destroy({
      where: {
        curso_id,
        ano_id,
        semestre_id,
        curriculo_id,
      },
      transaction,
    });

    // 🔥 3. PREPARA NOVOS REGISTROS
    const novosRegistros = slotsValidos.map((slot) => ({
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      coordenador_id: coordenador_id ?? null,
      professor_id: slot.professor_id ?? null,
      horario_id: slot.horario_id,
      dia_semana_id: slot.dia_semana_id,
      disciplina_id: slot.disciplina_id,
    }));

    // 🔥 4. VALIDA CONFLITO DE PROFESSOR EM OUTROS CONTEXTOS
    for (const registro of novosRegistros) {
      if (registro.professor_id !== null) {
        const conflito = await GradeHoraria.findOne({
          where: {
            dia_semana_id: registro.dia_semana_id,
            horario_id: registro.horario_id,
            professor_id: registro.professor_id,
            // Importante: Ignora o contexto atual pois ele já foi deletado acima
            // Mas o Sequelize pode ainda ver se não usarmos a transação corretamente
            [Op.not]: {
              curso_id,
              ano_id,
              semestre_id,
              curriculo_id
            }
          },
          transaction,
        });

        if (conflito) {
          await transaction.rollback();
          return res.status(409).json({
            error: `Conflito: professor já possui aula nesse horário em outro curso/currículo`,
          });
        }
      }
    }

    // 🔥 5. INSERE NOVA GRADE
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