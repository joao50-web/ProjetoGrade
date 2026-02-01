const router = require('express').Router();
const controller = require('../controllers/dia-semana.controller');

router.get('/', controller.findAll);

module.exports = router;
