const { Usuario, Pessoa, Hierarquia } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { login, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({
      where: { login },
      include: [{ model: Pessoa, as: 'pessoa' }, { model: Hierarquia, as: 'hierarquia' }]
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        role: usuario.hierarquia ? usuario.hierarquia.nome : 'usuario'
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
};