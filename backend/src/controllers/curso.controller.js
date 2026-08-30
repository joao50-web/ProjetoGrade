const { Curso, Disciplina, Pessoa, GradeHoraria, Departamento } = require("../models");
const { Sequelize } = require("sequelize");

/* === CREATE === */
exports.create = async (req, res) => {
  try {
    const { nome, coordenador_id } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome do curso é obrigatório" });
    }

    const curso = await Curso.create({
      nome,
      coordenador_id: coordenador_id || null,
    });

    const cursoCriado = await Curso.findByPk(curso.id, {
      include: [
        {
          model: Pessoa,
          as: "coordenador",
          attributes: ["id", "nome"],
        },
      ],
    });

    res.status(201).json(cursoCriado);
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    res.status(500).json({ error: "Erro ao criar curso" });
  }
};

/* ===== LISTAR TODOS ===== */
exports.findAll = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      include: [
        {
          model: Pessoa,
          as: "coordenador",
          attributes: ["id", "nome"],
        },
        {
          model: Disciplina,
          as: "disciplinas",
          attributes: ["id", "codigo", "nome"],
          through: { attributes: [] } // Restaurado para deixar o JSON mais limpo
        },
      ],
      order: [["nome", "ASC"]],
    });
    res.json(cursos);
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);
    res.status(500).json({ error: "Erro ao buscar cursos" });
  }
};

/* === BUSCAR POR ID ==== */
exports.findById = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Pessoa,
          as: "coordenador",
          attributes: ["id", "nome"],
        },
        {
          model: Disciplina,
          as: "disciplinas",
          attributes: ["id", "codigo", "nome"],
          through: { attributes: [] }
        },
      ],
    });

    if (!curso) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }
    res.json(curso);
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    res.status(500).json({ error: "Erro ao buscar curso" });
  }
};

/* ==== UPDATE ===== */
exports.update = async (req, res) => {
  try {
    const { nome, coordenador_id } = req.body;
    const curso = await Curso.findByPk(req.params.id);

    if (!curso) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    await curso.update({
      nome,
      coordenador_id: coordenador_id || null,
    });

    const cursoAtualizado = await Curso.findByPk(curso.id, {
      include: [
        {
          model: Pessoa,
          as: "coordenador",
          attributes: ["id", "nome"],
        },
      ],
    });

    res.json(cursoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    res.status(500).json({ error: "Erro ao atualizar curso" });
  }
};

/* ==== REMOVE ===== */
exports.remove = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);
    if (!curso) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    // CHECAGEM ANTES DE DELETAR (EVITA ERRO 1451)
    const usadoNaGrade = await GradeHoraria.count({
      where: { curso_id: curso.id },
    });

    if (usadoNaGrade > 0) {
      return res.status(409).json({
        error: "Não é possível excluir este curso pois ele está sendo usado na grade horária.",
      });
    }

    await curso.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover curso:", error);
    if (
      error instanceof Sequelize.ForeignKeyConstraintError ||
      error.name === "SequelizeForeignKeyConstraintError" ||
      error.code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        error: "Não é possível excluir este curso pois existem registros vinculados a ele.",
      });
    }
    return res.status(500).json({ error: "Erro interno ao remover curso" });
  }
};

/* ===============================
   LISTAR DISCIPLINAS (Com Filtro)
=============================== */
exports.listDisciplinas = async (req, res) => {
  try {
    const { semestre_id, curriculo_id } = req.query;

    // Monta o filtro apenas se os parâmetros vierem na requisição
    const wherePivot = {};
    if (semestre_id && semestre_id !== "null" && semestre_id !== "undefined") wherePivot.semestre_id = semestre_id;
    if (curriculo_id && curriculo_id !== "null" && curriculo_id !== "undefined") wherePivot.curriculo_id = curriculo_id;

    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Disciplina,
          as: "disciplinas",
          attributes: ["id", "nome", "codigo", "carga_horaria", "departamento_id"],
          // FILTRO APLICADO AQUI:
          through: {
            attributes: [], // Não exibe os dados da tabela pivot no JSON final
            where: Object.keys(wherePivot).length > 0 ? wherePivot : undefined
          },
          include: [
            {
              model: Departamento,
              as: "departamento",
              attributes: ["id", "nome", "sigla"],
            },
          ],
        },
      ],
    });

    if (!curso) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    res.json(curso.disciplinas || []);
  } catch (error) {
    console.error("Erro ao listar disciplinas:", error);
    res.status(500).json({ error: "Erro ao listar disciplinas" });
  }
};


