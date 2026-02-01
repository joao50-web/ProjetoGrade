const router = require('express').Router();
const controller = require('../controllers/semestre.controller');

router.get('/', controller.findAll);

module.exports = router;
