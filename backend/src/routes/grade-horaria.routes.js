const router = require("express").Router();
const controller = require("../controllers/grade-horaria.controller");

/* ======================================================
   CONSULTA
====================================================== */
router.get("/", controller.findByContext);

/* ======================================================
   SLOT ISOLADO (uso opcional / futuro)
====================================================== */
router.post("/", controller.saveSlot);

/* ======================================================
   SALVAR GRADE COMPLETA
====================================================== */
router.post("/save", controller.saveGrade);

/* ======================================================
   EXCLUIR GRADE COMPLETA (NOVO)
====================================================== */
router.delete("/delete", controller.deleteGrade);

module.exports = router;