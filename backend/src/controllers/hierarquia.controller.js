const { Hierarquia } = require('../models');

exports.create = async (req, res) => {
  const hierarquia = await Hierarquia.create(req.body);
  res.status(201).json(hierarquia);
};

exports.findAll = async (req, res) => {
  const hierarquias = await Hierarquia.findAll();
  res.json(hierarquias);
};

exports.findById = async (req, res) => {
  const hierarquia = await Hierarquia.findByPk(req.params.id);

  if (!hierarquia) {
    return res.status(404).json({ error: 'Hierarquia não encontrada' });
  }

  res.json(hierarquia);
};

exports.update = async (req, res) => {
  const hierarquia = await Hierarquia.findByPk(req.params.id);

  if (!hierarquia) {
    return res.status(404).json({ error: 'Hierarquia não encontrada' });
  }

  await hierarquia.update(req.body);
  res.json(hierarquia);
};

exports.remove = async (req, res) => {
  const hierarquia = await Hierarquia.findByPk(req.params.id);

  if (!hierarquia) {
    return res.status(404).json({ error: 'Hierarquia não encontrada' });
  }

  // Remove acesso dos usuários vinculados
  await Usuario.update(
    { hierarquia_id: null },
    { where: { hierarquia_id: hierarquia.id } }
  );

  await hierarquia.destroy();

  res.status(204).send();
};
