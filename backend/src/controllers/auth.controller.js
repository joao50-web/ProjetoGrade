const { Usuario, Pessoa, Hierarquia } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { login, senha } = req.body;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("ERRO CRÍTICO: JWT_SECRET não configurado no .env");
      return res.status(500).json({ error: "Erro interno no servidor" });
    }

    const usuario = await Usuario.findOne({
      where: { login },
      include: [
        { model: Pessoa, as: 'pessoa' },
        { model: Hierarquia, as: 'hierarquia' }
      ]
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const role = usuario.hierarquia?.descricao ? usuario.hierarquia.descricao : 'visualizacao';
    const nomeUsuario = usuario.pessoa?.nome || usuario.login;
    const emailUsuario = usuario.pessoa?.email || '';
    
    // Captura o ID da Pessoa vinculada ao Usuário
    const pessoaId = usuario.pessoa_id || (usuario.pessoa ? usuario.pessoa.id : null);

    const token = jwt.sign(
      {
        id: usuario.id,
        pessoa_id: pessoaId,
        role: role
      },
      secret,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        pessoa_id: pessoaId,
        nome: nomeUsuario,
        email: emailUsuario,
        role: role
      }
    });

  } catch (err) {
    console.error("Erro durante o processo de login:", err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};