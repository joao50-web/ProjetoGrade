const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não informado" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Token mal formatado" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token mal formatado" });
  }

  // Previne falha silenciosa por falta de variável de ambiente
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("ERRO CRÍTICO: JWT_SECRET não está definida no arquivo .env");
    return res.status(500).json({ error: "Erro interno de configuração no servidor" });
  }

  try {
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    return next();

  } catch (err) {
    // Imprime o erro exato no terminal do Node.js
    console.error("Falha na validação do JWT:", err.message);

    return res.status(401).json({
      error: "Token inválido ou expirado",
      reason: err.message
    });
  }
};