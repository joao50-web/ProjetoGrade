const router = require('express').Router();
const controller = require('../controllers/curso-disciplina.controller');

router.get('/cursos/:id/disciplinas', controller.listarPorCurso);
router.post('/cursos/:id/disciplinas', controller.salvarVinculos);

module.exports = router;