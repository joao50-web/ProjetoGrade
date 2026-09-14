const { Disciplina, Curso, Departamento } = require('../models');

/* ================= LISTAR DISCIPLINAS POR CURSO ================= */
exports.listarPorCurso = async (req, res) => {
  try {
    const { semestre_id, curriculo_id } = req.query;
    
    // 1. Monta o objeto de filtro para a tabela PIVOT (intermediária)
    const wherePivot = {};
    if (semestre_id && semestre_id !== "null" && semestre_id !== "undefined") {
      wherePivot.semestre_id = semestre_id;
    }
    if (curriculo_id && curriculo_id !== "null" && curriculo_id !== "undefined") {
      wherePivot.curriculo_id = curriculo_id;
    }

    const curso = await Curso.findByPk(req.params.id, {
      include: [
        {
          model: Disciplina,
          as: 'disciplinas',
          attributes: ['id', 'codigo', 'nome', 'carga_horaria', 'departamento_id'],
          
          // 2. CORREÇÃO AQUI: O "where" entra DENTRO do "through"!
          through: { 
            attributes: [],
            where: Object.keys(wherePivot).length > 0 ? wherePivot : undefined
          },

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

/* ================= SALVAR VÍNCULOS / ATUALIZAR DISCIPLINAS ================= */
// Esta é a forma mais segura (Opção 3 com Transação)
exports.updateDisciplinas = async (req, res) => {
  const { sequelize } = require('../models');
  const t = await sequelize.transaction(); // Inicia a transação de segurança

  try {
    const { semestre_id, curriculo_id, disciplinas } = req.body; 
    const curso_id = req.params.id;
    const DisciplinaCurso = sequelize.models.tb_disciplina_curso;

    // 1. GARANTIA DE SEGURANÇA: Só deleta se souber de qual semestre/currículo estamos falando
    if (!semestre_id || !curriculo_id) {
        return res.status(400).json({ error: "semestre_id e curriculo_id são obrigatórios" });
    }

    // 2. Remove apenas as disciplinas daquele curso, naquele semestre e naquele currículo
    await DisciplinaCurso.destroy({
      where: { 
        curso_id, 
        semestre_id, 
        curriculo_id 
      },
      transaction: t // Associa à transação
    });

    // 3. Insere a nova lista (se houver disciplinas selecionadas)
    if (disciplinas && disciplinas.length > 0) {
      // O Frontend deve enviar apenas um array de IDs. Ex: [101, 105, 110]
      const novosVinculos = disciplinas.map(disciplina_id => ({
        curso_id, 
        disciplina_id, 
        semestre_id, 
        curriculo_id
      }));
      
      await DisciplinaCurso.bulkCreate(novosVinculos, { transaction: t });
    }

    // 4. Se chegou até aqui sem erros, "salva" de verdade no banco
    await t.commit(); 
    return res.json({ message: 'Grade do semestre atualizada com sucesso!' });

  } catch (error) {
    // 5. Se deu QUALQUER erro (ex: banco caiu), ele desfaz o "destroy" (Rollback)
    await t.rollback(); 
    console.error("Erro ao associar disciplinas:", error);
    return res.status(500).json({ error: 'Erro ao salvar vínculos' });
  }
};