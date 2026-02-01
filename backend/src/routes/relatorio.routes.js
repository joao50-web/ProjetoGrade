const router = require('express').Router();
const controller = require('../controllers/relatorio-grade.controller');

router.get('/grade-horaria/pdf', controller.gerarPDF);

module.exports = router;
