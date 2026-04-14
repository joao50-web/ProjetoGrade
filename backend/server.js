require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');

/* 🔥 IMPORTA TUDO DE UMA VEZ */
require('./src/models');

sequelize.sync()
  .then(() => {
    console.log('✔ Tabelas criadas / atualizadas com sucesso');

    app.listen(3001, () => {
      console.log('🚀 API rodando em http://localhost:3001');
    });
  })
  .catch(err => {
    console.error('❌ Erro ao criar tabelas:', err);
  });