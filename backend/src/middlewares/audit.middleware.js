const { Log, Usuario } = require("../models");

const auditMiddleware = async (req, res, next) => {
  try {
    // Não logar requisições GET
    if (req.method === "GET") {
      return next();
    }

    // req.user deve ser definido por um middleware de autenticação anterior
    const usuarioId = req.user ? req.user.id : null; 

    // Se não houver usuário logado e não for uma rota de autenticação, não logar
    // ou logar como ação anônima se for relevante
    if (!usuarioId && !req.path.includes('/auth')) {
        // Podemos decidir logar ações anônimas importantes ou ignorar
        // Por enquanto, vamos ignorar para ações sem usuário logado fora de auth
        return next();
    }

    const acao = `${req.method} ${req.path}`;
    const entidade = req.path.split('/')[1]; // Ex: 'usuarios', 'pessoas'
    const entidade_id = req.params.id || null;
    const detalhes = { body: req.body, query: req.query, params: req.params };

    await Log.create({
      usuario_id: usuarioId,
      acao,
      entidade,
      entidade_id,
      detalhes,
    });

    next();
  } catch (error) {
    console.error("Erro no middleware de auditoria:", error);
    // Continuar o fluxo da requisição mesmo que o log falhe
    next();
  }
};

module.exports = auditMiddleware;