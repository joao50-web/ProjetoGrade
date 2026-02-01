const router = require('express').Router();
const controller = require('../controllers/curso-disciplina.controller');
//const auth = require('../middlewares/auth.middleware');

//router.use(auth);

router.post('/vincular', controller.vincular);
router.get('/curso/:id', controller.listarPorCurso);

module.exports = router;
