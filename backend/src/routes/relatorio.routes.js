const router =
  require("express").Router();

const relatorioController =
  require("../controllers/relatorio.controller");

const relatorioExportController =
  require("../controllers/relatorioExportController");

/* ==========================================
   RELATÓRIO
========================================== */

router.get(
  "/professor",
  relatorioController.relatorioProfessor
);

/* ==========================================
   EXPORTAÇÕES
========================================== */

router.get(
  "/export/excel",
  relatorioExportController.exportRelatorioExcel
);

router.get(
  "/export/pdf",
  relatorioExportController.exportRelatorioPDF
);

module.exports = router;