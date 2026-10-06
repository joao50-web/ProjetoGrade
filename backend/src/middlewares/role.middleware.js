const normalizarPapel = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\(a\)/g, "a")
  .replace(/[_-]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const papelEhEditor = (papel) => /\beditora?\b/.test(papel);

module.exports = (rolesPermitidos = []) => {
  const permitidos = new Set(rolesPermitidos.map(normalizarPapel));
  const permiteEditor = permitidos.has("editor") || permitidos.has("editora");

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const papelUsuario = normalizarPapel(req.user.role);
    const permitido = permitidos.has(papelUsuario) ||
      (permiteEditor && papelEhEditor(papelUsuario));

    if (!permitido) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    return next();
  };
};
