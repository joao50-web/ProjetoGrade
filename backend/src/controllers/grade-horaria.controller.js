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

/* ================= BUSCAR GRADE ================= */
exports.findByContext = async (req, res) => {
  try {
    const { curso_id, ano_id, semestre_id, curriculo_id } = req.query;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios não informados' });
    }

    const registros = await GradeHoraria.findAll({
      where: { curso_id, ano_id, semestre_id, curriculo_id },
      include: [
        { model: Disciplina, as: 'disciplina', attributes: ['id', 'nome'] },
        { model: Pessoa, as: 'professor', attributes: ['id', 'nome'] },
        { model: Horario, as: 'horario', attributes: ['id', 'descricao'] },
        { model: DiaSemana, as: 'diaSemana', attributes: ['id', 'descricao'] },
      ],
    });

    res.json(registros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar grade' });
  }
};

/* ================= SALVAR SLOT INDIVIDUAL ================= */
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
      professor_id
    } = req.body;

    if (!curso_id || !coordenador_id || !ano_id || !semestre_id || !curriculo_id || !horario_id || !dia_semana_id) {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar slot' });
  }
};

/* ================= SALVAR GRADE COMPLETA ================= */
exports.saveGrade = async (req, res) => {
  try {
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

      // Salva apenas se houver disciplina, professor pode ser null
      if (!slot.disciplina_id) continue;

      await GradeHoraria.create({
        curso_id: contexto.curso_id,
        coordenador_id: contexto.coordenador_id,
        ano_id: contexto.ano_id,
        semestre_id: contexto.semestre_id,
        curriculo_id: contexto.curriculo_id,
        horario_id: slot.horario_id,
        dia_semana_id: slot.dia_semana_id,
        disciplina_id: slot.disciplina_id,
        professor_id: slot.professor_id || null
      });
    }

    res.json({ message: 'Grade salva com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar grade' });
  }
};