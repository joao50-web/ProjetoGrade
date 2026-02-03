const renderTemplate = require('../templates/grade-horaria.template');
const { generatePDF } = require('../services/pdf.service');

const {
  Curso,
  Pessoa,
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

    const curso = await Curso.findByPk(curso_id);
    const ano = await Ano.findByPk(ano_id);
    const curriculo = await Curriculo.findByPk(curriculo_id);

    if (!curso || !ano || !curriculo) {
      return res.status(404).json({ error: 'Dados não encontrados' });
    }

    const coordenador = await Pessoa.findByPk(curso.coordenador_id);

    const horarios = await Horario.findAll({ order: [['id', 'ASC']] });
    const dias = await DiaSemana.findAll({ order: [['id', 'ASC']] });

    // 🔹 SEMESTRES
    let semestres;

    if (todos === 'true') {
      semestres = await Semestre.findAll({ order: [['id', 'ASC']] });
    } else {
      if (!semestre_id) {
        return res.status(400).json({
          error: 'semestre_id é obrigatório quando todos=false'
        });
      }

      const semestre = await Semestre.findByPk(semestre_id);
      semestres = semestre ? [semestre] : [];
    }

    const grades = await GradeHoraria.findAll({
      where: {
        curso_id,
        ano_id,
        curriculo_id
      },
      include: [
        { model: Disciplina, as: 'disciplina', required: false },
        { model: Pessoa, as: 'professor', required: false },
        { model: Horario, as: 'horario' },
        { model: DiaSemana, as: 'diaSemana' },
        { model: Semestre, as: 'semestre' }
      ]
    });

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

          const disciplina = slot.disciplina?.nome || '';
          const professor = slot.professor?.nome || '';

          if (!disciplina && !professor) return '';

          return `${disciplina}\n${professor}`.trim();
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

    const html = renderTemplate({
      universidade: 'Universidade Federal de Ciências da Saúde',
      curso: curso.nome,
      curriculo: curriculo.descricao,
      coordenador: coordenador?.nome || '',
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
    console.error('Erro ao gerar PDF:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar PDF' });
  }
};