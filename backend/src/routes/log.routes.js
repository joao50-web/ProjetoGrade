const express = require("express");
const router = express.Router();
const logController = require("../controllers/log.controller");

/* ================= LISTAR ================= */
router.get("/", logController.findAll);

/* ================= NOVOS ================= */
router.delete("/old", logController.cleanOldLogs);
router.delete("/all", logController.clearAllLogs);

module.exports = router;