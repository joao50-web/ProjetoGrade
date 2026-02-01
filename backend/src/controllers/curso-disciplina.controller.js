//const Curso = require('../models/Curso');
const {Disciplina, Curso} = require('../models');

exports.vincular = async (req, res) => {
  const { cursoId, disciplinaId } = req.body;

  const curso = await Curso.findByPk(cursoId);
  const disciplina = await Disciplina.findByPk(disciplinaId);

  if (!curso || !disciplina) {
    return res.status(404).json({ error: 'Curso ou disciplina não encontrado' });
  }

  await curso.addDisciplina(disciplina);
  res.json({ message: 'Disciplina vinculada ao curso' });
};

exports.listarPorCurso = async (req, res) => {
  const curso = await Curso.findByPk(req.params.id, {
    include: Disciplina
  });

  if (!curso) {
    return res.status(404).json({ error: 'Curso não encontrado' });
  }

  res.json(curso);
};


