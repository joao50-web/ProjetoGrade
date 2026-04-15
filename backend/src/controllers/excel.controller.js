const ExcelJS = require("exceljs");
const {
  Horario,
  DiaSemana,
  GradeHoraria,
  Disciplina,
  Departamento,
} = require("../models");

exports.exportarExcel = async (req, res) => {
  try {
    const {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      professor_id, // 🔥 opcional
    } = req.query;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
      return res.status(400).json({ error: "Filtros obrigatórios" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Grade");

    const horarios = await Horario.findAll({ order: [["id", "ASC"]] });
    const dias = await DiaSemana.findAll({ order: [["id", "ASC"]] });

    const where = {
      curso_id,
      ano_id,
      semestre_id,
      curriculo_id,
      ...(professor_id ? { professor_id } : {}),
    };

    const grade = await GradeHoraria.findAll({
      where,
      include: [
        {
          model: Disciplina,
          as: "disciplina",
          include: [
            {
              model: Departamento,
              as: "departamento",
              attributes: ["sigla"],
            },
          ],
        },
      ],
    });

    // HEADER
    sheet.addRow(["Horário", ...dias.map((d) => d.descricao)]);

    horarios.forEach((h) => {
      const row = [h.descricao];

      dias.forEach((d) => {
        const item = grade.find(
          (g) =>
            g.horario_id === h.id &&
            g.dia_semana_id === d.id
        );

        if (!item?.disciplina) {
          row.push("");
        } else {
          const sigla = item.disciplina.departamento?.sigla || "";

          row.push(
            `${sigla} (${item.disciplina.codigo})\n${item.disciplina.nome}`
          );
        }
      });

      sheet.addRow(row);
    });

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "center",
        };
      });
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=grade.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar Excel" });
  }
};