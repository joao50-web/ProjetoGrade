const { Op } = require('sequelize');
const {
  Disciplina,
  Curso,
  Departamento,
  DisciplinaCurso,
  Curriculo,
  Semestre,
  sequelize
} = require('../models');

function numeroInteiro(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
}

function idsDeDisciplinasUnicos(lista) {
  if (!Array.isArray(lista)) return [];

  return [
    ...new Set(
      lista
        .map(numeroInteiro)
        .filter((id) => id !== null && id > 0)
    )
  ];
}

async function validarContexto({ cursoId, curriculoId, semestreId }) {
  const [curso, curriculo, semestre] = await Promise.all([
    Curso.findByPk(cursoId, { attributes: ['id', 'nome'] }),
    Curriculo.findByPk(curriculoId, { attributes: ['id', 'descricao'] }),
    Semestre.findByPk(semestreId, { attributes: ['id', 'descricao'] })
  ]);

  return { curso, curriculo, semestre };
}

/* GET /cursos/:id/disciplinas */
exports.listarPorCurso = async (req, res) => {
  try {
    const cursoId = numeroInteiro(req.params.id);
    const semestreId = numeroInteiro(req.query.semestre_id);
    const curriculoId = numeroInteiro(req.query.curriculo_id);

    if (cursoId === null) {
      return res.status(400).json({ error: 'curso_id inválido' });
    }

    // Sem contexto completo, não retorna os vínculos legados com NULL.
    if (semestreId === null || curriculoId === null) {
      return res.status(400).json({
        error: 'Informe semestre_id e curriculo_id para consultar as disciplinas.'
      });
    }

    const { curso, curriculo, semestre } = await validarContexto({
      cursoId,
      curriculoId,
      semestreId
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (!curriculo) {
      return res.status(404).json({ error: 'Currículo não encontrado' });
    }

    if (!semestre) {
      return res.status(404).json({ error: 'Semestre não encontrado' });
    }

    const cursoComDisciplinas = await Curso.findByPk(cursoId, {
      include: [
        {
          model: Disciplina,
          as: 'disciplinas',
          attributes: [
            'id',
            'codigo',
            'nome',
            'carga_horaria',
            'departamento_id'
          ],
          through: {
            attributes: [],
            where: {
              curso_id: cursoId,
              semestre_id: semestreId,
              curriculo_id: curriculoId
            }
          },
          include: [
            {
              model: Departamento,
              as: 'departamento',
              attributes: ['id', 'nome', 'sigla']
            }
          ]
        }
      ]
    });

    // Defesa contra dados antigos que ainda possam estar repetidos.
    const disciplinas = Array.from(
      new Map(
        (cursoComDisciplinas?.disciplinas || []).map((disciplina) => [
          Number(disciplina.id),
          disciplina
        ])
      ).values()
    );

    return res.json(disciplinas);
  } catch (error) {
    console.error('Erro ao listar disciplinas:', error);
    return res.status(500).json({ error: 'Erro ao listar disciplinas' });
  }
};

/* POST/PUT /cursos/:id/disciplinas */
exports.updateDisciplinas = async (req, res) => {
  const cursoId = numeroInteiro(req.params.id);
  const semestreId = numeroInteiro(req.body?.semestre_id);
  const curriculoId = numeroInteiro(req.body?.curriculo_id);

  if (cursoId === null) {
    return res.status(400).json({ error: 'curso_id inválido' });
  }

  if (semestreId === null || curriculoId === null) {
    return res.status(400).json({
      error: 'semestre_id e curriculo_id são obrigatórios e devem ser números inteiros'
    });
  }

  if (!Array.isArray(req.body?.disciplinas)) {
    return res.status(400).json({
      error: 'disciplinas deve ser um array de IDs'
    });
  }

  try {
    const { curso, curriculo, semestre } = await validarContexto({
      cursoId,
      curriculoId,
      semestreId
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (!curriculo) {
      return res.status(404).json({ error: 'Currículo não encontrado' });
    }

    if (!semestre) {
      return res.status(404).json({ error: 'Semestre não encontrado' });
    }

    const disciplinas = idsDeDisciplinasUnicos(req.body.disciplinas);

    if (disciplinas.length > 0) {
      const disciplinasExistentes = await Disciplina.findAll({
        where: { id: { [Op.in]: disciplinas } },
        attributes: ['id']
      });

      const idsExistentes = new Set(
        disciplinasExistentes.map((disciplina) => Number(disciplina.id))
      );

      const idsInvalidos = disciplinas.filter(
        (disciplinaId) => !idsExistentes.has(disciplinaId)
      );

      if (idsInvalidos.length > 0) {
        return res.status(400).json({
          error: 'Uma ou mais disciplinas não existem.',
          disciplinas_invalidas: idsInvalidos
        });
      }
    }

    const transaction = await sequelize.transaction();

    try {
      await DisciplinaCurso.destroy({
        where: {
          curso_id: cursoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId
        },
        transaction
      });

      if (disciplinas.length > 0) {
        await DisciplinaCurso.bulkCreate(
          disciplinas.map((disciplinaId) => ({
            curso_id: cursoId,
            disciplina_id: disciplinaId,
            semestre_id: semestreId,
            curriculo_id: curriculoId
          })),
          { transaction }
        );
      }

      await transaction.commit();

      return res.json({
        message: 'Grade do semestre atualizada com sucesso!',
        curso_id: cursoId,
        curriculo_id: curriculoId,
        semestre_id: semestreId,
        disciplinas_salvas: disciplinas.length
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro ao associar disciplinas:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Já existe uma disciplina repetida neste curso, currículo e semestre.'
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        error: 'Curso, currículo, semestre ou disciplina inválidos.'
      });
    }

    return res.status(500).json({
      error: 'Erro ao salvar vínculos',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
