const {
  Disciplina,
  Curso,
  Pessoa,
  Cargo,
  GradeHoraria,
  Departamento,
} = require("../models");

/* ====== CRIAR DISCIPLINA ===== */
exports.create = async (req, res) => {
  try {
    if (!req.body.departamento_id) {
      req.body.departamento_id = null;
    }

    const disciplina = await Disciplina.create(req.body);
    return res.status(201).json(disciplina);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar disciplina" });
  }
};

/* ======= LISTAR TODAS ========= */
exports.findAll = async (req, res) => {
  try {
    const disciplinas = await Disciplina.findAll({
      include: [
        {
          model: Pessoa,
          as: "professores",
          attributes: ["id", "nome"],
          through: { attributes: [] },
        },
        {
          model: Departamento,
          as: "departamento",
          attributes: ["id", "nome", "sigla"],
        },
      ],
      order: [["nome", "ASC"]],
    });

    return res.json(disciplinas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar disciplinas" });
  }
};

/* ======= BUSCAR POR ID ======== */
exports.findById = async (req, res) => {
  try {
    const disciplina = await Disciplina.findByPk(req.params.id, {
      include: [
        {
          model: Pessoa,
          as: "professores",
          attributes: ["id", "nome"],
          through: { attributes: [] },
        },
        {
          model: Departamento,
          as: "departamento",
          attributes: ["id", "nome", "sigla"],
        },
      ],
    });

    if (!disciplina) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }

    return res.json(disciplina);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar disciplina" });
  }
};

/* == ATUALIZAR == */
exports.update = async (req, res) => {
  try {
    const disciplina = await Disciplina.findByPk(req.params.id);

    if (!disciplina) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }

    const novoDepartamentoId = req.body.departamento_id || null;
    req.body.departamento_id = novoDepartamentoId;

    // 1. Atualiza a disciplina
    await disciplina.update(req.body);

    // 2. CORREÇÃO CRÍTICA: Sincroniza a mudança com a Grade Horária
    // Isso garante que os relatórios e a grade antiga passem a mostrar o departamento novo
    await GradeHoraria.update(
      { departamento_id: novoDepartamentoId },
      { where: { disciplina_id: disciplina.id } }
    );

    return res.json(disciplina);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar disciplina" });
  }
};

/* === REMOVER ==== */
exports.remove = async (req, res) => {
  try {
    const disciplina = await Disciplina.findByPk(req.params.id);

    if (!disciplina) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }

    const vinculada = await GradeHoraria.findOne({
      where: { disciplina_id: disciplina.id },
    });

    if (vinculada) {
      return res.status(409).json({
        error: "Não é possível excluir esta disciplina porque ela está vinculada a uma grade horária.",
      });
    }

    await disciplina.destroy();
    return res.status(200).json({ message: "Disciplina removida com sucesso" });
  } catch (err) {
    console.error("Erro ao remover disciplina:", err);
    if (
      err.name === "SequelizeForeignKeyConstraintError" ||
      err.original?.code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        error: "Esta disciplina está sendo utilizada na grade horária e não pode ser removida.",
      });
    }
    return res.status(500).json({ error: "Erro interno ao remover disciplina" });
  }
};

/* ====== RELAÇÕES ======== */
exports.findRelations = async (req, res) => {
  try {
    const disciplina = await Disciplina.findByPk(req.params.id, {
      include: [{ model: Pessoa, as: "professores" }],
    });
    if (!disciplina) return res.status(404).json({ error: "Disciplina não encontrada" });
    return res.json(disciplina);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar relações" });
  }
};

exports.updateRelations = async (req, res) => {
  try {
    const { professores } = req.body;
    const disciplina = await Disciplina.findByPk(req.params.id);
    if (!disciplina) return res.status(404).json({ error: "Disciplina não encontrada" });
    
    if (professores) await disciplina.setProfessores(professores);
    return res.json({ message: "Relações atualizadas com sucesso" });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar relações" });
  }
};