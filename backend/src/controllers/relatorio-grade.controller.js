const renderTemplate = require("../templates/grade-horaria.template");
const { generatePDF } = require("../services/pdf.service");
const {
  Curso,
  Ano,
  Curriculo,
  Semestre,
  Horario,
  DiaSemana,
  GradeHoraria,
  Disciplina,
  Pessoa,
} = require("../models");

exports.gerarPDF = async (req, res) => {
  try {
    const {
      curso_id,
      ano_id,
      curriculo_id,
      semestre_id,
      professor_id,
      coordenador_id,
      todos,
    } = req.query;

    // Validações obrigatórias
    if (!curso_id || !ano_id || !curriculo_id) {
      return res.status(400).json({ error: "curso_id, ano_id e curriculo_id são obrigatórios" });
    }

    // Dados base
    const curso = await Curso.findByPk(curso_id);
    const ano = await Ano.findByPk(ano_id);
    const curriculo = await Curriculo.findByPk(curriculo_id);
    if (!curso || !ano || !curriculo) {
      return res.status(404).json({ error: "Curso, ano ou currículo não encontrado" });
    }

    let coordenadorNome = null;
    if (coordenador_id && coordenador_id !== "null" && coordenador_id !== "undefined") {
      const coord = await Pessoa.findByPk(coordenador_id);
      coordenadorNome = coord ? coord.nome : null;
    }

    // Filtro da grade
    const whereGrade = { curso_id, ano_id, curriculo_id };
    if (professor_id && professor_id !== "null" && professor_id !== "undefined") {
      whereGrade.professor_id = professor_id;
    }
    if (coordenador_id && coordenador_id !== "null" && coordenador_id !== "undefined") {
      whereGrade.coordenador_id = coordenador_id;
    }

    const grades = await GradeHoraria.findAll({
      where: whereGrade,
      include: [
        { model: Disciplina, as: "disciplina", required: true, attributes: ["id", "codigo", "nome"] },
        { model: Horario, as: "horario" },
        { model: DiaSemana, as: "diaSemana" },
        { model: Semestre, as: "semestre" },
        { model: Pessoa, as: "professor", attributes: ["nome"] },
      ],
    });

    const horarios = await Horario.findAll({ order: [["id", "ASC"]] });
    const dias = await DiaSemana.findAll({ order: [["id", "ASC"]] });

    // Lista de semestres a exibir
    let semestres = [];
    if (todos === "true") {
      semestres = await Semestre.findAll({ order: [["id", "ASC"]] });
    } else if (semestre_id && semestre_id !== "null" && semestre_id !== "undefined") {
      const sem = await Semestre.findByPk(semestre_id);
      if (sem) semestres = [sem];
    } else {
      return res.status(400).json({ error: "semestre_id é obrigatório quando todos=false" });
    }

    if (semestres.length === 0) {
      return res.status(404).json({ error: "Nenhum semestre encontrado" });
    }

    // Montagem dos dados para o template
    const semestresRender = semestres.map((sem) => {
      // 🔥 CORREÇÃO: acessa semestre via g.semestre.id
      const registrosSemestre = grades.filter((g) => g.semestre && g.semestre.id === sem.id);

      const linhas = horarios.map((h) => {
        const celulas = dias.map((d) => {
          const slot = registrosSemestre.find(
            (g) => g.horario_id === h.id && g.dia_semana_id === d.id
          );
          if (!slot || !slot.disciplina) return "";
          let texto = `${slot.disciplina.codigo} - ${slot.disciplina.nome}`;
          if (slot.professor && slot.professor.nome) {
            texto += `\n(${slot.professor.nome})`;
          }
          return texto;
        });
        return { horario: h.descricao, celulas };
      });

      return {
        descricao: sem.descricao || `Semestre ${sem.id}`,
        dias: dias.map((d) => d.descricao),
        linhas,
      };
    });

    const html = renderTemplate({
      universidade: "Universidade Federal de Ciências da Saúde",
      curso: curso.nome,
      curriculo: curriculo.descricao || curriculo.nome,
      coordenador: coordenadorNome || "Não informado",
      anoLetivo: ano.descricao || ano.ano,
      semestres: semestresRender,
    });

    const pdf = await generatePDF(html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=grade-${curso.nome}.pdf`);
    return res.end(pdf);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return res.status(500).json({ error: "Erro interno: " + error.message });
  }
};