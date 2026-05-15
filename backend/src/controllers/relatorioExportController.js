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
    tipoRelatorio,
  } = query;

  /* =====================================================
     WHERE
  ===================================================== */

  const where = {};

  if (
    departamento_id &&
    departamento_id !== "null"
  ) {
    where.departamento_id =
      departamento_id;
  }

  if (
    curso_id &&
    curso_id !== "null"
  ) {
    where.curso_id = curso_id;
  }

  if (
    professor_id &&
    professor_id !== "null"
  ) {
    where.professor_id =
      professor_id;
  }

  if (
    disciplina_id &&
    disciplina_id !== "null"
  ) {
    where.disciplina_id =
      disciplina_id;
  }

  if (
    ano_id &&
    ano_id !== "null"
  ) {
    where.ano_id = ano_id;
  }

  if (
    semestre_id &&
    semestre_id !== "null"
  ) {
    where.semestre_id =
      semestre_id;
  }

  if (
    curriculo_id &&
    curriculo_id !== "null"
  ) {
    where.curriculo_id =
      curriculo_id;
  }

  /* =====================================================
     BUSCA
  ===================================================== */

  const grades =
    await GradeHoraria.findAll({
      where,

      include: [

        {
          model: Disciplina,
          as: "disciplina",
          required: false,
        },

        {
          model: Curso,
          as: "curso",
          required: false,
        },

        {
          model: Departamento,
          as: "departamento",
          required: false,
        },

        {
          model: Pessoa,
          as: "professor",
          required: false,
        },

        {
          model: Horario,
          as: "horario",
          required: false,
        },

        {
          model: DiaSemana,
          as: "diaSemana",
          required: false,
        },

        {
          model: Ano,
          as: "ano",
          required: false,
        },

        {
          model: Semestre,
          as: "semestre",
          required: false,
        },

        {
          model: Curriculo,
          as: "curriculo",
          required: false,
        },
      ],

      order: [
        [
          {
            model: Disciplina,
            as: "disciplina",
          },
          "nome",
          "ASC",
        ],
      ],
    });

  /* =====================================================
     AGRUPAR
  ===================================================== */

  const mapa = new Map();

  grades.forEach((g) => {

    if (!g.disciplina) {
      return;
    }

    const chave =
      `${g.disciplina_id}-${g.curso_id}-${g.professor_id}-${g.ano_id}-${g.semestre_id}-${g.curriculo_id}`;

    if (!mapa.has(chave)) {

      mapa.set(chave, {
        id: chave,

        codigo:
          g.disciplina?.codigo || "-",

        disciplina:
          g.disciplina?.nome || "-",

        cursos: [],

        professores: [],

        horarios: [],

        departamento:
          g.departamento?.nome || "-",

        ano:
          g.ano?.descricao ||
          g.ano?.ano ||
          "-",

        semestre:
          g.semestre?.descricao ||
          g.semestre?.nome ||
          "-",

        curriculo:
          g.curriculo?.descricao ||
          g.curriculo?.nome ||
          "-",

        totalCursos: 0,
      });
    }

    const item =
      mapa.get(chave);

    /* =========================================
       CURSO
    ========================================= */

    if (
      g.curso?.nome &&
      !item.cursos.includes(
        g.curso.nome
      )
    ) {
      item.cursos.push(
        g.curso.nome
      );
    }

    /* =========================================
       PROFESSOR
    ========================================= */

    if (
      g.professor?.nome &&
      !item.professores.includes(
        g.professor.nome
      )
    ) {
      item.professores.push(
        g.professor.nome
      );
    }

    /* =========================================
       HORÁRIO
    ========================================= */

    const descricaoHorario =
      `${g.diaSemana?.descricao || "-"} - ${g.horario?.descricao || "-"}`;

    const jaExiste =
      item.horarios.find(
        (h) =>
          h.descricao ===
          descricaoHorario
      );

    if (!jaExiste) {

      item.horarios.push({
        dia:
          g.diaSemana
            ?.descricao || "-",

        horario:
          g.horario
            ?.descricao || "-",

        descricao:
          descricaoHorario,
      });
    }

    item.totalCursos =
      item.cursos.length;
  });

  /* =====================================================
     RESULTADO
  ===================================================== */

  let resultado =
    Array.from(
      mapa.values()
    ).map((r) => ({
      ...r,

      multicurso:
        r.totalCursos > 1,
    }));

  /* =====================================================
     MULTICURSO
  ===================================================== */

  if (tipoRelatorio === "multi") {

    resultado =
      resultado.filter(
        (r) => r.multicurso
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

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "Projeto Grade";

    workbook.created =
      new Date();

    const sheet =
      workbook.addWorksheet(
        "Relatório Acadêmico",
        {
          views: [
            {
              state: "frozen",
              ySplit: 1,
            },
          ],
        }
      );

    /* ==========================================
       COLUNAS
    ========================================== */

    sheet.columns = [

      {
        header: "DEPARTAMENTO",
        key: "departamento",
        width: 42,
      },

      {
        header: "DISCIPLINA",
        key: "disciplina",
        width: 42,
      },

      {
        header: "CÓDIGO",
        key: "codigo",
        width: 18,
      },

      {
        header: "PROFESSOR",
        key: "professor",
        width: 35,
      },

      {
        header: "CURSO",
        key: "curso",
        width: 35,
      },

      {
        header: "ANO LETIVO",
        key: "ano",
        width: 18,
      },

      {
        header: "SEMESTRE",
        key: "semestre",
        width: 16,
      },

      {
        header: "CURRÍCULO",
        key: "curriculo",
        width: 28,
      },

      {
        header: "DIA",
        key: "dia",
        width: 18,
      },

      {
        header: "HORÁRIO",
        key: "horario",
        width: 22,
      },
    ];

    /* ==========================================
       HEADER
    ========================================== */

    const headerRow =
      sheet.getRow(1);

    headerRow.values = [
      "DEPARTAMENTO",
      "DISCIPLINA",
      "CÓDIGO",
      "PROFESSOR",
      "CURSO",
      "ANO LETIVO",
      "SEMESTRE",
      "CURRÍCULO",
      "DIA",
      "HORÁRIO",
    ];

    headerRow.font = {
      bold: true,
      size: 11,
      color: {
        argb: "FFFFFF",
      },
    };

    headerRow.fill = {
      type: "pattern",
      pattern: "solid",

      fgColor: {
        argb: "1F4E78",
      },
    };

    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    headerRow.height = 28;

    /* ==========================================
       DADOS
    ========================================== */

    let linhaAtual = 2;

    dados.forEach((d, index) => {

      const horarios =
        d.horarios.length > 0
          ? d.horarios
          : [
              {
                dia: "-",
                horario: "-",
              },
            ];

      horarios.forEach((h) => {

        const row =
          sheet.getRow(
            linhaAtual
          );

        row.values = [

          d.departamento,

          d.disciplina,

          d.codigo,

          d.professores.join(", ") ||
            "-",

          d.cursos.join(", ") ||
            "-",

          d.ano,

          d.semestre,

          d.curriculo,

          h.dia,

          h.horario,
        ];

        row.height = 30;

        row.eachCell((cell) => {

          cell.border = {
            top: {
              style: "thin",
              color: {
                argb: "D9D9D9",
              },
            },

            left: {
              style: "thin",
              color: {
                argb: "D9D9D9",
              },
            },

            bottom: {
              style: "thin",
              color: {
                argb: "D9D9D9",
              },
            },

            right: {
              style: "thin",
              color: {
                argb: "D9D9D9",
              },
            },
          };

          cell.alignment = {
            vertical: "middle",
            wrapText: true,
          };

          cell.font = {
            size: 10,
          };

          if (index % 2 === 0) {

            cell.fill = {
              type: "pattern",
              pattern: "solid",

              fgColor: {
                argb: "F8FAFC",
              },
            };
          }
        });

        linhaAtual++;
      });
    });

    /* ==========================================
       FILTRO
    ========================================== */

    sheet.autoFilter = {
      from: "A1",
      to: "J1",
    };

    /* ==========================================
       DOWNLOAD
    ========================================== */

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="relatorio_academico.xlsx"'
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

    const doc =
      new PDFDocument({
        margin: 40,
        size: "A4",
      });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="relatorio_academico.pdf"'
    );

    doc.pipe(res);

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#093E5E")
      .text(
        "RELATÓRIO ACADÊMICO",
        {
          align: "center",
        }
      );

    doc.moveDown(1.5);

    dados.forEach((d, index) => {

      doc
        .roundedRect(
          35,
          doc.y,
          525,
          125
        )
        .strokeColor("#E5E7EB")
        .stroke();

      const inicioY =
        doc.y + 10;

      doc
        .fontSize(13)
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(
          d.disciplina,
          50,
          inicioY
        );

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#374151");

      doc.text(
        `Código: ${d.codigo}`,
        50,
        inicioY + 22
      );

      doc.text(
        `Professor(es): ${
          d.professores.join(
            ", "
          ) || "-"
        }`,
        50,
        inicioY + 38
      );

      doc.text(
        `Curso(s): ${
          d.cursos.join(", ") ||
          "-"
        }`,
        50,
        inicioY + 54
      );

      doc.text(
        `Departamento: ${d.departamento}`,
        50,
        inicioY + 70
      );

      doc.text(
        `Ano Letivo: ${d.ano}`,
        340,
        inicioY + 22
      );

      doc.text(
        `Semestre: ${d.semestre}`,
        340,
        inicioY + 38
      );

      doc.text(
        `Currículo: ${d.curriculo}`,
        340,
        inicioY + 54
      );

      const horariosTexto =
        d.horarios.length > 0
          ? d.horarios
              .map(
                (h) =>
                  `${h.dia} - ${h.horario}`
              )
              .join(" | ")
          : "-";

      doc.text(
        `Horários: ${horariosTexto}`,
        340,
        inicioY + 70,
        {
          width: 180,
        }
      );

      doc.moveDown(8);

      if (
        doc.y > 700 &&
        index <
          dados.length - 1
      ) {
        doc.addPage();
      }
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