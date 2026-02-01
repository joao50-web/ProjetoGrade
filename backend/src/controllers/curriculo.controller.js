const { Curriculo } = require('../models');

exports.getOrCreate = async (req, res) => {
  const { descricao } = req.body;

  if (!/^\d{4}$/.test(descricao)) {
    return res.status(400).json({ error: 'Currículo inválido' });
  }

  const [curriculo] = await Curriculo.findOrCreate({
    where: { descricao }
  });

  res.json(curriculo);
};
exports.findAll = async (req, res) => {
  const curriculos = await Curriculo.findAll({
    order: [['descricao', 'DESC']]
  });
  res.json(curriculos);
};
