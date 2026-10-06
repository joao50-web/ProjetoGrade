const router = require("express").Router();
const controller = require("../controllers/grade-horaria.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

// Leitura da grade e PDF: edicao pode consultar; escrita é restrita aos papéis abaixo.
const ROLES_LEITURA_GRADE = [
  "administrador",
  "edicao",
  "visualizacao",
  "chefe de departamento",
  "coordenador",
];

const ROLES_EDICAO_GRADE = [
  "administrador",
  "edicao",
  "coordenador",
];

/* GERAR PDF (antes de GET / para evitar colisões de rota) */
router.get(
  "/pdf",
  authMiddleware,
  roleMiddleware(ROLES_LEITURA_GRADE),
  controller.gerarPdf,
);

/* CONSULTAR GRADE */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES_LEITURA_GRADE),
  controller.findByContext,
);

/* SALVAR GRADE COMPLETA */
router.post(
  "/save",
  authMiddleware,
  roleMiddleware(ROLES_EDICAO_GRADE),
  controller.saveGrade,
);

/* EXCLUIR GRADE COMPLETA */
router.delete(
  "/delete",
  authMiddleware,
  roleMiddleware(ROLES_EDICAO_GRADE),
  controller.deleteGrade,
);

/* SALVAR SLOT ISOLADO */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES_EDICAO_GRADE),
  controller.saveSlot,
);

module.exports = router;
