module.exports = (rolesPermitidos = []) => {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    // CORREÇÃO ESSENCIAL: Transforma todas as roles permitidas em minúsculo
    const rolesLower = rolesPermitidos.map(role => role.toLowerCase());
    
    // Transforma a role do usuário logado em minúsculo também
    const userRoleLower = req.user.role ? req.user.role.toLowerCase() : '';

    // Agora a comparação ignora se começou com letra maiúscula ou minúscula
    if (!rolesLower.includes(userRoleLower)) {
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }

    return next();

  };

};