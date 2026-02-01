require('dotenv').config();
const sequelize = require('../src/config/database');
const Horario = require('../src/models/Horario');
const DiaSemana = require('../src/models/DiaSemana');

async function seedGradeBase() {
  try {
    await sequelize.authenticate();

    // ===== DIAS DA SEMANA =====
    const dias = [
      '2ª feira',
      '3ª feira',
      '4ª feira',
      '5ª feira',
      '6ª feira'
    ];

    for (const descricao of dias) {
      await DiaSemana.findOrCreate({
        where: { descricao }
      });
    }

    // ===== HORÁRIOS =====
    const horarios = [
      '13:20-14:10',
      '14:10-15:00',
      '15:00-15:50',
      '15:50-16:40',
      '16:40-17:30',
      '17:30-18:20',
      '18:20-19:10',
      '19:10-20:00',
      '20:00-20:50',
      '20:50-21:40',
      '21:40-22:30'
    ];

    for (const descricao of horarios) {
      await Horario.findOrCreate({
        where: { descricao }
      });
    }

    console.log('✅ Dias da semana e horários inseridos com sucesso');
    process.exit();
  } catch (err) {
    console.error('❌ Erro ao inserir horários/dias', err);
    process.exit(1);
  }
}

seedGradeBase();
