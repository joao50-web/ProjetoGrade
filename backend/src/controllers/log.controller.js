const { Op } = require("sequelize");
const Log = require("../models/Log");
const Usuario = require("../models/Usuario");
const Pessoa = require("../models/Pessoa");

/* ================= LISTAR (COM LIMITE) ================= */
exports.findAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const logs = await Log.findAll({
      limit,
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "login"],
          include: [
            {
              model: Pessoa,
              as: "pessoa",
              attributes: ["nome"],
            },
          ],
        },
      ],
      order: [["data_hora", "DESC"]],
    });

    return res.json(logs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao buscar logs",
    });
  }
};

/* ================= LIMPAR LOGS ANTIGOS ================= */
exports.cleanOldLogs = async (req, res) => {
  try {
    const { Op } = require("sequelize");

    const dias = parseInt(req.query.dias) || 30;

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const deletados = await Log.destroy({
      where: {
        data_hora: {
          [Op.lt]: dataLimite,
        },
      },
    });

    return res.json({
      message: `Logs antigos removidos (${deletados})`,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao limpar logs" });
  }
};

/* ================= LIMPAR TODOS ================= */
exports.clearAllLogs = async (req, res) => {
  try {
    await Log.destroy({ where: {} });

    return res.json({
      message: "Todos os logs foram removidos",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao limpar logs" });
  }
};