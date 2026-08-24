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
   BUSCAR DADOS
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
    coordenador_id,
    carga_horaria,
  } = query;

  const where = {};

  if (departamento_id && departamento_id !== "null") where.departamento_id = departamento_id;
  if (curso_id && curso_id !== "null") where.curso_id = curso_id;
  if (professor_id && professor_id !== "null") where.professor_id = professor_id;
  if (disciplina_id && disciplina_id !== "null") where.disciplina_id = disciplina_id;
  if (ano_id && ano_id !== "null") where.ano_id = ano_id;
  if (semestre_id && semestre_id !== "null") where.semestre_id = semestre_id;
  if (curriculo_id && curriculo_id !== "null") where.curriculo_id = curriculo_id;
  if (coordenador_id && coordenador_id !== "null") where.coordenador_id = coordenador_id;

  const includeDisciplina = {
    model: Disciplina,
    as: "disciplina",
    required: false,
    attributes: ["id", "nome", "codigo", "carga_horaria"],
  };

  if (carga_horaria && carga_horaria !== "null") {
    includeDisciplina.where = { carga_horaria: Number(carga_horaria) };
    includeDisciplina.required = true;
  }

  const grades = await GradeHoraria.findAll({
    where,
    include: [
      includeDisciplina,
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

    const chave = `${g.disciplina_id}-${g.curso_id}-${g.professor_id}-${g.ano_id}-${g.semestre_id}-${g.curriculo_id}-${g.coordenador_id}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        id: chave,
        disciplina: g.disciplina?.nome || "-",
        codigo: g.disciplina?.codigo || "-",
        carga_horaria: g.disciplina?.carga_horaria || 0,

        cursos: [],
        professores: [],
        horarios: [],

        departamento: g.departamento?.nome || "-",
        coordenador: g.coordenador?.nome || "-",

        ano: g.ano?.descricao || g.ano?.ano || "-",
        semestre: g.semestre?.descricao || g.semestre?.nome || "-",
        curriculo: g.curriculo?.descricao || g.curriculo?.nome || "-",
      });
    }

    const item = mapa.get(chave);

    if (g.curso?.nome && !item.cursos.includes(g.curso.nome)) {
      item.cursos.push(g.curso.nome);
    }

    if (g.professor?.nome && !item.professores.includes(g.professor.nome)) {
      item.professores.push(g.professor.nome);
    }

    const descHorario = `${g.diaSemana?.descricao || "-"} - ${g.horario?.descricao || "-"}`;

    if (!item.horarios.find((h) => h.descricao === descHorario)) {
      item.horarios.push({
        dia: g.diaSemana?.descricao || "-",
        horario: g.horario?.descricao || "-",
        descricao: descHorario,
      });
    }
  });

  return Array.from(mapa.values());
};

/* =======================================================
   EXPORTAÇÃO: PDF (Layout Institucional)
======================================================= */
const exportRelatorioPDF = async (req, res) => {
  try {
    const dados = await buscarDados(req.query);

    // Ajuste as margens zerando top e bottom para impedir a quebra de página automática do PDFKit
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 0, bottom: 0, left: 40, right: 40 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="relatorio_academico.pdf"');

    doc.pipe(res);

    let pageNum = 1;
    const pageWidth = 841.89; 
    const pageHeight = 595.28;
    const marginLeft = 40;
    const usableWidth = pageWidth - (marginLeft * 2); // 761.89
    
    // Função para desenhar Cabeçalho e Rodapé
    const drawHeaderAndFooter = (pageNumber) => {
      // Diminuída a altura do Header (de 55 para 35)
      doc.rect(0, 0, pageWidth, 35).fill("#093E5E");
      
      // Diminuído o tamanho do Título do Header (de 14 para 11)
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11)
         .text("RELATÓRIO ACADÊMICO - GRADE HORÁRIA", 40, 12);

      // Rodapé 
      const footerY = pageHeight - 30;
      doc.moveTo(40, footerY - 5).lineTo(pageWidth - 40, footerY - 5)
         .lineWidth(0.5).strokeColor("#CBD5E1").stroke();
      
      doc.fillColor("#6B7280").font("Helvetica").fontSize(8)
         .text("Universidade Federal de Ciências da Saúde de Porto Alegre ", 40, footerY, { align: "left", width: 500 });
      
      doc.text(`Página ${pageNumber}`, 40, footerY, { align: "right", width: usableWidth });
    };

    // Função ajustada para evitar uso de "continued: true" que costuma causar bugs de rendering e invisibilidade
    const drawLabelValue = (label, value, x, y, width) => {
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#6B7280");
      doc.text(`${label}: `, x, y, { lineBreak: false });
      
      const labelWidth = doc.widthOfString(`${label}: `);
      doc.font("Helvetica").fillColor("#111827");
      
      // height: 12 e ellipsis limitam visualmente para não descer quebrando o layout da div principal
      doc.text(value || "-", x + labelWidth, y, { width: width - labelWidth, height: 12, ellipsis: true });
    };

    drawHeaderAndFooter(pageNum);
    
    // A posição inicial foi reduzida devido à diminuição do cabeçalho
    let currentY = 55; 
    const boxHeight = 125; 

    if (dados.length === 0) {
      doc.fillColor("#6B7280").font("Helvetica").fontSize(12)
         .text("Nenhum dado encontrado para os filtros selecionados.", 0, pageHeight / 2, { align: "center", width: pageWidth });
    } else {
      dados.forEach((d) => {
        // Verifica se extrapola. Limite puxado ligeiramente pra cima para bater certo.
        if (currentY + boxHeight > pageHeight - 45) {
          // Assegure-se de usar `margins` também na nova página, senão o PDFKit volta pro margin 40 padrão e quebra
          doc.addPage({ size: "A4", layout: "landscape", margins: { top: 0, bottom: 0, left: 40, right: 40 } });
          pageNum++;
          drawHeaderAndFooter(pageNum);
          currentY = 55;
        }

        const horarios = d.horarios.length 
          ? d.horarios.map((h) => `${h.dia} (${h.horario})`).join(" | ") 
          : "-";
        
        const cursosList = d.cursos.join(", ") || "-";
        const professoresList = d.professores.join(", ") || "-";

        // 1. Desenha o Card
        doc.roundedRect(marginLeft, currentY, usableWidth, boxHeight, 6)
           .fillAndStroke("#F9FAFB", "#E5E7EB");

        // 2. Título do Card
        const innerX = marginLeft + 15;
        doc.fillColor("#093E5E").font("Helvetica-Bold").fontSize(11)
           .text(`Disciplina: ${d.disciplina} (${d.codigo})`, innerX, currentY + 12, { width: usableWidth - 30 });

        // 3. Linha Divisória interna
        doc.moveTo(marginLeft, currentY + 32).lineTo(marginLeft + usableWidth, currentY + 32)
           .lineWidth(0.5).strokeColor("#E5E7EB").stroke();

        // 4. Colunas de Informação
        let textY = currentY + 45;
        const lineSpacing = 16;
        const colLeftX = innerX;
        const colRightX = pageWidth / 2 + 10; 
        const colWidth = 350;

        drawLabelValue("Curso(s)", cursosList, colLeftX, textY, colWidth);
        drawLabelValue("Carga Horária", `${d.carga_horaria}h`, colRightX, textY, colWidth);
        
        textY += lineSpacing;
        drawLabelValue("Departamento", d.departamento, colLeftX, textY, colWidth);
        drawLabelValue("Ano Letivo", d.ano, colRightX, textY, colWidth);

        textY += lineSpacing;
        drawLabelValue("Professor(es)", professoresList, colLeftX, textY, colWidth);
        drawLabelValue("Semestre", d.semestre, colRightX, textY, colWidth);

        textY += lineSpacing;
        drawLabelValue("Coordenador", d.coordenador, colLeftX, textY, colWidth);
        drawLabelValue("Currículo", d.curriculo, colRightX, textY, colWidth);

        textY += lineSpacing + 4; 
        drawLabelValue("Horários", horarios, colLeftX, textY, usableWidth - 30);

        currentY += boxHeight + 15; 
      });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao exportar PDF" });
  }
};

/* =======================================================
   EXPORTAÇÃO: EXCEL
======================================================= */
const exportRelatorioExcel = async (req, res) => {
  try {
    const dados = await buscarDados(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Relatório Acadêmico");

    sheet.columns = [
      { header: "DISCIPLINA", key: "disciplina", width: 35 },
      { header: "CÓDIGO", key: "codigo", width: 15 },
      { header: "CURSO", key: "curso", width: 30 },
      { header: "DEPARTAMENTO", key: "departamento", width: 30 },
      { header: "PROFESSOR", key: "professor", width: 30 },
      { header: "COORDENADOR", key: "coordenador", width: 30 },
      { header: "CARGA HORÁRIA", key: "carga_horaria", width: 20 },
      { header: "ANO LETIVO", key: "ano", width: 18 },
      { header: "SEMESTRE", key: "semestre", width: 15 },
      { header: "CURRÍCULO", key: "curriculo", width: 25 },
      { header: "DIA", key: "dia", width: 15 },
      { header: "HORÁRIO", key: "horario", width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.values = sheet.columns.map(c => c.header);

    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "093E5E" },
    };

    dados.forEach((d) => {
      const horarios = d.horarios.length ? d.horarios : [{ dia: "-", horario: "-" }];

      horarios.forEach((h) => {
        sheet.addRow([
          d.disciplina || "-",
          d.codigo || "-",
          d.cursos.join(", ") || "-",
          d.departamento || "-",
          d.professores.join(", ") || "-",
          d.coordenador || "-",
          `${d.carga_horaria}h`,
          d.ano || "-",
          d.semestre || "-",
          d.curriculo || "-",
          h.dia || "-",
          h.horario || "-",
        ]);
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