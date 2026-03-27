const { Usuario, Pessoa, Hierarquia } = require('../models');
const bcrypt = require('bcrypt');

exports.create = async (req, res) => {
  try {
    const { pessoa_id, login, senha, hierarquia_id } = req.body;

    const pessoa = await Pessoa.findByPk(pessoa_id, {
      include: [{ model: Usuario, as: 'usuario' }]
    });

    if (!pessoa) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    if (pessoa.usuario) {
      return res
        .status(400)
        .json({ error: 'Esta pessoa já possui usuário' });
    }

    const loginExistente = await Usuario.findOne({ where: { login } });

    if (loginExistente) {
      return res.status(400).json({
        error: 'Já existe um usuário com esse login'
      });
    }

    const usuario = await Usuario.create({
      pessoa_id,
      login,
      senha: await bcrypt.hash(senha, 10),
      hierarquia_id
    });

    return res.status(201).json(usuario);

  } catch (error) {

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Já existe um usuário com esse login'
      });
    }

    console.error(error);

    return res.status(500).json({
      error: 'Erro ao criar usuário'
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        { model: Pessoa, as: 'pessoa' },
        { model: Hierarquia, as: 'hierarquia' }
      ]
    });

    return res.json(usuarios);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Erro ao buscar usuários'
    });
  }
};

exports.findById = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      include: [
        { model: Pessoa, as: 'pessoa' },
        { model: Hierarquia, as: 'hierarquia' }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json(usuario);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Erro ao buscar usuário'
    });
  }
};

exports.update = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const data = { ...req.body };

    if (data.login && data.login !== usuario.login) {
      const loginExistente = await Usuario.findOne({
        where: { login: data.login }
      });

      if (loginExistente) {
        return res.status(400).json({
          error: 'Já existe um usuário com esse login'
        });
      }
    }

    if (data.senha) {
      data.senha = await bcrypt.hash(data.senha, 10);
    }

    await usuario.update(data);

    return res.json(usuario);

  } catch (error) {

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Já existe um usuário com esse login'
      });
    }

    console.error(error);

    return res.status(500).json({
      error: 'Erro ao atualizar usuário'
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await usuario.destroy();

    return res.status(204).send();

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Erro ao remover usuário'
    });
  }
};