const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const {
  Disciplina,
  Curso,
  Departamento,
  Pessoa,
  GradeHoraria,
  Horario,
  DiaSemana,
  Ano,
  Semestre,
  Curriculo,
} = require("../models");

/* =======================================================
   BUSCAR DADOS (SEM ALTERAÇÃO)
======================================================= */

const buscarDados = async (query) => {
  const {
    departamento_id,
    curso_id,
    professor_id,
    disciplina_id,
    ano_id,
    semestre_id,
    curriculo_id,
    tipoRelatorio,
  } = query;

  const where = {};

  if (departamento_id && departamento_id !== "null") where.departamento_id = departamento_id;
  if (curso_id && curso_id !== "null") where.curso_id = curso_id;
  if (professor_id && professor_id !== "null") where.professor_id = professor_id;
  if (disciplina_id && disciplina_id !== "null") where.disciplina_id = disciplina_id;
  if (ano_id && ano_id !== "null") where.ano_id = ano_id;
  if (semestre_id && semestre_id !== "null") where.semestre_id = semestre_id;
  if (curriculo_id && curriculo_id !== "null") where.curriculo_id = curriculo_id;

  const grades = await GradeHoraria.findAll({
    where,
    include: [
      { model: Disciplina, as: "disciplina", required: false },
      { model: Curso, as: "curso", required: false },
      { model: Departamento, as: "departamento", required: false },
      { model: Pessoa, as: "professor", required: false },
      { model: Pessoa, as: "coordenador", required: false },
      { model: Horario, as: "horario", required: false },
      { model: DiaSemana, as: "diaSemana", required: false },
      { model: Ano, as: "ano", required: false },
      { model: Semestre, as: "semestre", required: false },
      { model: Curriculo, as: "curriculo", required: false },
    ],
  });

  const mapa = new Map();

  grades.forEach((g) => {
    if (!g.disciplina) return;

    const chave =
      `${g.disciplina_id}-${g.curso_id}-${g.professor_id}-${g.ano_id}-${g.semestre_id}-${g.curriculo_id}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        id: chave,
        disciplina: g.disciplina?.nome || "-",
        codigo: g.disciplina?.codigo || "-",

        cursos: [],
        professores: [],
        horarios: [],

        departamento: g.departamento?.nome || "-",
        coordenador: g.coordenador?.nome || "-",

        ano: g.ano?.descricao || g.ano?.ano || "-",
        semestre: g.semestre?.descricao || g.semestre?.nome || "-",
        curriculo: g.curriculo?.descricao || g.curriculo?.nome || "-",

        totalCursos: 0,
      });
    }

    const item = mapa.get(chave);

    if (g.curso?.nome && !item.cursos.includes(g.curso.nome)) {
      item.cursos.push(g.curso.nome);
    }

    if (g.professor?.nome && !item.professores.includes(g.professor.nome)) {
      item.professores.push(g.professor.nome);
    }

    const descHorario =
      `${g.diaSemana?.descricao || "-"} - ${g.horario?.descricao || "-"}`;

    if (!item.horarios.find((h) => h.descricao === descHorario)) {
      item.horarios.push({
        dia: g.diaSemana?.descricao || "-",
        horario: g.horario?.descricao || "-",
        descricao: descHorario,
      });
    }

    item.totalCursos = item.cursos.length;
  });

  return Array.from(mapa.values()).map((r) => ({
    ...r,
    multicurso: r.totalCursos > 1,
  }));
};

/* =======================================================
   PDF (SÓ AUMENTEI ESPAÇO ENTRE DISCIPLINA E CÓDIGO)
======================================================= */

const exportRelatorioPDF = async (req, res) => {
  try {
    const dados = await buscarDados(req.query);

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 25,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="relatorio.pdf"'
    );

    doc.pipe(res);

    doc
      .fontSize(16)
      .fillColor("#093E5E")
      .font("Helvetica-Bold")
      .text("RELATÓRIO ACADÊMICO", { align: "center" });

    doc.moveDown(1);

    let y = 60;

    const boxHeight = 118;
    const colLeft = 30;
    const colRight = 420;

    const write = (text, x, y, width = 360) => {
      doc.fontSize(10).fillColor("#111827");
      doc.text(text || "-", x, y, {
        width,
        lineGap: 3,
      });
    };

    dados.forEach((d, index) => {
      const horarios =
        d.horarios.length
          ? d.horarios.map((h) => `${h.dia} - ${h.horario}`).join(" | ")
          : "-";

      doc
        .roundedRect(25, y, 760, boxHeight, 6)
        .strokeColor("#E5E7EB")
        .stroke();

      /* ==================================================
         🔥 COLUNA ESQUERDA (AJUSTE SOLICITADO AQUI)
      ================================================== */

      write(`Disciplina: ${d.disciplina}`, colLeft, y + 8);

      // 🔥 AUMENTEI O ESPAÇO AQUI (ANTES ERA +28, AGORA +40)
      write(`Código: ${d.codigo}`, colLeft, y + 40);

      write(`Departamento: ${d.departamento}`, colLeft, y + 60);

      write(`Coordenador: ${d.coordenador}`, colLeft, y + 80);

      write(`Horários: ${horarios}`, colLeft, y + 100);

      /* ==================================================
         COLUNA DIREITA (INALTERADO)
      ================================================== */

      write(`Professor: ${d.professores.join(", ") || "-"}`, colRight, y + 8);
      write(`Curso: ${d.cursos.join(", ") || "-"}`, colRight, y + 28);
      write(`Ano: ${d.ano}`, colRight, y + 48);
      write(`Semestre: ${d.semestre}`, colRight, y + 68);
      write(`Currículo: ${d.curriculo}`, colRight, y + 88);

      y += boxHeight + 10;

      if (y > 520 && index < dados.length - 1) {
        doc.addPage({ layout: "landscape", margin: 25 });
        y = 60;
      }
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao exportar PDF" });
  }
};

/* =======================================================
   EXCEL (INALTERADO)
======================================================= */

const exportRelatorioExcel = async (req, res) => {
  try {
    const dados = await buscarDados(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Relatório Acadêmico");

    sheet.columns = [
      { header: "DEPARTAMENTO", key: "departamento", width: 30 },
      { header: "DISCIPLINA", key: "disciplina", width: 35 },
      { header: "CÓDIGO", key: "codigo", width: 15 },
      { header: "PROFESSOR", key: "professor", width: 30 },
      { header: "COORDENADOR", key: "coordenador", width: 30 },
      { header: "CURSO", key: "curso", width: 30 },
      { header: "ANO LETIVO", key: "ano", width: 18 },
      { header: "SEMESTRE", key: "semestre", width: 15 },
      { header: "CURRÍCULO", key: "curriculo", width: 25 },
      { header: "DIA", key: "dia", width: 15 },
      { header: "HORÁRIO", key: "horario", width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.values = sheet.columns.map(c => c.header);

    headerRow.font = {
      bold: true,
      color: { argb: "FFFFFF" },
    };

    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "093E5E" },
    };

    let linha = 2;

    dados.forEach((d) => {
      const horarios = d.horarios.length ? d.horarios : [{ dia: "-", horario: "-" }];

      horarios.forEach((h) => {
        sheet.addRow([
          d.departamento || "-",
          d.disciplina || "-",
          d.codigo || "-",
          d.professores.join(", ") || "-",
          d.coordenador || "-",
          d.cursos.join(", ") || "-",
          d.ano || "-",
          d.semestre || "-",
          d.curriculo || "-",
          h.dia || "-",
          h.horario || "-",
        ]);

        linha++;
      });
    });

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao exportar Excel" });
  }
};

module.exports = {
  exportRelatorioExcel,
  exportRelatorioPDF,
};