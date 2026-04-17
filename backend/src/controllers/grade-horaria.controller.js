const {
  Curso,
  GradeHoraria,
  Disciplina,
  Pessoa,
  Horario,
  DiaSemana,
  Departamento
} = require('../models');

/* ================= BUSCAR GRADE (CORRIGIDO) ================= */
exports.findByContext = async (req, res) => {
  try {
    let {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      professor_id,
      coordenador_id
    } = req.query;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios não informados'
      });
    }

    const where = {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id
    };

    // 🔥 TRATAMENTO OBRIGATÓRIO: converte string "null" ou vazio para null e aplica filtro
    if (professor_id !== undefined && professor_id !== '') {
      where.professor_id = (professor_id === 'null' || professor_id === 'undefined') ? null : professor_id;
    }
    if (coordenador_id !== undefined && coordenador_id !== '') {
      where.coordenador_id = (coordenador_id === 'null' || coordenador_id === 'undefined') ? null : coordenador_id;
    }

    // Log para debug (opcional)
    
    //console.log('🔍 WHERE final:', JSON.stringify(where));

    const registros = await GradeHoraria.findAll({
      where,
      include: [
        {
          model: Disciplina,
          as: 'disciplina',
          attributes: ['id', 'codigo', 'nome']
        },
        {
          model: Horario,
          as: 'horario',
          attributes: ['id', 'descricao']
        },
        {
          model: DiaSemana,
          as: 'diaSemana',
          attributes: ['id', 'descricao']
        },
        {
          model: Pessoa,
          as: 'professor',
          attributes: ['id', 'nome']
        },
        {
          model: Pessoa,
          as: 'coordenador',
          attributes: ['id', 'nome']
        }
      ]
    });

    const resultado = registros.map(r => ({
      id: r.id,
      horario_id: r.horario_id,
      dia_semana_id: r.dia_semana_id,
      disciplina_id: r.disciplina_id,
      professor_id: r.professor_id,
      coordenador_id: r.coordenador_id,
      professor: r.professor ? { id: r.professor.id, nome: r.professor.nome } : null,
      coordenador: r.coordenador ? { id: r.coordenador.id, nome: r.coordenador.nome } : null,
      disciplina: r.disciplina ? {
        id: r.disciplina.id,
        nome: r.disciplina.nome,
        codigo: r.disciplina.codigo
      } : null
    }));

    return res.json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar grade' });
  }
};

/* ================= SALVAR SLOT (opcional) ================= */
exports.saveSlot = async (req, res) => {
  try {
    const {
      curso_id,
      coordenador_id,
      professor_id,
      ano_id,
      semestre_id,
      curriculo_id,
      horario_id,
      dia_semana_id,
      disciplina_id
    } = req.body;

    if (
      !curso_id ||
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
      coordenador_id: coordenador_id ?? null,
      professor_id: professor_id ?? null,
      ano_id,
      semestre_id,
      curriculo_id,
      horario_id,
      dia_semana_id,
      disciplina_id: disciplina_id ?? null
    });

    return res.json(registro);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao salvar slot' });
  }
};

/* ================= SALVAR GRADE COMPLETA (CORRIGIDO) ================= */
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
      coordenador_id,
      professor_id
    } = contexto;

    // 1. DELETE específico (inclui professor/coordenador)
    const whereDelete = {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id
    };
    if (professor_id !== undefined) whereDelete.professor_id = professor_id;
    if (coordenador_id !== undefined) whereDelete.coordenador_id = coordenador_id;

    await GradeHoraria.destroy({ where: whereDelete });

    // 2. Normaliza slots (evita sobrescrita dentro da mesma grade)
    const cleanMap = new Map();
    for (const s of slots) {
      const key = `${s.horario_id}-${s.dia_semana_id}`;
      if (s.disciplina_id) {
        cleanMap.set(key, {
          curso_id,
          ano_id,
          semestre_id,
          curriculo_id,
          horario_id: s.horario_id,
          dia_semana_id: s.dia_semana_id,
          disciplina_id: s.disciplina_id,
          coordenador_id: coordenador_id ?? null,
          professor_id: professor_id ?? null
        });
      }
    }

    // 3. Insere
    const inserts = Array.from(cleanMap.values());
    if (inserts.length) {
      await GradeHoraria.bulkCreate(inserts);
    }

    return res.json({
      message: 'Grade sincronizada com sucesso',
      deletados: true,
      inseridos: inserts.length
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Erro ao salvar grade: ' + err.message
    });
  }
};  