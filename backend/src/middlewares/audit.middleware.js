const Log = require("../models/Log");

const auditMiddleware = async (req, res, next) => {
  try {
    // Ignora GET (como você já queria)
    if (req.method === "GET") {
      return next();
    }

    const usuarioId = req.user?.id;

    // 🚨 REGRA IMPORTANTE:
    // Se não tem usuário logado, NÃO tenta salvar log
    if (!usuarioId) {
      return next();
    }

    const acao = `${req.method} ${req.originalUrl || req.path}`;

    const entidade = req.path.split("/")[1] || null;
    const entidade_id = req.params?.id || null;

    await Log.create({
      usuario_id: usuarioId,
      acao,
      entidade,
      entidade_id,
      detalhes: {
        body: req.body || null,
        query: req.query || null,
        params: req.params || null,
      },
    });

    return next();

  } catch (error) {
    console.error("Erro no middleware de auditoria:", error);
    return next(); // nunca quebra API
  }
};

module.exports = auditMiddleware;