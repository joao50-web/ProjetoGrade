const { Disciplina, Curso, Pessoa } = require('../models');

// ==== CRIAR DISCIPLINA (sem professor obrigatório) ====
exports.create = async (req, res) => {
  try {
    const disciplina = await Disciplina.create(req.body); // Apenas cria
    res.status(201).json(disciplina);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar disciplina' });
  }
};

// ==== LISTAR TODAS AS DISCIPLINAS ====
exports.findAll = async (req, res) => {
  const disciplinas = await Disciplina.findAll();
  res.json(disciplinas);
};

// ==== ATUALIZAR DISCIPLINA ====
exports.update = async (req, res) => {
  const disciplina = await Disciplina.findByPk(req.params.id);
  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }
  await disciplina.update(req.body);
  res.json(disciplina);
};

// ==== REMOVER DISCIPLINA ====
exports.remove = async (req, res) => {
  const disciplina = await Disciplina.findByPk(req.params.id);
  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }
  await disciplina.destroy();
  res.status(204).send();
};

// ==== LISTAR RELAÇÕES (CURSOS E PROFESSORES) ====
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

// ==== ATUALIZAR RELAÇÕES (CURSOS E PROFESSORES) ====
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
    await disciplina.setProfessores(professores); // Professores são opcionais
  }

  res.json({ message: 'Associações atualizadas com sucesso' });
};