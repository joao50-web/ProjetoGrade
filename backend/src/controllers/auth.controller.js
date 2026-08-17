const { Usuario, Pessoa, Hierarquia } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { login, senha } = req.body;

  try {
    // 1. Validação da variável de ambiente no servidor
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("ERRO CRÍTICO: JWT_SECRET não configurado no .env");
      return res.status(500).json({ error: "Erro interno no servidor" });
    }

    // 2. Busca do usuário com associações
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

    // 3. Validação de senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // 4. Mapeamento seguro da role e dados pessoais (evita crashes se null)
    const role = usuario.hierarquia?.descricao ? usuario.hierarquia.descricao : 'visualizacao';
    const nomeUsuario = usuario.pessoa?.nome || usuario.login;
    const emailUsuario = usuario.pessoa?.email || '';

    // 5. Geração do token (Aumentado para 8h para evitar 401 prematuro)
    const token = jwt.sign(
      {
        id: usuario.id,
        role: role
      },
      secret,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
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