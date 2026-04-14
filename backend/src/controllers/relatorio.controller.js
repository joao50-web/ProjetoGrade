const {
  Disciplina,
  Curso,
  Departamento,
  Pessoa
} = require('../models');

/* ================= PROFESSOR ================= */
const relatorioProfessor = async (req, res) => {
  try {
    const { departamento_id, curso_id, professor_id } = req.query;

    const disciplinas = await Disciplina.findAll({
      attributes: ['id', 'nome', 'codigo'],
      include: [
        {
          model: Pessoa,
          as: 'professores',
          attributes: ['id', 'nome'],
          through: { attributes: [] },
          where: professor_id ? { id: professor_id } : undefined
        },
        {
          model: Curso,
          as: 'cursos',
          attributes: ['id', 'nome', 'departamento_id'],
          through: { attributes: [] },
          where: curso_id ? { id: curso_id } : undefined,
          include: [
            {
              model: Departamento,
              as: 'departamento',
              attributes: ['id', 'nome'],
              where: departamento_id ? { id: departamento_id } : undefined
            }
          ]
        }
      ]
    });

    res.json(disciplinas);

  } catch (err) {
    console.error("🔥 ERRO PROFESSOR:", err);
    res.status(500).json({ error: 'Erro no relatório professor' });
  }
};

/* ================= MULTICURSO ================= */
const relatorioMulticurso = async (req, res) => {
  try {
    const { departamento_id } = req.query;

    const disciplinas = await Disciplina.findAll({
      attributes: ['id', 'nome', 'codigo'],
      include: [
        {
          model: Curso,
          as: 'cursos',
          attributes: ['id', 'nome', 'departamento_id'],
          through: { attributes: [] }
        }
      ]
    });

    const multicursos = disciplinas
      .filter(d => {
        if (d.cursos.length <= 1) return false;
        if (!departamento_id) return true;

        return d.cursos.some(c => c.departamento_id == departamento_id);
      })
      .map(d => ({
        id: d.id,
        nome: d.nome,
        codigo: d.codigo,
        totalCursos: d.cursos.length,
        cursos: d.cursos.map(c => c.nome)
      }));

    res.json(multicursos);

  } catch (err) {
    console.error("🔥 ERRO MULTICURSO:", err);
    res.status(500).json({ error: 'Erro no relatório multicurso' });
  }
};

/* ✅ EXPORT CORRETO */
module.exports = {
  relatorioProfessor,
  relatorioMulticurso
};