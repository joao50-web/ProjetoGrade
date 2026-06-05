require('dotenv').config();

const sequelize = require('../src/config/database');
const Ano = require('../src/models/Ano');
const Semestre = require('../src/models/Semestre');
const Curriculo = require('../src/models/Curriculo');

async function seed() {
  try {
    await sequelize.authenticate();

    // ANOS (formato: 2026/1, 2026/2, etc.)
    for (let ano = 2020; ano <= 2030; ano++) {
      for (const semestre of [1, 2]) {
        await Ano.findOrCreate({
          where: {
            descricao: `${ano}/${semestre}`
          }
        });
      }
    }

    // SEMESTRES
    for (let semestre = 1; semestre <= 10; semestre++) {
      await Semestre.findOrCreate({
        where: {
          descricao: `${semestre}º Semestre`
        }
      });
    }

    // CURRÍCULOS
    await Curriculo.findOrCreate({
      where: {
        descricao: '2023'
      }
    });

    console.log('✅ Ano, Semestre e Currículo inseridos com sucesso');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
}

seed();