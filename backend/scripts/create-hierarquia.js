require('dotenv').config();
const sequelize = require('../src/config/database');
const Hierarquia = require('../src/models/Hierarquia');

async function seedHierarquia() {
  try {

    await sequelize.authenticate();

    const hierarquias = [
      'visualizacao',
      'edicao',
      'administrador'
    ];

    for (const descricao of hierarquias) {
      await Hierarquia.findOrCreate({
        where: { descricao }
      });
    }

    console.log('✅ Hierarquias inseridas com sucesso');
    process.exit();

  } catch (err) {

    console.error('❌ Erro ao inserir Hierarquias', err);
    process.exit(1);

  }
}

seedHierarquia();