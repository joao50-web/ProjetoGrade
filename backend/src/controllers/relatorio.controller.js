const { Op } = require("sequelize");
const { Disciplina, Curso, Departamento, Pessoa } = require("../models");

/* =========================================================
   RELATÓRIO PROFESSOR (VERSÃO LIMPA + PADRONIZADA)
========================================================= */
const relatorioProfessor = async (req, res) => {
  try {
    const { departamento_id, curso_id, professor_id } = req.query;

    const disciplinas = await Disciplina.findAll({
      attributes: ["id", "nome", "codigo"],
      include: [
        {
          model: Pessoa,
          as: "professores",
          attributes: ["id", "nome"],
          through: { attributes: [] },
          required: !!professor_id,
          ...(professor_id && { where: { id: professor_id } }),
        },
        {
          model: Curso,
          as: "cursos",
          attributes: ["id", "nome"],
          through: { attributes: [] },
          required: !!curso_id || !!departamento_id,
          ...(curso_id && { where: { id: curso_id } }),
          include: [
            {
              model: Departamento,
              as: "departamento",
              attributes: ["id", "nome"],
              required: !!departamento_id,
              ...(departamento_id && { where: { id: departamento_id } }),
            },
          ],
        },
      ],
    });

    const resultado = disciplinas
      .map((d) => {
        const cursos = d.cursos || [];
        const professores = d.professores || [];

        return {
          id: d.id,
          nome: d.nome,
          codigo: d.codigo,

          cursos: cursos.map((c) => c.nome),
          professores: professores.map((p) => p.nome),

          totalCursos: cursos.length,
          totalProfessores: professores.length,
        };
      })
      .filter((d) => d.totalCursos > 0);

    return res.json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro relatório professor" });
  }
};

/* =========================================================
   MULTICURSO (LIMPO)
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
      .map((d) => {
        const cursos = d.cursos || [];

        return {
          id: d.id,
          nome: d.nome,
          codigo: d.codigo,
          cursos: cursos.map((c) => c.nome),
          totalCursos: cursos.length,
        };
      })
      .filter((d) => d.totalCursos > 1);

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