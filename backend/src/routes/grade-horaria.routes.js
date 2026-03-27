const router = require('express').Router();
const controller = require('../controllers/grade-horaria.controller');

// Buscar grade filtrada por contexto
router.get('/', controller.findByContext);

// Salvar um slot único
router.post('/', controller.saveSlot);

// Salvar grade inteira
router.post('/save', controller.saveGrade);

module.exports = router;