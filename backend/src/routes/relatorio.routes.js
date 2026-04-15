const router = require("express").Router();

const relatorioController = require("../controllers/relatorio.controller");
const relatorioExportController = require("../controllers/relatorioExportController");

router.get("/professor", relatorioController.relatorioProfessor);
router.get("/multicurso", relatorioController.relatorioMulticurso);

router.get("/export/excel", relatorioExportController.exportRelatorioExcel);
router.get("/export/pdf", relatorioExportController.exportRelatorioPDF);

module.exports = router;