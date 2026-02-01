const router = require('express').Router();
const controller = require('../controllers/cargo.controller');
//const auth = require('../middlewares/auth.middleware');
//const role = require('../middlewares/role.middleware');
//
//router.use(auth);
//router.use(role(['administrador'])); // 🔒 somente admin

router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
