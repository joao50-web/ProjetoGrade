const { Curso, Disciplina, Pessoa, Departamento } = require('../models');

// ===============================
// CREATE
// ===============================
exports.create = async (req, res) => {
  try {
    const curso = await Curso.create(req.body);
    res.status(201).json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar curso' });
  }
};

// ===============================
// LISTAR TODOS
// ===============================
exports.findAll = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      include: [
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['id', 'nome', 'sigla']
        },
        {
          model: Disciplina,
          as: 'disciplinas',
          attributes: ['id', 'codigo', 'nome'],
          through: { attributes: [] }
        }
      ],
      order: [['nome', 'ASC']]
    });

    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
};

// ===============================
// BUSCAR POR ID
// ===============================
exports.findById = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['id', 'nome', 'sigla']
        }
      ]
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    res.json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar curso' });
  }
};

// ===============================
// UPDATE
// ===============================
exports.update = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    await curso.update(req.body);

    res.json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar curso' });
  }
};

// ===============================
// DELETE
// ===============================
exports.remove = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    await curso.destroy();

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao remover curso' });
  }
};

// ===============================
// 🔥 LISTAR DISCIPLINAS (AJUSTADO PRA GRADE)
// ===============================
exports.listDisciplinas = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Disciplina,
          as: 'disciplinas',
          attributes: ['id', 'nome', 'codigo'],
          through: { attributes: [] }
        },
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['sigla']
        }
      ]
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    // 🔥 FORMATAÇÃO IDEAL PRA GRADE
    const resultado = curso.disciplinas.map((d) => ({
      id: d.id,
      nome: d.nome,
      codigo: d.codigo,
      departamento_sigla: curso.departamento?.sigla || ''
    }));

    res.json(resultado);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar disciplinas' });
  }
};

// ===============================
// ATUALIZAR DISCIPLINAS DO CURSO
// ===============================
exports.updateDisciplinas = async (req, res) => {
  try {
    const { disciplinas } = req.body;

    if (!Array.isArray(disciplinas)) {
      return res.status(400).json({ error: 'disciplinas deve ser um array' });
    }

    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    await curso.setDisciplinas(disciplinas);

    res.json({ message: 'Disciplinas associadas com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao associar disciplinas' });
  }
};

// ===============================
// DISCIPLINAS + PROFESSORES
// ===============================
exports.findDisciplinasComProfessores = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findByPk(id, {
      include: {
        model: Disciplina,
        as: 'disciplinas',
        include: {
          model: Pessoa,
          as: 'professores',
          attributes: ['id', 'nome'],
          through: { attributes: [] }
        }
      }
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const result = [];

    curso.disciplinas.forEach(disciplina => {
      disciplina.professores.forEach(professor => {
        result.push({
          disciplina_id: disciplina.id,
          disciplina_nome: disciplina.nome,
          professor_id: professor.id,
          professor_nome: professor.nome
        });
      });
    });

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas com professores' });
  }
};