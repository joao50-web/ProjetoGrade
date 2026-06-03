const router = require("express").Router();
const controller = require("../controllers/turma.controller");

router.get("/", controller.findAll);
router.post("/", controller.create);

module.exports = router;