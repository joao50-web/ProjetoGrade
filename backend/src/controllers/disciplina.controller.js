const {
  Disciplina,
  Curso,
  Pessoa,
  Cargo,
  GradeHoraria,
} = require("../models");

/* ======================================================
   CRIAR DISCIPLINA
====================================================== */

exports.create = async (req, res) => {
  try {

    const disciplina =
      await Disciplina.create(
        req.body
      );

    return res
      .status(201)
      .json(disciplina);

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error:
        "Erro ao criar disciplina",
    });
  }
};

/* ======================================================
   LISTAR TODAS
====================================================== */

exports.findAll = async (req, res) => {
  try {

    const disciplinas =
      await Disciplina.findAll({
        include: [
          {
            model: Pessoa,
            as: "professores",

            attributes: [
              "id",
              "nome",
            ],

            through: {
              attributes: [],
            },
          },
        ],

        order: [["nome", "ASC"]],
      });

    return res.json(
      disciplinas
    );

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error:
        "Erro ao listar disciplinas",
    });
  }
};

/* ======================================================
   BUSCAR POR ID
====================================================== */

exports.findById = async (
  req,
  res
) => {
  try {

    const disciplina =
      await Disciplina.findByPk(
        req.params.id,
        {
          include: [
            {
              model: Pessoa,
              as: "professores",

              attributes: [
                "id",
                "nome",
              ],

              through: {
                attributes: [],
              },
            },
          ],
        }
      );

    if (!disciplina) {
      return res.status(404).json({
        error:
          "Disciplina não encontrada",
      });
    }

    return res.json(
      disciplina
    );

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error:
        "Erro ao buscar disciplina",
    });
  }
};

/* ======================================================
   ATUALIZAR
====================================================== */

exports.update = async (
  req,
  res
) => {
  try {

    const disciplina =
      await Disciplina.findByPk(
        req.params.id
      );

    if (!disciplina) {
      return res.status(404).json({
        error:
          "Disciplina não encontrada",
      });
    }

    await disciplina.update(
      req.body
    );

    return res.json(
      disciplina
    );

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error:
        "Erro ao atualizar disciplina",
    });
  }
};

/* ======================================================
   REMOVER
====================================================== */

exports.remove = async (
  req,
  res
) => {
  try {

    const disciplina =
      await Disciplina.findByPk(
        req.params.id
      );

    if (!disciplina) {
      return res.status(404).json({
        error:
          "Disciplina não encontrada",
      });
    }

    /* =========================================
       VERIFICA SE ESTÁ EM USO NA GRADE
    ========================================= */

    const vinculada =
      await GradeHoraria.findOne({
        where: {
          disciplina_id:
            disciplina.id,
        },
      });

    if (vinculada) {
      return res.status(409).json({
        error:
          "Não é possível excluir esta disciplina porque ela está vinculada a uma grade horária.",
      });
    }

    await disciplina.destroy();

    return res.status(200).json({
      message:
        "Disciplina removida com sucesso",
    });

  } catch (err) {

    console.error(
      "Erro ao remover disciplina:",
      err
    );

    /* =========================================
       TRATAMENTO MYSQL FK
    ========================================= */

    if (
      err.name ===
        "SequelizeForeignKeyConstraintError" ||
      err.original?.code ===
        "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        error:
          "Esta disciplina está sendo utilizada na grade horária e não pode ser removida.",
      });
    }

    return res.status(500).json({
      error:
        "Erro interno ao remover disciplina",
    });
  }
};

/* ======================================================
   RELAÇÕES
====================================================== */

exports.findRelations =
  async (req, res) => {
    try {

      const disciplina =
        await Disciplina.findByPk(
          req.params.id,
          {
            include: [
              {
                model: Curso,
                as: "cursos",

                attributes: [
                  "id",
                  "nome",
                ],

                through: {
                  attributes: [],
                },
              },

              {
                model: Pessoa,
                as: "professores",

                attributes: [
                  "id",
                  "nome",
                ],

                include: [
                  {
                    model: Cargo,
                    as: "cargo",

                    attributes: [
                      "nome",
                    ],
                  },
                ],

                through: {
                  attributes: [],
                },
              },
            ],
          }
        );

      if (!disciplina) {
        return res.status(404).json({
          error:
            "Disciplina não encontrada",
        });
      }

      return res.json(
        disciplina
      );

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error:
          "Erro ao buscar relações",
      });
    }
  };

/* ======================================================
   ATUALIZAR RELAÇÕES
====================================================== */

exports.updateRelations =
  async (req, res) => {
    try {

      const {
        cursos = [],
        professores = [],
      } = req.body;

      const disciplina =
        await Disciplina.findByPk(
          req.params.id
        );

      if (!disciplina) {
        return res.status(404).json({
          error:
            "Disciplina não encontrada",
        });
      }

      /* =====================================
         CURSOS
      ===================================== */

      if (
        Array.isArray(cursos)
      ) {
        await disciplina.setCursos(
          cursos
        );
      }

      /* =====================================
         PROFESSORES
      ===================================== */

      if (
        Array.isArray(
          professores
        )
      ) {

        const pessoas =
          await Pessoa.findAll({
            where: {
              id: professores,
            },

            include: [
              {
                model: Cargo,
                as: "cargo",
              },
            ],
          });

        const invalidos =
          pessoas.filter(
            (p) =>
              p.cargo?.nome !==
              "Professor"
          );

        if (
          invalidos.length > 0
        ) {
          return res.status(400).json({
            error:
              "Uma ou mais pessoas não são professores",
          });
        }

        await disciplina.setProfessores(
          professores
        );
      }

      return res.json({
        message:
          "Associações atualizadas com sucesso",
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error:
          "Erro ao atualizar relações",
      });
    }
  };