const router = require('express').Router();
const controller = require('../controllers/pessoa.controller');
//const auth = require('../middlewares/auth.middleware');

//router.use(auth);
router.get('/coordenadores', controller.findCoordenadores);
router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
