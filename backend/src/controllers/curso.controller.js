const { Curso, Disciplina, Pessoa, Departamento } = require('../models');

// ==== CRUD ATUALIZADO COM DEPARTAMENTO ====

exports.create = async (req, res) => {
  try {
    // Agora aceita o departamento_id enviado pelo frontend
    const curso = await Curso.create(req.body);
    res.status(201).json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar curso' });
  }
};

exports.findAll = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      include: [
        // ✅ ADICIONADO: Inclui o Departamento do curso
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

exports.findById = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, {
      // ✅ ADICIONADO: Inclui o Departamento na busca por ID
      include: [{ model: Departamento, as: 'departamento' }]
    });
    if (!curso) return res.status(404).json({ error: 'Curso não encontrado' });
    res.json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar curso' });
  }
};

exports.update = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);
    if (!curso) return res.status(404).json({ error: 'Curso não encontrado' });

    // Atualiza os dados, incluindo o departamento_id se enviado
    await curso.update(req.body);
    res.json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar curso' });
  }
};

exports.remove = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);
    if (!curso) return res.status(404).json({ error: 'Curso não encontrado' });

    await curso.destroy();
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao remover curso' });
  }
};

/**
 * LISTAR DISCIPLINAS ASSOCIADAS AO CURSO
 */
exports.listDisciplinas = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, {
      include: [{ model: Disciplina, as: 'disciplinas' }]
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    res.json(curso.disciplinas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar disciplinas' });
  }
};

/**
 * ATUALIZAR DISCIPLINAS DO CURSO
 * (substitui todas as associações)
 */
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

    // 🔁 monta as combinações disciplina + professor
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