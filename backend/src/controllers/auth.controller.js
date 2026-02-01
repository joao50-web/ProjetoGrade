const { Usuario, Pessoa, Hierarquia } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { login, senha } = req.body;

  const user = await Usuario.findOne({
    where: { login },
    include: [
      { model: Pessoa, as: 'pessoa' },
      { model: Hierarquia, as: 'hierarquia' }
    ]
  });

  if (!user || !(await bcrypt.compare(senha, user.senha))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (!user.hierarquia_id) {
    return res.status(403).json({
      error: 'Acesso negado. Usuário sem hierarquia definida.'
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.hierarquia.descricao
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token });
};
