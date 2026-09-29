// Adicionamos o 'Curso' na importação dos models
const { Usuario, Pessoa, Hierarquia, Curso } = require('../models');
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

    // =========================================================
    // NOVO: BUSCAR O NOME DO CURSO SE O USUÁRIO FOR COORDENADOR
    // =========================================================
    let nomeCurso = "";
    if (role.toLowerCase().includes('coordenador') && pessoaId) {
      try {
        // Busca o curso onde essa pessoa é coordenadora.
        // ATENÇÃO: Se a sua coluna no banco tiver outro nome (ex: pessoa_id), troque 'coordenador_id' abaixo.
        const cursoCoordenado = await Curso.findOne({ 
          where: { coordenador_id: pessoaId } 
        });
        
        if (cursoCoordenado) {
          nomeCurso = cursoCoordenado.nome;
        }
      } catch (err) {
        console.error("Erro ao buscar curso do coordenador:", err);
      }
    }

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
        role: role,
        curso: nomeCurso // <--- ENVIANDO O CURSO PARA O FRONTEND
      }
    });

  } catch (err) {
    console.error("Erro durante o processo de login:", err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};