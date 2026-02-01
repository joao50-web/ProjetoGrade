const { Semestre } = require('../models');

exports.findAll = async (req, res) => {
  const semestres = await Semestre.findAll({
    order: [['id', 'ASC']]
  });
  res.json(semestres);
};
