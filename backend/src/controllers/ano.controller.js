const { Ano } = require('../models');

exports.getOrCreate = async (req, res) => {
  const { descricao } = req.body;

  // valida AAAA/1 ou AAAA/2
  if (!/^\d{4}\/[12]$/.test(descricao)) {
    return res.status(400).json({
      error: 'Ano letivo deve estar no formato AAAA/1 ou AAAA/2'
    });
  }

  const [ano] = await Ano.findOrCreate({
    where: { descricao }
  });

  res.json(ano);
};


exports.findAll = async (req, res) => {
  const anos = await Ano.findAll({
    order: [['descricao', 'DESC']]
  });
  res.json(anos);
};
