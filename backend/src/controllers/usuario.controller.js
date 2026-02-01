const { Usuario, Pessoa, Hierarquia } = require('../models');
const bcrypt = require('bcrypt');

exports.create = async (req, res) => {
  const { pessoa_id, login, senha, hierarquia_id } = req.body;

  const pessoa = await Pessoa.findByPk(pessoa_id, {
    include: [{ model: Usuario, as: 'usuario' }]
  });

  if (!pessoa) {
    return res.status(404).json({ error: 'Pessoa não encontrada' });
  }

  if (pessoa.Tb_Usuario) {
    return res
      .status(400)
      .json({ error: 'Esta pessoa já possui usuário' });
  }

  const usuario = await Usuario.create({
    pessoa_id,
    login,
    senha: await bcrypt.hash(senha, 10),
    hierarquia_id
  });

  res.status(201).json(usuario);
};

exports.findAll = async (req, res) => {
  const usuarios = await Usuario.findAll({
    include: [{ model: Pessoa, as: 'pessoa' }, { model: Hierarquia, as: 'hierarquia' }]
  });

  res.json(usuarios);
};

exports.findById = async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id, {
    include: [{ model: Pessoa, as: 'pessoa' }, { model: Hierarquia, as: 'hierarquia' }]
  });

  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  res.json(usuario);
};

exports.update = async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const data = { ...req.body };

  if (data.senha) {
    data.senha = await bcrypt.hash(data.senha, 10);
  }

  await usuario.update(data);
  res.json(usuario);
};

exports.remove = async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  await usuario.destroy();
  res.status(204).send();
};
