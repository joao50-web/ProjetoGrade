const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1️⃣ Token existe?
  if (!authHeader) {
    return res.status(401).json({
      error: 'Token não informado'
    });
  }

  // Esperado: "Bearer TOKEN"
  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({
      error: 'Token mal formatado'
    });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({
      error: 'Token mal formatado'
    });
  }

  // 2️⃣ Validar token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
      decoded esperado:
      {
        id: usuario_id,
        role: 'administrador' | 'edicao' | 'visualizacao',
        iat,
        exp
      }
    */

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Token inválido ou expirado'
    });
  }
};
