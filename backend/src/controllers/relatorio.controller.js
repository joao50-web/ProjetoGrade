const {
  Disciplina,
  Curso,
  Departamento,
  Pessoa
} = require("../models");

/* ================= NORMALIZAÇÃO ================= */
const normalizar = (disciplinas) => {
  const map = new Map();

  disciplinas.forEach(d => {
    const id = d.id;

    if (!map.has(id)) {
      map.set(id, {
        id: d.id,
        nome: d.nome,
        codigo: d.codigo,
        cursos: [],
        professores: []
      });
    }

    const item = map.get(id);

    (d.cursos || []).forEach(c => {
      if (!item.cursos.find(x => x.id === c.id)) {
        item.cursos.push({ id: c.id, nome: c.nome });
      }
    });

    (d.professores || []).forEach(p => {
      if (!item.professores.find(x => x.id === p.id)) {
        item.professores.push({ id: p.id, nome: p.nome });
      }
    });
  });

  return Array.from(map.values());
};

/* ================= RELATÓRIO PROFESSOR ================= */
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
          required: false,
          where: professor_id ? { id: professor_id } : undefined
        },
        {
          model: Curso,
          as: "cursos",
          attributes: ["id", "nome", "departamento_id"],
          through: { attributes: [] },
          required: false,
          where: curso_id ? { id: curso_id } : undefined,
          include: [
            {
              model: Departamento,
              as: "departamento",
              attributes: ["id", "nome"],
              required: false,
              where: departamento_id ? { id: departamento_id } : undefined
            }
          ]
        }
      ]
    });

    const resultado = normalizar(disciplinas);
    return res.json(resultado);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro relatório professor" });
  }
};

/* ================= RELATÓRIO MULTICURSO ================= */
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
          required: false
        }
      ]
    });

    const base = normalizar(disciplinas);

    const multicurso = base
      .filter(d => d.cursos.length > 1)
      .map(d => ({
        id: d.id,
        nome: d.nome,
        codigo: d.codigo,
        totalCursos: d.cursos.length,
        cursos: d.cursos
      }));

    return res.json(multicurso);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro multicurso" });
  }
};

module.exports = {
  relatorioProfessor,
  relatorioMulticurso
};