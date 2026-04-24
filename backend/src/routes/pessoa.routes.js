const express = require("express");
const router = express.Router();

const pessoaController = require("../controllers/pessoa.controller");

// 🔥 ROTAS ESPECÍFICAS PRIMEIRO
router.get("/professores", pessoaController.findProfessores);
router.get("/coordenadores", pessoaController.findCoordenadores);

// 🔥 DEPOIS AS GENÉRICAS
router.get("/", pessoaController.findAll);
router.get("/:id", pessoaController.findById);
router.post("/", pessoaController.create);
router.put("/:id", pessoaController.update);
router.delete("/:id", pessoaController.remove);

module.exports = router;