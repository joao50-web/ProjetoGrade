const renderTemplate = require('../templates/grade-horaria.template');
const { generatePDF } = require('../services/pdf.service');

const {
  Curso,
  Ano,
  Curriculo,
  Semestre,
  Horario,
  DiaSemana,
  GradeHoraria,
  Disciplina
} = require('../models');

exports.gerarPDF = async (req, res) => {
  try {
    const { curso_id, ano_id, curriculo_id, semestre_id, todos } = req.query;

    if (!curso_id || !ano_id || !curriculo_id) {
      return res.status(400).json({
        error: 'curso_id, ano_id e curriculo_id são obrigatórios'
      });
    }

    /* ================= DADOS BASE ================= */

    const curso = await Curso.findByPk(curso_id);
    const ano = await Ano.findByPk(ano_id);
    const curriculo = await Curriculo.findByPk(curriculo_id);

    if (!curso || !ano || !curriculo) {
      return res.status(404).json({ error: 'Dados não encontrados' });
    }

    /* ================= BUSCA DA GRADE ================= */

    const grades = await GradeHoraria.findAll({
      where: {
        curso_id,
        ano_id,
        curriculo_id,
        ...(todos === 'true' ? {} : { semestre_id })
      },
      include: [
        {
          model: Disciplina,
          as: 'disciplina',
          required: false
        },
        {
          model: Horario,
          as: 'horario'
        },
        {
          model: DiaSemana,
          as: 'diaSemana'
        },
        {
          model: Semestre,
          as: 'semestre'
        }
      ]
    });

    /* ================= HORÁRIOS E DIAS ================= */

    const horarios = await Horario.findAll({ order: [['id', 'ASC']] });
    const dias = await DiaSemana.findAll({ order: [['id', 'ASC']] });

    /* ================= SEMESTRES ================= */

    let semestres = [];

    if (todos === 'true') {
      semestres = await Semestre.findAll({ order: [['id', 'ASC']] });
    } else {
      if (!semestre_id) {
        return res.status(400).json({
          error: 'semestre_id é obrigatório quando todos=false'
        });
      }
      const sem = await Semestre.findByPk(semestre_id);
      if (sem) semestres = [sem];
    }

    /* ================= MONTAGEM FINAL ================= */

    const semestresRender = semestres.map(sem => {
      const registrosSemestre = grades.filter(
        g => g.semestre_id === sem.id
      );

      const linhas = horarios.map(h => {
        const celulas = dias.map(d => {
          const slot = registrosSemestre.find(
            g =>
              g.horario_id === h.id &&
              g.dia_semana_id === d.id
          );

          if (!slot) return '';

          // ✅ AGORA É SOMENTE DISCIPLINA
          return slot.disciplina?.nome || '';
        });

        return {
          horario: h.descricao,
          celulas
        };
      });

      return {
        descricao: sem.descricao,
        dias: dias.map(d => d.descricao),
        linhas
      };
    });

    /* ================= TEMPLATE ================= */

    const html = renderTemplate({
      universidade: 'Universidade Federal de Ciências da Saúde',
      curso: curso.nome,
      curriculo: curriculo.descricao,
      coordenador: '', // removido
      anoLetivo: ano.descricao,
      semestres: semestresRender
    });

    const pdf = await generatePDF(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=grade-${curso.nome}.pdf`
    );

    return res.end(pdf);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
};