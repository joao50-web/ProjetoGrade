require('dotenv').config();
const sequelize = require('../src/config/database');
const Ano = require('../src/models/Ano');
const Semestre = require('../src/models/Semestre');
const Curriculo = require('../src/models/Curriculo');

async function seed() {
  await sequelize.authenticate();

  // ANOS
  for (let ano = 2020; ano <= 2030; ano++) {
    await Ano.findOrCreate({
      where: { descricao: String(ano) }
    });
  }

  // SEMESTRES
  await Semestre.findOrCreate({ where: { descricao: '1º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '2º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '3º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '4º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '5º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '6º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '7º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '8º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '9º Semestre' } });
  await Semestre.findOrCreate({ where: { descricao: '10º Semestre' } });


  // CURRÍCULOS
  await Curriculo.findOrCreate({ where: { descricao: '2023' } });

  console.log('✅ Ano, Semestre e Currículo inseridos');
  process.exit();
}

seed();
