const { Curso, Disciplina, Pessoa, GradeHoraria } = require("../models");
const { Sequelize } = require("sequelize");

/* ===============================
   CREATE
=============================== */
exports.create = async (req, res) => {
  try {
    const curso = await Curso.create({
      nome: req.body.nome,
    });

    res.status(201).json(curso);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao criar curso",
    });
  }
};

/* ===============================
   LISTAR TODOS
=============================== */
exports.findAll = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      include: [
        {
          model: Disciplina,
          as: "disciplinas",
          attributes: ["id", "codigo", "nome"],
          through: { attributes: [] },
        },
      ],
      order: [["nome", "ASC"]],
    });

    res.json(cursos);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar cursos",
    });
  }
};

/* ===============================
   BUSCAR POR ID
=============================== */
exports.findById = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({
        error: "Curso não encontrado",
      });
    }

    res.json(curso);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar curso",
    });
  }
};

/* ===============================
   UPDATE
=============================== */
exports.update = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({
        error: "Curso não encontrado",
      });
    }

    await curso.update({
      nome: req.body.nome,
    });

    res.json(curso);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar curso",
    });
  }
};

/* ===============================
   DELETE (100% SEGURO)
=============================== */
exports.remove = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({
        error: "Curso não encontrado",
      });
    }

    // 🔥 CHECAGEM ANTES DE DELETAR (EVITA ERRO 1451)
    const usadoNaGrade = await GradeHoraria.count({
      where: {
        curso_id: curso.id,
      },
    });

    if (usadoNaGrade > 0) {
      return res.status(409).json({
        error:
          "Não é possível excluir este curso pois ele está sendo usado na grade horária.",
      });
    }

    await curso.destroy();

    return res.status(204).send();

  } catch (error) {
    console.error("Erro ao remover curso:", error);

    // 🔥 FALLBACK CASO FK AINDA PASSE (SEGURANÇA DUPLA)
    if (
      error instanceof Sequelize.ForeignKeyConstraintError ||
      error.name === "SequelizeForeignKeyConstraintError" ||
      error.code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        error:
          "Não é possível excluir este curso pois existem registros vinculados a ele.",
      });
    }

    return res.status(500).json({
      error: "Erro interno ao remover curso",
    });
  }
};

/* ===============================
   LISTAR DISCIPLINAS
=============================== */
exports.listDisciplinas = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Disciplina,
          as: "disciplinas",
          attributes: ["id", "nome", "codigo"],
          through: { attributes: [] },
        },
      ],
    });

    if (!curso) {
      return res.status(404).json({
        error: "Curso não encontrado",
      });
    }

    res.json(curso.disciplinas || []);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao listar disciplinas",
    });
  }
};

/* ===============================
   ATUALIZAR DISCIPLINAS
=============================== */
exports.updateDisciplinas = async (req, res) => {
  try {
    const { disciplinas } = req.body;

    if (!Array.isArray(disciplinas)) {
      return res.status(400).json({
        error: "disciplinas deve ser um array",
      });
    }

    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({
        error: "Curso não encontrado",
      });
    }

    await curso.setDisciplinas(disciplinas);

    res.json({
      message: "Disciplinas associadas com sucesso",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao associar disciplinas",
    });
  }
};

/* ===============================
   DISCIPLINAS + PROFESSORES
=============================== */
exports.findDisciplinasComProfessores = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findByPk(id, {
      include: {
        model: Disciplina,
        as: "disciplinas",
        include: {
          model: Pessoa,
          as: "professores",
          attributes: ["id", "nome"],
          through: { attributes: [] },
        },
      },
    });

    if (!curso) {
      return res.status(404).json({
        error: "Curso não encontrado",
      });
    }

    const result = [];

    curso.disciplinas.forEach((disciplina) => {
      disciplina.professores.forEach((professor) => {
        result.push({
          disciplina_id: disciplina.id,
          disciplina_nome: disciplina.nome,
          professor_id: professor.id,
          professor_nome: professor.nome,
        });
      });
    });

    res.json(result);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar disciplinas com professores",
    });
  }
};