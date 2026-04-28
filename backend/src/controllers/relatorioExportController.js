const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const {
  Disciplina,
  Curso,
  Departamento,
  Pessoa,
} = require("../models");

/* ================= BASE DE DADOS ================= */
const buscarDados = async (query) => {
  const { departamento_id, curso_id, professor_id } = query;

  const disciplinas = await Disciplina.findAll({
    attributes: ["id", "nome", "codigo"],
    include: [
      {
        model: Pessoa,
        as: "professores",
        attributes: ["id", "nome"],
        through: { attributes: [] },
        required: !!professor_id,
        where: professor_id ? { id: professor_id } : undefined,
      },
      {
        model: Curso,
        as: "cursos",
        attributes: ["id", "nome"],
        through: { attributes: [] },
        required: !!curso_id || !!departamento_id,
        where: curso_id ? { id: curso_id } : undefined,
        include: [
          {
            model: Departamento,
            as: "departamento",
            attributes: ["id", "nome"],
            required: !!departamento_id,
            where: departamento_id ? { id: departamento_id } : undefined,
          },
        ],
      },
    ],
  });

  const resultado = [];

  disciplinas.forEach((d) => {
    const cursos = d.cursos || [];
    const professores = d.professores || [];

    // garante pelo menos 1 linha mesmo se vazio
    if (cursos.length === 0 && professores.length === 0) {
      resultado.push({
        codigo: d.codigo,
        disciplina: d.nome,
        curso: "",
        professor: "",
      });
      return;
    }

    cursos.forEach((c) => {
      professores.forEach((p) => {
        resultado.push({
          codigo: d.codigo,
          disciplina: d.nome,
          curso: c?.nome || "",
          professor: p?.nome || "",
        });
      });

      // caso tenha curso mas não professor
      if (professores.length === 0) {
        resultado.push({
          codigo: d.codigo,
          disciplina: d.nome,
          curso: c?.nome || "",
          professor: "",
        });
      }
    });

    // caso tenha professor mas não curso
    if (cursos.length === 0 && professores.length > 0) {
      professores.forEach((p) => {
        resultado.push({
          codigo: d.codigo,
          disciplina: d.nome,
          curso: "",
          professor: p?.nome || "",
        });
      });
    }
  });

  return resultado;
};

/* ================= EXCEL ================= */
const exportRelatorioExcel = async (req, res) => {
  try {
    const dados = await buscarDados(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Relatório");

    sheet.columns = [
      { header: "Código", key: "codigo", width: 15 },
      { header: "Disciplina", key: "disciplina", width: 35 },
      { header: "Curso", key: "curso", width: 35 },
      { header: "Professor", key: "professor", width: 35 },
    ];

    dados.forEach((d) => sheet.addRow(d));

    // estilo header
    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=relatorio.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro Excel" });
  }
};

/* ================= PDF ================= */
const exportRelatorioPDF = async (req, res) => {
  try {
    const dados = await buscarDados(req.query);

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Relatório de Disciplinas", { align: "center" });
    doc.moveDown();

    dados.forEach((d) => {
      doc.fontSize(12).text(`${d.codigo} - ${d.disciplina}`);
      doc.fontSize(11).text(`Curso: ${d.curso || "-"}`);
      doc.fontSize(11).text(`Professor: ${d.professor || "-"}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro PDF" });
  }
};

module.exports = {
  exportRelatorioExcel,
  exportRelatorioPDF,
};