const {
  Disciplina,
  Curso,
  Departamento,
  Pessoa,
} = require("../models");

/* =========================================================
   RELATÓRIO ESTRUTURA ACADÊMICA
========================================================= */

const relatorioProfessor = async (
  req,
  res
) => {
  try {
    const {
      departamento_id,
      curso_id,
      professor_id,
      disciplina_id,
    } = req.query;

    const whereDisciplina = {};

    if (disciplina_id) {
      whereDisciplina.id =
        disciplina_id;
    }

    const disciplinas =
      await Disciplina.findAll({
        where: whereDisciplina,

        attributes: [
          "id",
          "nome",
          "codigo",
        ],

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

            required: false,

            where: professor_id
              ? {
                  id: professor_id,
                }
              : undefined,
          },

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

            required:
              !!curso_id ||
              !!departamento_id,

            where: curso_id
              ? { id: curso_id }
              : undefined,

            include: [
              {
                model: Departamento,
                as: "departamento",

                attributes: [
                  "id",
                  "nome",
                ],

                required:
                  !!departamento_id,

                where:
                  departamento_id
                    ? {
                        id: departamento_id,
                      }
                    : undefined,
              },
            ],
          },
        ],
      });

    const resultado =
      disciplinas.map((d) => {
        const cursos =
          d.cursos || [];

        const professores =
          d.professores || [];

        return {
          id: d.id,

          nome: d.nome,

          codigo: d.codigo,

          cursos: cursos.map(
            (c) => c.nome
          ),

          professores:
            professores.map(
              (p) => p.nome
            ),

          departamento:
            cursos?.[0]
              ?.departamento
              ?.nome || "-",

          totalCursos:
            cursos.length,

          multicurso:
            cursos.length > 1,
        };
      });

    return res.json(resultado);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error:
        "Erro relatório professor",
    });
  }
};

module.exports = {
  relatorioProfessor,
};