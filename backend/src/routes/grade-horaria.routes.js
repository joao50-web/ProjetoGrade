const router = require('express').Router();
const controller = require('../controllers/grade-horaria.controller');

router.get('/', controller.findByContext);
router.post('/', controller.saveSlot);
router.post('/save', controller.saveGrade);


module.exports = router;
