const router = require("express").Router();
const controller = require("../controllers/grade-horaria.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

/* ======================================================
   CONSULTA - Admin, Edição, Visualização, Chefe e Coordenador
====================================================== */
router.get("/", 
  authMiddleware, 
  roleMiddleware(["administrador", "edicao", "visualizacao", "chefe de departamento", "coordenador"]), 
  controller.findByContext
);

/* ======================================================
   SALVAR GRADE COMPLETA - Admin, Edição e Coordenador
====================================================== */
router.post("/save", 
  authMiddleware, 
  roleMiddleware(["administrador", "edicao", "coordenador"]), 
  controller.saveGrade
);

/* ======================================================
   EXCLUIR GRADE COMPLETA - Admin, Edição e Coordenador
====================================================== */
router.delete("/delete", 
  authMiddleware, 
  roleMiddleware(["administrador", "edicao", "coordenador"]), 
  controller.deleteGrade
);

/* ======================================================
   SLOT ISOLADO - Admin, Edição e Coordenador
====================================================== */
router.post("/", 
  authMiddleware, 
  roleMiddleware(["administrador", "edicao", "coordenador"]), 
  controller.saveSlot
);

module.exports = router;