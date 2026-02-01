const { Pessoa, Cargo, Usuario } = require('../models');

exports.create = async (req, res) => {
  const pessoa = await Pessoa.create(req.body);
  res.status(201).json(pessoa);
};

exports.findAll = async (req, res) => {
  const pessoas = await Pessoa.findAll({
    include: [
      { model: Cargo, as: 'cargo' },
      { model: Usuario, as: 'usuario' }
    ]
  });

  res.json(pessoas);
};

exports.findById = async (req, res) => {
  const pessoa = await Pessoa.findByPk(req.params.id, {
    include: [
      { model: Cargo, as: 'cargo' },
      { model: Usuario, as: 'usuario' }
    ]
  });

  if (!pessoa) {
    return res.status(404).json({ error: 'Pessoa não encontrada' });
  }

  res.json(pessoa);
};

exports.update = async (req, res) => {
  const pessoa = await Pessoa.findByPk(req.params.id);

  if (!pessoa) {
    return res.status(404).json({ error: 'Pessoa não encontrada' });
  }

  await pessoa.update(req.body);
  res.json(pessoa);
};

exports.findCoordenadores = async (req, res) => {
  const pessoas = await Pessoa.findAll({
    include: {
      model: Cargo,
      as: 'cargo',
      where: {
        descricao: 'Coordenador'
      }
    },
    order: [['nome', 'ASC']]
  });

  res.json(pessoas);
};


exports.remove = async (req, res) => {
  const pessoa = await Pessoa.findByPk(req.params.id, {
    include: [{ model: Usuario, as: 'usuario' }]
  });

  if (!pessoa) {
    return res.status(404).json({ error: 'Pessoa não encontrada' });
  }

  if (pessoa.usuario) {
    return res
      .status(400)
      .json({ error: 'Pessoa possui usuário e não pode ser removida' });
  }

  await pessoa.destroy();
  res.status(204).send();
};
