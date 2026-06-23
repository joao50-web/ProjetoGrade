const express = require("express");
const router = express.Router();

const gradeExcelController = require("../controllers/gradeExcelController");

router.get("/exportar", gradeExcelController.exportarExcel);

module.exports = router;