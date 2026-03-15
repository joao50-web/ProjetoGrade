const { Usuario, Pessoa, Hierarquia } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {

  const { login, senha } = req.body;

  try {

    const usuario = await Usuario.findOne({
      where: { login },
      include: [
        { model: Pessoa, as: 'pessoa' },
        { model: Hierarquia, as: 'hierarquia' }
      ]
    });

    if (!usuario) {
      return res.status(401).json({
        error: 'Usuário não encontrado'
      });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({
        error: 'Senha incorreta'
      });
    }

    // 🔹 pegar hierarquia correta
    const role = usuario.hierarquia
      ? usuario.hierarquia.descricao
      : 'visualizacao';

    const token = jwt.sign(
      {
        id: usuario.id,
        role: role
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.pessoa.nome,
        email: usuario.pessoa.email,
        role: role
      }
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: 'Erro interno'
    });

  }

};