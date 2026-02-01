const router = require('express').Router();
const controller = require('../controllers/horario.controller');

router.get('/', controller.findAll);

module.exports = router;
