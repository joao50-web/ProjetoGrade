const router = require('express').Router();
const controller = require('../controllers/usuario.controller');
const auth = require('../middlewares/auth.middleware');

// Rotas públicas (ex: Cadastro de usuário)
router.post('/', controller.create);

// Rotas protegidas (exigem estar logado)
router.get('/', auth, controller.findAll);
router.get('/:id', auth, controller.findById);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;