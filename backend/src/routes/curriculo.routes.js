const router = require('express').Router();
const curriculoController = require('../controllers/curriculo.controller');

// Criar ou obter currículo (AAAA)
router.post('/get-or-create', curriculoController.getOrCreate);

// (opcional) listar todos os currículos
router.get('/', curriculoController.findAll);

module.exports = router;
