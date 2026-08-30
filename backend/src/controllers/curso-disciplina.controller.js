const { Disciplina, Curso, Departamento } = require('../models');

/* ================= LISTAR DISCIPLINAS POR CURSO ================= */
exports.listarPorCurso = async (req, res) => {
  try {
    // 1. Captura os parâmetros enviados pelo frontend
    const { semestre_id, curriculo_id } = req.query;
    
    // 2. Monta o objeto de filtro dinamicamente
    const whereDisciplina = {};
    if (semestre_id && semestre_id !== "null" && semestre_id !== "undefined") {
      whereDisciplina.semestre_id = semestre_id;
    }
    if (curriculo_id && curriculo_id !== "null" && curriculo_id !== "undefined") {
      whereDisciplina.curriculo_id = curriculo_id;
    }

    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Disciplina,
          as: 'disciplinas',
          // 3. Aplica o filtro aqui. Se estiver vazio, não filtra nada.
          where: Object.keys(whereDisciplina).length > 0 ? whereDisciplina : undefined,
          attributes: ['id', 'codigo', 'nome', 'carga_horaria', 'departamento_id'],
          through: { attributes: [] }, // Mantenha ou remova conforme estava no seu arquivo
          include: [
            {
              model: Departamento,
              as: 'departamento',
              attributes: ['id', 'nome', 'sigla'],
            },
          ],
        },
      ],
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

    await curso.setDisciplinas(disciplinas);
    return res.json({ message: 'Vínculos atualizados' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao salvar vínculos' });
  }
};