/* ================= SALVAR VÍNCULOS / ATUALIZAR DISCIPLINAS ================= */

exports.updateDisciplinas = async (req, res) => {
  const { sequelize } = require('../models');
  const t = await sequelize.transaction(); // Inicia a transação

  try {
    const { semestre_id, curriculo_id, disciplinas } = req.body; 
    const curso_id = req.params.id;
    const DisciplinaCurso = sequelize.models.tb_disciplina_curso;

    await DisciplinaCurso.destroy({
      where: { curso_id, semestre_id, curriculo_id },
      transaction: t // Associa à transação
    });

    if (disciplinas && disciplinas.length > 0) {
      const novosVinculos = disciplinas.map(disciplina_id => ({
        curso_id, disciplina_id, semestre_id, curriculo_id
      }));
      await DisciplinaCurso.bulkCreate(novosVinculos, { transaction: t }); // Associa à transação
    }

    await t.commit(); // Confirma as alterações apenas se tudo deu certo
    return res.json({ message: 'Grade do semestre atualizada com sucesso!' });
  } catch (error) {
    await t.rollback(); // Desfaz a exclusão se a inserção falhar
    console.error("Erro ao associar disciplinas:", error);
    return res.status(500).json({ error: 'Erro ao salvar vínculos' });
  }
};
/* ===============================
   DISCIPLINAS + PROFESSORES
=============================== */
exports.findDisciplinasComProfessores = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findByPk(id, {
      include: {
        model: Disciplina,
        as: "disciplinas",
        include: [
          {
            model: Pessoa,
            as: "professores",
            attributes: ["id", "nome"],
            through: { attributes: [] },
          },
          {
            model: Departamento,
            as: "departamento",
            attributes: ["id", "nome", "sigla"],
          },
        ],
      },
    });

    if (!curso) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    const result = [];
    curso.disciplinas.forEach((disciplina) => {
      disciplina.professores.forEach((professor) => {
        result.push({
          disciplina_id: disciplina.id,
          disciplina_nome: disciplina.nome,
          professor_id: professor.id,
          professor_nome: professor.nome,
          departamento_id: disciplina.departamento ? disciplina.departamento.id : null,
          departamento_nome: disciplina.departamento ? disciplina.departamento.nome : null,
        });
      });
    });

    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar disciplinas com professores:", error);
    res.status(500).json({ error: "Erro ao buscar disciplinas com professores" });
  }
};

/* ================= LISTAR (Alternativo / Com Filtro) ================= */
exports.listarPorCurso = async (req, res) => {
  try {
    const { semestre_id, curriculo_id } = req.query;

    // Monta o filtro apenas se os parâmetros vierem na requisição
    const wherePivot = {};
    if (semestre_id && semestre_id !== "null" && semestre_id !== "undefined") wherePivot.semestre_id = semestre_id;
    if (curriculo_id && curriculo_id !== "null" && curriculo_id !== "undefined") wherePivot.curriculo_id = curriculo_id;

    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Disciplina,
          as: "disciplinas",
          attributes: ["id", "codigo", "nome", "carga_horaria", "departamento_id"],
          through: {
            attributes: [],
            where: Object.keys(wherePivot).length > 0 ? wherePivot : undefined // CORRETO
          },
          include: [
            {
              model: Departamento,
              as: "departamento",
              attributes: ["id", "nome", "sigla"],
            },
          ],
        },
      ],
    });

    if (!curso) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    return res.json(curso.disciplinas || []);
  } catch (error) {
    console.error("Erro ao listar disciplinas por curso:", error);
    return res.status(500).json({ error: "Erro ao listar disciplinas" });
  }
};

/* ================= SALVAR VÍNCULOS ================= */
exports.salvarVinculos = async (req, res) => {
  try {
    const { disciplinas } = req.body; 
    const curso = await Curso.findByPk(req.params.id);

    if (!curso) return res.status(404).json({ error: 'Curso não encontrado' });

    // O Frontend agora DEVE enviar um array de objetos. 
    // Ex: [{ disciplina_id: 1, semestre_id: 2, curriculo_id: 1 }]
    
    if (disciplinas && disciplinas.length > 0) {
      for (const item of disciplinas) {
        // Se a disciplina já estiver no curso, atualiza. Se não, adiciona.
        await curso.addDisciplina(item.disciplina_id, {
          through: {
            semestre_id: item.semestre_id || null,
            curriculo_id: item.curriculo_id || null
          }
        });
      }
    }

    return res.json({ message: 'Vínculos atualizados com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao salvar vínculos' });
  }
};