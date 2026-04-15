const {
  Curso,
  GradeHoraria,
  Disciplina,
  Pessoa,
  Horario,
  DiaSemana,
  Departamento
} = require('../models');

/* ================= BUSCAR GRADE ================= */
exports.findByContext = async (req, res) => {
  try {
    const { curso_id, ano_id, semestre_id, curriculo_id, professor_id } = req.query;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios não informados' });
    }

    const registros = await GradeHoraria.findAll({
      where: {
        curso_id,
        ano_id,
        semestre_id,
        curriculo_id
        // 🚫 NÃO filtra por professor aqui
      },
      include: [
        {
          model: Disciplina,
          as: 'disciplina',
          attributes: ['id', 'codigo', 'nome'],
          required: false,
          include: [
            {
              model: Curso,
              as: 'cursos',
              attributes: ['id'],
              through: { attributes: [] },
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  attributes: ['sigla']
                }
              ]
            }
          ]
        },
        {
          model: Horario,
          as: 'horario',
          attributes: ['id', 'descricao'],
        },
        {
          model: DiaSemana,
          as: 'diaSemana',
          attributes: ['id', 'descricao'],
        },
      ],
    });

    const resultado = registros.map(r => {
      let textoCompleto = '';

      if (r.disciplina) {
        const curso = r.disciplina.cursos?.[0];
        const sigla = curso?.departamento?.sigla || '';
        const codigo = r.disciplina.codigo || '';
        const nome = r.disciplina.nome || '';

        textoCompleto = `${sigla} (${codigo})\n${nome}`;
      }

      return {
        id: r.id,
        horario_id: r.horario_id,
        dia_semana_id: r.dia_semana_id,
        disciplina_id: r.disciplina_id || null,

        disciplina: r.disciplina
          ? {
              id: r.disciplina.id,
              nome: r.disciplina.nome,
              codigo: r.disciplina.codigo,
              texto: textoCompleto
            }
          : null
      };
    });

    res.json(resultado);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar grade' });
  }
};


/* ================= SALVAR SLOT ================= */
exports.saveSlot = async (req, res) => {
  try {
    const {
      curso_id,
      coordenador_id,
      ano_id,
      semestre_id,
      curriculo_id,
      horario_id,
      dia_semana_id,
      disciplina_id,
    } = req.body;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id || !horario_id || !dia_semana_id) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const [registro] = await GradeHoraria.upsert({
      curso_id,
      coordenador_id: coordenador_id || null,
      ano_id,
      semestre_id,
      curriculo_id,
      horario_id,
      dia_semana_id,
      disciplina_id: disciplina_id || null,
    });

    res.json(registro);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar slot' });
  }
};


/* ================= SALVAR GRADE ================= */
exports.saveGrade = async (req, res) => {
  try {
    const { contexto, slots } = req.body;

    if (!contexto || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      coordenador_id
    } = contexto;

    await GradeHoraria.destroy({
      where: { curso_id, ano_id, semestre_id, curriculo_id }
    });

    const inserts = slots
      .filter(s => s.disciplina_id)
      .map(s => ({
        curso_id,
        ano_id,
        semestre_id,
        curriculo_id,
        horario_id: s.horario_id,
        dia_semana_id: s.dia_semana_id,
        disciplina_id: s.disciplina_id,
        ...(coordenador_id ? { coordenador_id } : {})
      }));

    if (inserts.length > 0) {
      await GradeHoraria.bulkCreate(inserts);
    }

    return res.json({ message: 'Grade salva com sucesso' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao salvar grade' });
  }
};