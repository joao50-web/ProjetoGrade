require('dotenv').config();

const app = require('./src/app');
const sequelize = require('./src/config/database');

// Carrega os models e as associações antes de iniciar a aplicação.
require('./src/models');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Apenas valida a conexão. Alterações de estrutura devem ser feitas por migration.
    await sequelize.authenticate();
    console.log('Banco de dados conectado com sucesso.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT} e acessível externamente.`);
    });
  } catch (error) {
    console.error('Não foi possível iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer();
