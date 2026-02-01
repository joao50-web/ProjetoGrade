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
  const { curso_id, ano_id, curriculo_id } = req.query;

  if (!curso_id || !ano_id || !curriculo_id) {
    return res.status(400).json({
      error: 'curso_id, ano_id e curriculo_id são obrigatórios'
    });
  }

  // ===== DADOS FIXOS =====
  const curso = await Curso.findByPk(curso_id);
  const ano = await Ano.findByPk(ano_id);
  const curriculo = await Curriculo.findByPk(curriculo_id);

  if (!curso || !ano || !curriculo) {
    return res.status(404).json({ error: 'Dados não encontrados' });
  }

  const coordenador = await Pessoa.findByPk(curso.coordenador_id);

  const horarios = await Horario.findAll({ order: [['id', 'ASC']] });
  const dias = await DiaSemana.findAll({ order: [['id', 'ASC']] });
  const semestres = await Semestre.findAll({ order: [['id', 'ASC']] });

  // ===== BUSCAR TODA A GRADE =====
  const grades = await GradeHoraria.findAll({
    where: {
      curso_id,
      ano_id,
      curriculo_id
    },
    include: [
      { model: Disciplina },
      { model: Pessoa, as: 'professor' },
      { model: Horario },
      { model: DiaSemana },
      { model: Semestre }
    ]
  });

  // ===== MONTAR SEMESTRES =====
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
        if (!slot.disciplina || !slot.professor) return '';
        return `
      ${slot.disciplina.nome}
      ${slot.professor.nome}
        `.trim();
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

  // ===== HTML =====
  const html = renderTemplate({
    universidade: 'Universidade Federal de Ciências da Saúde',
    curso: curso.nome,
    curriculo: curriculo.descricao,
    coordenador: coordenador?.nome || '',
    anoLetivo: ano.descricao,
    semestres: semestresRender
  });

  // ===== PDF =====
  const pdf = await generatePDF(html);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename=grade-${curso.nome}.pdf`
  });

  console.log(html.length);


  const fs = require('fs');

  fs.writeFileSync('teste.pdf', pdf);


  //res.send(pdf);
  res.end(pdf);

};
