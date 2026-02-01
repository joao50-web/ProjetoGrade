const { Cargo, Pessoa } = require('../models');

exports.create = async (req, res) => {
  const cargo = await Cargo.create(req.body);
  res.status(201).json(cargo);
};

exports.findAll = async (req, res) => {
  const cargos = await Cargo.findAll({
    include: [
      {
        model: Pessoa,
        as: 'pessoas'
      }
    ]
  });

  res.json(cargos);
};

exports.findById = async (req, res) => {
  const cargo = await Cargo.findByPk(req.params.id, {
    include: [{ model: Pessoa, as: 'pessoas' }]
  });

  if (!cargo) {
    return res.status(404).json({ error: 'Cargo não encontrado' });
  }

  res.json(cargo);
};

exports.update = async (req, res) => {
  const cargo = await Cargo.findByPk(req.params.id);

  if (!cargo) {
    return res.status(404).json({ error: 'Cargo não encontrado' });
  }

  await cargo.update(req.body);
  res.json(cargo);
};

exports.remove = async (req, res) => {
  const cargo = await Cargo.findByPk(req.params.id, {
    include: [{ model: Pessoa, as: 'pessoas' }]
  });

  if (!cargo) {
    return res.status(404).json({ error: 'Cargo não encontrado' });
  }

  if (cargo.pessoas.length > 0) {
    return res.status(400).json({
      error: 'Cargo possui pessoas vinculadas e não pode ser removido'
    });
  }

  await cargo.destroy();
  res.status(204).send();
};
