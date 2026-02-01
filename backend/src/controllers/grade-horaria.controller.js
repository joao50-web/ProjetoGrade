const {
  Curso,
  GradeHoraria,
  Disciplina,
  Pessoa,
  Horario,
  DiaSemana,
  Ano,
  Semestre
} = require('../models');

exports.findByContext = async (req, res) => {
  const { curso_id, ano_id, semestre_id, curriculo_id } = req.query;

  if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
    return res.status(400).json({
      error: 'Parâmetros obrigatórios não informados'
    });
  }

  const registros = await GradeHoraria.findAll({
    where: { curso_id, ano_id, semestre_id, curriculo_id }
  });

  res.json(registros);
};

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
    !dia_semana_id
  ) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const [registro] = await GradeHoraria.upsert({
    curso_id,
    coordenador_id,
    ano_id,
    semestre_id,
    curriculo_id,
    horario_id,
    dia_semana_id,
    disciplina_id: disciplina_id || null,
    professor_id: professor_id || null
  });

  res.json(registro);
};

exports.saveGrade = async (req, res) => {
  const { contexto, slots } = req.body;

  if (!contexto || !Array.isArray(slots)) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  for (const slot of slots) {
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

    if (!slot.disciplina_id || !slot.professor_id) continue;

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