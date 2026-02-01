const router = require('express').Router();
const controller = require('../controllers/disciplina.controller');

router.post('/', controller.create);
router.get('/', controller.findAll);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// associações
router.get('/:id/relations', controller.findRelations);
router.post('/:id/relations', controller.updateRelations);

module.exports = router;
