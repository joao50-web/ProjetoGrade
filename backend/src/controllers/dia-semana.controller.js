const { DiaSemana } = require('../models');

exports.findAll = async (req, res) => {
  const dias = await DiaSemana.findAll({
    order: [['id', 'ASC']]
  });
  res.json(dias);
};
