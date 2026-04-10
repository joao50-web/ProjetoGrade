const { Log, Usuario, Pessoa } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const logs = await Log.findAll({
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