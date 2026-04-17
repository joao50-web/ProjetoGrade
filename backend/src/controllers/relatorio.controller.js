const { Op } = require("sequelize");
const { Disciplina, Curso, Departamento, Pessoa } = require("../models");

/* =========================================================
   🔥 RELATÓRIO PROFESSOR (CORRIGIDO E ESTÁVEL)
========================================================= */
const relatorioProfessor = async (req, res) => {
  try {
    const { departamento_id, curso_id, professor_id } = req.query;

    const disciplinas = await Disciplina.findAll({
      attributes: ["id", "nome", "codigo"],

      include: [
        /* ================= PROFESSORES ================= */
        {
          model: Pessoa,
          as: "professores",
          attributes: ["id", "nome"],
          through: { attributes: [] },
          required: !!professor_id,
          ...(professor_id && {
            where: { id: professor_id },
          }),
        },

        /* ================= CURSOS ================= */
        {
          model: Curso,
          as: "cursos",
          attributes: ["id", "nome"],
          through: { attributes: [] },

          required: !!curso_id || !!departamento_id,

          ...(curso_id && {
            where: { id: curso_id },
          }),

          include: [
            {
              model: Departamento,
              as: "departamento",
              attributes: ["id", "nome"],

              required: !!departamento_id,

              ...(departamento_id && {
                where: { id: departamento_id },
              }),
            },
          ],
        },
      ],
    });

    const resultado = disciplinas
      .map((d) => {
        const cursos = (d.cursos || []).map((c) => ({
          id: c.id,
          nome: c.nome,
          departamento: c.departamento || null,
        }));

        const professores = (d.professores || []).map((p) => ({
          id: p.id,
          nome: p.nome,
        }));

        return {
          id: d.id,
          nome: d.nome,
          codigo: d.codigo,
          cursos,
          professores,
          totalCursos: cursos.length,
        };
      })
      .filter((d) => d.cursos.length > 0);

    return res.json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro relatório professor" });
  }
};

/* =========================================================
   🔥 MULTICURSO (CORRIGIDO)
========================================================= */
const relatorioMulticurso = async (req, res) => {
  try {
    const disciplinas = await Disciplina.findAll({
      attributes: ["id", "nome", "codigo"],
      include: [
        {
          model: Curso,
          as: "cursos",
          attributes: ["id", "nome"],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    const resultado = disciplinas
      .map((d) => ({
        id: d.id,
        nome: d.nome,
        codigo: d.codigo,
        cursos: (d.cursos || []).map((c) => ({
          id: c.id,
          nome: c.nome,
        })),
      }))
      .filter((d) => d.cursos.length > 1)
      .map((d) => ({
        ...d,
        totalCursos: d.cursos.length,
      }));

    return res.json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro multicurso" });
  }
};

module.exports = {
  relatorioProfessor,
  relatorioMulticurso,
};