const { Ano } = require('../models');

exports.getOrCreate = async (req, res) => {
  try {
    const { descricao } = req.body;

    // ✅ AGORA SÓ ANO (AAAA)
    if (!/^\d{4}$/.test(descricao)) {
      return res.status(400).json({
        error: 'Ano deve estar no formato AAAA'
      });
    }

    const [ano] = await Ano.findOrCreate({
      where: { descricao }
    });

    return res.json(ano);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao salvar ano" });
  }
};

exports.findAll = async (req, res) => {
  try {
    const anos = await Ano.findAll({
      order: [['descricao', 'DESC']]
    });

    return res.json(anos);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar anos" });
  }
};