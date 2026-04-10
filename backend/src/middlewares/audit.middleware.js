const Log = require("../models/Log");

const auditMiddleware = async (req, res, next) => {
  try {
    // Não logar requisições GET
    if (req.method === "GET") {
      return next();
    }

    const usuarioId = req.user ? req.user.id : null;

    // evita erro de NOT NULL
    if (!usuarioId && !req.path.includes('/auth')) {
      return next();
    }

    const acao = `${req.method} ${req.path}`;
    const entidade = req.path.split('/')[1] || null;
    const entidade_id = req.params.id || null;

    const detalhes = {
      body: req.body,
      query: req.query,
      params: req.params
    };

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
    next();
  }
};

module.exports = auditMiddleware;