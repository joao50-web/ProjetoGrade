require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const PORT = process.env.PORT || 3001;

/*  IMPORTA TUDO DE UMA VEZ */
require('./src/models');

sequelize.sync()
  .then(() => {
    console.log('✔ Tabelas criadas / atualizadas com sucesso');

    app.listen(PORT, () => {
      console.log(`🚀 API rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erro ao criar tabelas:', err);
  });