require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const PORT = process.env.PORT || 3001;

/* IMPORTA TUDO DE UMA VEZ */
require('./src/models');

async function startDatabase() {
    try {
        console.log('Iniciando sincronização do banco...');

        // 1. Desliga a verificação de Foreign Keys no MySQL
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('--- Verificação de FK desligada ---');

        // 2. Sincroniza as tabelas
        await sequelize.sync({ alter: true });
        console.log('--- Tabelas sincronizadas com sucesso ---');

        // 3. Liga a verificação de Foreign Keys novamente
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('--- Verificação de FK ligada ---');

        // 4. Só agora subimos o servidor vinculando ao host '0.0.0.0'
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor rodando na porta ${PORT} e acessível externamente`);
        });
        
    } catch (error) {
        console.error('Erro ao sincronizar tabelas:', error);
        // Opcional: process.exit(1); // Se o banco falhar, o servidor para
    }
}

// Chame a função para iniciar tudo
startDatabase();