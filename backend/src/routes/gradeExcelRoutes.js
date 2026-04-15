const express = require("express");
const router = express.Router();

const gradeExcelController = require("../controllers/gradeExcelController");

// 🔥 ROTA DO EXCEL
router.get("/exportar", gradeExcelController.exportarExcel);

module.exports = router;