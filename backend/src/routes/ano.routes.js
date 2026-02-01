const router = require('express').Router();
const anoController = require('../controllers/ano.controller');

// Criar ou obter ano (AAAA)
router.post('/get-or-create', anoController.getOrCreate);

// (opcional) listar todos os anos
router.get('/', anoController.findAll);

module.exports = router;
