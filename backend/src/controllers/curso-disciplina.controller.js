const { Disciplina, Curso } = require('../models');

/* ================= LISTAR ================= */
exports.listarPorCurso = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Disciplina,
          as: 'disciplinas',
          attributes: ['id', 'codigo', 'nome'],
          through: { attributes: [] }
        }
      ]
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    return res.json(curso.disciplinas || []);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar disciplinas' });
  }
};

/* ================= SALVAR VÍNCULOS ================= */
exports.salvarVinculos = async (req, res) => {
  try {
    const { disciplinas } = req.body;

    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    // 🔥 substitui tudo (sincroniza)
    await curso.setDisciplinas(disciplinas);

    return res.json({ message: 'Vínculos atualizados' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao salvar vínculos' });
  }
};