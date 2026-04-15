const router = require('express').Router();
const controller = require('../controllers/relatorio-grade.controller');

// 🔥 ROTA DO PDF
router.get('/pdf', controller.gerarPDF);

module.exports = router;