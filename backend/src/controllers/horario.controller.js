const { Horario } = require('../models');

exports.findAll = async (req, res) => {
  const horarios = await Horario.findAll({
    order: [['id', 'ASC']]
  });
  res.json(horarios);
};
