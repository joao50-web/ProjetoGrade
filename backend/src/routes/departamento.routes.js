const express = require('express');
const router = express.Router();
const controller = require('../controllers/departamento.controller');

router.get('/', controller.findAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;