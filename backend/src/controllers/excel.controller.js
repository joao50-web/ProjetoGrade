const ExcelJS = require('exceljs');
const {
  Curso,
  Ano,
  Curriculo,
  Semestre,
  Horario,
  DiaSemana,
  GradeHoraria,
  Disciplina,
  Departamento
} = require('../models');

exports.exportarExcel = async (req, res) => {
  try {
    const { curso_id, ano_id, semestre_id, curriculo_id } = req.query;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Grade');

    const horarios = await Horario.findAll({ order: [['id', 'ASC']] });
    const dias = await DiaSemana.findAll({ order: [['id', 'ASC']] });

    const grade = await GradeHoraria.findAll({
      where: { curso_id, ano_id, semestre_id, curriculo_id },
      include: [
        {
          model: Disciplina,
          as: 'disciplina',
          include: [
            {
              model: Departamento,
              as: 'departamento',
              attributes: ['sigla']
            }
          ]
        }
      ]
    });

    // HEADER
    sheet.addRow(['Horário', ...dias.map(d => d.descricao)]);

    horarios.forEach(h => {
      const row = [h.descricao];

      dias.forEach(d => {
        const item = grade.find(
          g => g.horario_id === h.id && g.dia_semana_id === d.id
        );

        if (!item || !item.disciplina) {
          row.push('');
        } else {
          const sigla = item.disciplina.departamento?.sigla || '';

          row.push(
            `${sigla} (${item.disciplina.codigo})\n${item.disciplina.nome}`
          );
        }
      });

      sheet.addRow(row);
    });

    sheet.eachRow(row => {
      row.eachCell(cell => {
        cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
      });
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=grade.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar Excel' });
  }
};