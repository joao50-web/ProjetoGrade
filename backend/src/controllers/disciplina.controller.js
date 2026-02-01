const { Disciplina, Curso, Pessoa } = require('../models');

// ==== CRUD EXISTENTE (SEM ALTERAÇÃO) ====

exports.create = async (req, res) => {
  const disciplina = await Disciplina.create(req.body);
  res.status(201).json(disciplina);
};

exports.findAll = async (req, res) => {
  const disciplinas = await Disciplina.findAll();
  res.json(disciplinas);
};

exports.update = async (req, res) => {
  const disciplina = await Disciplina.findByPk(req.params.id);
  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }

  await disciplina.update(req.body);
  res.json(disciplina);
};

exports.remove = async (req, res) => {
  const disciplina = await Disciplina.findByPk(req.params.id);
  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }

  await disciplina.destroy();
  res.status(204).send();
};

// ==== NOVO: ASSOCIAÇÕES DA DISCIPLINA ====

/**
 * LISTAR CURSOS E PROFESSORES DA DISCIPLINA
 */
exports.findRelations = async (req, res) => {
  const disciplina = await Disciplina.findByPk(req.params.id, {
    include: [
      {
        model: Curso,
        as: 'cursos',
        attributes: ['id', 'nome'],
        through: { attributes: [] }
      },
      {
        model: Pessoa,
        as: 'professores',
        attributes: ['id', 'nome'],
        through: { attributes: [] }
      }
    ]
  });

  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }

  res.json(disciplina);
};

/**
 * ATUALIZAR CURSOS E PROFESSORES DA DISCIPLINA
 */
exports.updateRelations = async (req, res) => {
  const { cursos = [], professores = [] } = req.body;

  const disciplina = await Disciplina.findByPk(req.params.id);

  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }

  if (Array.isArray(cursos)) {
    await disciplina.setCursos(cursos);
  }

  if (Array.isArray(professores)) {
    await disciplina.setProfessores(professores);
  }

  res.json({ message: 'Associações atualizadas com sucesso' });
};
