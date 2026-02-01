const {
  GradeHoraria,
  Disciplina,
  Horario,
  DiaSemana
} = require('../models');

/**
 * GET /grade-horaria
 * Retorna a grade de um curso em um contexto específico
 */
exports.findByContext = async (req, res) => {
  const {
    curso_id,
    ano_id,
    semestre_id,
    curriculo_id
  } = req.query;

  if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
    return res.status(400).json({
      error: 'Parâmetros obrigatórios não informados'
    });
  }

  const registros = await GradeHoraria.findAll({
    where: {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id
    },
    attributes: [
      'horario_id',
      'dia_semana_id',
      'disciplina_id',
      'professor_id'
    ]
  });

  res.json(registros);
};

/**
 * POST /grade-horaria
 * Cria ou atualiza uma célula da grade
 */
exports.saveSlot = async (req, res) => {
  const {
    curso_id,
    coordenador_id,
    ano_id,
    semestre_id,
    curriculo_id,
    horario_id,
    dia_semana_id,
    disciplina_id,
    professor_id
  } = req.body;

  if (
    !curso_id ||
    !coordenador_id ||
    !ano_id ||
    !semestre_id ||
    !curriculo_id ||
    !horario_id ||
    !dia_semana_id ||
    !disciplina_id ||
    !professor_id 
  ) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const [registro] = await GradeHoraria.upsert(
    {
      curso_id,
      coordenador_id,
      ano_id,
      semestre_id,
      curriculo_id,
      horario_id,
      dia_semana_id,
      disciplina_id: disciplina_id || null,
      professor_id
    },
    {
      returning: true
    }
  );

  res.json(registro);
};

exports.saveGrade = async (req, res) => {
  const { contexto, slots } = req.body;

  if (!contexto || !Array.isArray(slots)) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }
  
  for (const slot of slots) {
    if (!slot.disciplina_id || !slot.professor_id) {
    await GradeHoraria.destroy({
      where: {
        curso_id: contexto.curso_id,
        ano_id: contexto.ano_id,
        semestre_id: contexto.semestre_id,
        curriculo_id: contexto.curriculo_id,
        horario_id: slot.horario_id,
        dia_semana_id: slot.dia_semana_id
      }
    });
    continue;
}


    // 🔥 REMOVE O QUE JÁ EXISTE NO SLOT
    await GradeHoraria.destroy({
      where: {
        curso_id: contexto.curso_id,
        ano_id: contexto.ano_id,
        semestre_id: contexto.semestre_id,
        curriculo_id: contexto.curriculo_id,
        horario_id: slot.horario_id,
        dia_semana_id: slot.dia_semana_id
      }
    });

    // 🔥 INSERE O NOVO VALOR
    await GradeHoraria.create({
      curso_id: contexto.curso_id,
      coordenador_id: contexto.coordenador_id,
      ano_id: contexto.ano_id,
      semestre_id: contexto.semestre_id,
      curriculo_id: contexto.curriculo_id,
      horario_id: slot.horario_id,
      dia_semana_id: slot.dia_semana_id,
      disciplina_id: slot.disciplina_id,
      professor_id: slot.professor_id
    });
  }

  res.json({ message: 'Grade salva com sucesso' });
};

