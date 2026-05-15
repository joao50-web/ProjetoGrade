const { Curriculo } = require("../models");

exports.getOrCreate = async (req, res) => {
  try {
    let { descricao } = req.body;

    if (!descricao) {
      return res.status(400).json({ error: "Currículo obrigatório" });
    }

    descricao = String(descricao).trim();

    if (!/^\d{4}$/.test(descricao)) {
      return res.status(400).json({ error: "Currículo inválido (use YYYY)" });
    }

    const [curriculo] = await Curriculo.findOrCreate({
      where: { descricao },
      defaults: { descricao },
    });

    return res.json(curriculo);
  } catch (err) {
    console.error("Erro currículo:", err);
    return res.status(500).json({ error: "Erro ao processar currículo" });
  }
};

exports.findAll = async (req, res) => {
  try {
    const curriculos = await Curriculo.findAll({
      order: [["descricao", "DESC"]],
    });

    return res.json(curriculos);
  } catch (err) {
    console.error("Erro curriculos:", err);
    return res.status(500).json({ error: "Erro ao listar currículos" });
  }
};