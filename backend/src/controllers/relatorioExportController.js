const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const {
  Disciplina,
  Curso,
  Departamento,
  Pessoa,
} = require("../models");

/* =======================================================
   BUSCAR DADOS
======================================================= */

const buscarDados = async (query) => {
  const {
    departamento_id,
    curso_id,
    professor_id,
    tipoRelatorio,
  } = query;

  const disciplinas = await Disciplina.findAll({
    attributes: ["id", "nome", "codigo"],

    include: [
      /* ==========================================
         PROFESSORES
      ========================================== */

      {
        model: Pessoa,
        as: "professores",

        attributes: ["id", "nome"],

        through: {
          attributes: [],
        },

        required: false,

        where: professor_id
          ? { id: professor_id }
          : undefined,
      },

      /* ==========================================
         CURSOS
      ========================================== */

      {
        model: Curso,
        as: "cursos",

        attributes: ["id", "nome"],

        through: {
          attributes: [],
        },

        required:
          !!curso_id || !!departamento_id,

        where: curso_id
          ? { id: curso_id }
          : undefined,

        include: [
          {
            model: Departamento,
            as: "departamento",

            attributes: [
              "id",
              "nome",
            ],

            required:
              !!departamento_id,

            where: departamento_id
              ? {
                  id: departamento_id,
                }
              : undefined,
          },
        ],
      },
    ],
  });

  /* ==========================================
     FORMATAR RESULTADO
  ========================================== */

  let resultado = disciplinas.map(
    (d) => {
      const agora = new Date();

      return {
        id: d.id,

        codigo: d.codigo,

        disciplina: d.nome,

        cursos: (d.cursos || [])
          .map((c) => c.nome),

        professores:
          d.professores &&
          d.professores.length > 0
            ? d.professores.map(
                (p) => p.nome
              )
            : [],

        departamento:
          d.cursos?.[0]
            ?.departamento?.nome ||
          "-",

        data:
          agora.toLocaleDateString(
            "pt-BR"
          ),

        ano:
          agora.getFullYear(),

        totalCursos:
          (d.cursos || []).length,
      };
    }
  );

  /* ==========================================
     RELATÓRIO MULTICURSO
  ========================================== */

  if (tipoRelatorio === "multi") {
    resultado = resultado.filter(
      (d) => d.totalCursos > 1
    );
  }

  return resultado;
};

/* =======================================================
   EXCEL
======================================================= */

const exportRelatorioExcel = async (
  req,
  res
) => {
  try {
    const dados =
      await buscarDados(req.query);

    const tipoRelatorio =
      req.query.tipoRelatorio ||
      "professor";

    const workbook =
      new ExcelJS.Workbook();

    const sheet =
      workbook.addWorksheet(
        tipoRelatorio === "multi"
          ? "Multicurso"
          : "Estrutura Acadêmica"
      );

    /* ==========================================
       COLUNAS
    ========================================== */

    sheet.columns = [
      {
        header: "Código",
        key: "codigo",
        width: 18,
      },

      {
        header: "Disciplina",
        key: "disciplina",
        width: 40,
      },

      {
        header: "Cursos",
        key: "cursos",
        width: 40,
      },

      {
        header: "Professores",
        key: "professores",
        width: 35,
      },

      {
        header: "Departamento",
        key: "departamento",
        width: 30,
      },

      {
        header: "Data",
        key: "data",
        width: 15,
      },

      {
        header: "Ano",
        key: "ano",
        width: 12,
      },
    ];

    /* ==========================================
       HEADER
    ========================================== */

    const headerRow =
      sheet.getRow(1);

    headerRow.font = {
      bold: true,
      color: {
        argb: "FFFFFF",
      },
    };

    headerRow.fill = {
      type: "pattern",
      pattern: "solid",

      fgColor: {
        argb: "093E5E",
      },
    };

    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    headerRow.height = 25;

    /* ==========================================
       DADOS
    ========================================== */

    dados.forEach((d) => {
      const row = sheet.addRow({
        codigo: d.codigo,

        disciplina:
          d.disciplina,

        cursos:
          d.cursos.length > 0
            ? d.cursos.join(", ")
            : "-",

        professores:
          d.professores.length >
          0
            ? d.professores.join(
                ", "
              )
            : "-",

        departamento:
          d.departamento,

        data: d.data,

        ano: d.ano,
      });

      row.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true,
      };

      row.height = 28;

      row.eachCell((cell) => {
        cell.border = {
          top: {
            style: "thin",
          },

          left: {
            style: "thin",
          },

          bottom: {
            style: "thin",
          },

          right: {
            style: "thin",
          },
        };
      });
    });

    /* ==========================================
       DOWNLOAD
    ========================================== */

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${tipoRelatorio}.xlsx"`
    );

    await workbook.xlsx.write(
      res
    );

    res.end();
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error:
        "Erro ao exportar Excel",
    });
  }
};

/* =======================================================
   PDF
======================================================= */

const exportRelatorioPDF = async (
  req,
  res
) => {
  try {
    const dados =
      await buscarDados(req.query);

    const tipoRelatorio =
      req.query.tipoRelatorio ||
      "professor";

    const titulo =
      tipoRelatorio === "multi"
        ? "RELATÓRIO MULTICURSO"
        : "RELATÓRIO ACADÊMICO";

    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${tipoRelatorio}.pdf"`
    );

    doc.pipe(res);

    /* ==========================================
       TÍTULO
    ========================================== */

    doc
      .fontSize(18)
      .text(titulo, {
        align: "center",
      });

    doc.moveDown(2);

    /* ==========================================
       DADOS
    ========================================== */

    dados.forEach((d) => {
      doc
        .fontSize(11)
        .text(
          `Código: ${d.codigo}`
        );

      doc.text(
        `Disciplina: ${d.disciplina}`
      );

      doc.text(
        `Cursos: ${
          d.cursos.length > 0
            ? d.cursos.join(
                ", "
              )
            : "-"
        }`
      );

      doc.text(
        `Professores: ${
          d.professores.length >
          0
            ? d.professores.join(
                ", "
              )
            : "-"
        }`
      );

      doc.text(
        `Departamento: ${d.departamento}`
      );

      doc.text(
        `Data: ${d.data}`
      );

      doc.text(
        `Ano: ${d.ano}`
      );

      /* ======================================
         STATUS MULTICURSO
      ====================================== */

      if (
        tipoRelatorio ===
        "multi"
      ) {
        doc.text(
          `Quantidade de Cursos: ${d.totalCursos}`
        );
      }

      doc.moveDown();

      doc
        .moveTo(30, doc.y)
        .lineTo(560, doc.y)
        .strokeColor("#cccccc")
        .stroke();

      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error:
        "Erro ao exportar PDF",
    });
  }
};

module.exports = {
  exportRelatorioExcel,
  exportRelatorioPDF,
};