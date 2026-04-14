const router = require('express').Router();

const gradeController = require('../controllers/relatorio-grade.controller');
const relatorioController = require('../controllers/relatorio.controller');

router.get('/grade-horaria/pdf', gradeController.gerarPDF);

// 🔥 ESSAS DUAS LINHAS NÃO PODEM FALHAR
router.get('/professor', relatorioController.relatorioProfessor);
router.get('/multicurso', relatorioController.relatorioMulticurso);

module.exports = router;    