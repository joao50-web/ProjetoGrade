const router = require('express').Router();
const controller = require('../controllers/curso.controller');

router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// associação
router.get('/:id/disciplinas', controller.listDisciplinas);
router.post('/:id/disciplinas', controller.updateDisciplinas);
router.get(
  '/:id/disciplinas-professores',
  controller.findDisciplinasComProfessores
);

module.exports = router;
