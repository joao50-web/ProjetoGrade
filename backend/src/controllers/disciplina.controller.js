const { Disciplina, Curso, Pessoa, Cargo } = require('../models');

// ==== CRIAR DISCIPLINA ====
exports.create = async (req, res) => {
  try {
    const disciplina = await Disciplina.create(req.body);
    res.status(201).json(disciplina);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar disciplina' });
  }
};

// ==== LISTAR TODAS ====
exports.findAll = async (req, res) => {
  const disciplinas = await Disciplina.findAll({
    include: [
      {
        model: Pessoa,
        as: 'professores',
        attributes: ['id', 'nome'],
        through: { attributes: [] }
      }
    ]
  });

  res.json(disciplinas);
};

// ==== ATUALIZAR ====
exports.update = async (req, res) => {
  const disciplina = await Disciplina.findByPk(req.params.id);
  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }

  await disciplina.update(req.body);
  res.json(disciplina);
};

// ==== REMOVER ====
exports.remove = async (req, res) => {
  const disciplina = await Disciplina.findByPk(req.params.id);
  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }

  await disciplina.destroy();
  res.status(204).send();
};

// ==== RELAÇÕES ====
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
        include: [
          {
            model: Cargo,
            as: 'cargo',
            attributes: ['nome']
          }
        ],
        through: { attributes: [] }
      }
    ]
  });

  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }

  res.json(disciplina);
};

// ==== ATUALIZAR RELAÇÕES (COM VALIDAÇÃO) ====
exports.updateRelations = async (req, res) => {
  const { cursos = [], professores = [] } = req.body;

  const disciplina = await Disciplina.findByPk(req.params.id);
  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada' });
  }

  // cursos
  if (Array.isArray(cursos)) {
    await disciplina.setCursos(cursos);
  }

  // professores (VALIDAÇÃO 🔥)
  if (Array.isArray(professores)) {
    const pessoas = await Pessoa.findAll({
      where: { id: professores },
      include: [{ model: Cargo, as: 'cargo' }]
    });

    const invalidos = pessoas.filter(p => p.cargo?.nome !== 'Professor');

    if (invalidos.length > 0) {
      return res.status(400).json({
        error: 'Uma ou mais pessoas não são professores'
      });
    }

    await disciplina.setProfessores(professores);
  }

  res.json({ message: 'Associações atualizadas com sucesso' });
};