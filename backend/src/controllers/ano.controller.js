const { Ano } = require("../models");

/* ======================================================
   CRIAR ANO LETIVO
====================================================== */

exports.getOrCreate = async (
  req,
  res
) => {

  try {

    const { descricao } =
      req.body;

    /* =========================================
       VALIDAÇÃO
    ========================================= */

    // FORMATO: 2026/1 ou 2026/2

    if (
      !/^\d{4}\/[12]$/.test(
        descricao
      )
    ) {
      return res.status(400).json({
        error:
          "Formato inválido. Use AAAA/1 ou AAAA/2",
      });
    }

    const [ano] =
      await Ano.findOrCreate({
        where: {
          descricao,
        },
      });

    return res.json(ano);

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error:
        "Erro ao salvar ano",
    });
  }
};

/* ======================================================
   LISTAR ANOS
====================================================== */

exports.findAll = async (
  req,
  res
) => {

  try {

    const anos =
      await Ano.findAll({
        order: [
          ["descricao", "DESC"],
        ],
      });

    return res.json(anos);

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error:
        "Erro ao buscar anos",
    });
  }
};