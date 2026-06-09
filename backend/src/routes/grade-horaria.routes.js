const router = require("express").Router();
const controller = require("../controllers/grade-horaria.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

/* ======================================================
   CONSULTA - Todos os níveis podem ver
====================================================== */
router.get("/", 
  authMiddleware, 
  roleMiddleware(["administrador", "edicao", "visualizacao"]), 
  controller.findByContext
);

/* ======================================================
   SALVAR GRADE COMPLETA - Admin e Edição apenas
====================================================== */
router.post("/save", 
  authMiddleware, 
  roleMiddleware(["administrador", "edicao"]), 
  controller.saveGrade
);

/* ======================================================
   EXCLUIR GRADE COMPLETA - Apenas Admin
====================================================== */
router.delete("/delete", 
  authMiddleware, 
  roleMiddleware(["administrador"]), 
  controller.deleteGrade
);

/* ======================================================
   SLOT ISOLADO - Admin e Edição apenas
====================================================== */
router.post("/", 
  authMiddleware, 
  roleMiddleware(["administrador", "edicao"]), 
  controller.saveSlot
);

module.exports = router;
