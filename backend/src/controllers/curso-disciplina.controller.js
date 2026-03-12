const { Disciplina, Curso } = require('../models');


/* ================= VINCULAR DISCIPLINA AO CURSO ================= */

exports.vincular = async (req, res) => {

  try {

    const { cursoId, disciplinaId } = req.body;

    if (!cursoId || !disciplinaId) {
      return res.status(400).json({
        error: 'cursoId e disciplinaId são obrigatórios'
      });
    }

    const curso = await Curso.findByPk(cursoId);
    const disciplina = await Disciplina.findByPk(disciplinaId);

    if (!curso || !disciplina) {
      return res.status(404).json({
        error: 'Curso ou disciplina não encontrado'
      });
    }

    await curso.addDisciplina(disciplina);

    return res.json({
      message: 'Disciplina vinculada ao curso com sucesso'
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: 'Erro ao vincular disciplina ao curso'
    });

  }

};



/* ================= LISTAR DISCIPLINAS DO CURSO ================= */

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
      return res.status(404).json({
        error: 'Curso não encontrado'
      });
    }

    // 🔹 garante retorno limpo
    const disciplinas = curso.disciplinas.map(d => ({
      id: d.id,
      codigo: d.codigo || '',
      nome: d.nome || ''
    }));

    return res.json(disciplinas);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: 'Erro ao listar disciplinas do curso'
    });

  }

};