const { Turma } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const turmas = await Turma.findAll({
      order: [["nome", "ASC"]],
    });

    return res.json(turmas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar turmas" });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, codigo } = req.body;

    const turma = await Turma.create({
      nome,
      codigo,
    });

    return res.json(turma);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar turma" });
  }
};