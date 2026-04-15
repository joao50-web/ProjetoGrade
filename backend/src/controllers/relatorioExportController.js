const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const {
  Disciplina,
  Curso,
  Departamento,
  Pessoa
} = require("../models");

/* ================= BASE ================= */
const buscarDados = async (query) => {
  const { departamento_id, curso_id, professor_id } = query;

  const disciplinas = await Disciplina.findAll({
    attributes: ["id", "nome", "codigo"],
    include: [
      {
        model: Pessoa,
        as: "professores",
        attributes: ["nome"],
        through: { attributes: [] },
        where: professor_id ? { id: professor_id } : undefined
      },
      {
        model: Curso,
        as: "cursos",
        attributes: ["nome", "departamento_id"],
        through: { attributes: [] },
        where: curso_id ? { id: curso_id } : undefined,
        include: [
          {
            model: Departamento,
            as: "departamento",
            attributes: ["nome"],
            where: departamento_id ? { id: departamento_id } : undefined
          }
        ]
      }
    ]
  });

  return disciplinas.map(d => ({
    nome: d.nome,
    codigo: d.codigo,
    cursos: d.cursos?.map(c => c.nome).join(", ") || "",
    professores: d.professores?.map(p => p.nome).join(", ") || ""
  }));
};

/* ================= EXCEL ================= */
const exportRelatorioExcel = async (req, res) => {
  try {
    const dados = await buscarDados(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Relatório");

    sheet.columns = [
      { header: "Disciplina", key: "nome", width: 30 },
      { header: "Código", key: "codigo", width: 15 },
      { header: "Cursos", key: "cursos", width: 40 },
      { header: "Professores", key: "professores", width: 40 }
    ];

    dados.forEach(d => sheet.addRow(d));

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

    dados.forEach(d => {
      doc.fontSize(12).text(`Disciplina: ${d.nome}`);
      doc.text(`Código: ${d.codigo}`);
      doc.text(`Cursos: ${d.cursos}`);
      doc.text(`Professores: ${d.professores}`);
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
  exportRelatorioPDF
};