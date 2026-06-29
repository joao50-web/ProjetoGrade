const { Sequelize } = require("sequelize");

// 1. Tenta pegar a URL de conexão completa (padrão de nuvem/Railway)
// Prioriza DATABASE_URL, se não encontrar, tenta MYSQL_URL
const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let sequelize;

// Opções comuns de configuração
const config = {
  dialect: 'mysql',
  logging: false, // Mude para console.log se quiser ver as queries no log
  dialectOptions: {
    connectTimeout: 10000,
    ssl: {
      require: true,
      rejectUnauthorized: false // Necessário para conexões externas na Railway
    }
  }
};

if (dbUrl) {
  // === CASO A: Conexão via URL (Recomendado para Railway) ===
  sequelize = new Sequelize(dbUrl, config);
} else {
  // === CASO B: Conexão via variáveis individuais (Local/Manual) ===
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      ...config
    }
  );
}

// === DEBUG ===
console.log("--------------------------------------------------");
console.log("DEBUG DE CONEXÃO DO BANCO DE DADOS:");
console.log("Modo de conexão:", dbUrl ? "URL" : "Variáveis Individuais");
console.log("URL/Host sendo usado:", dbUrl || process.env.DB_HOST);
console.log("--------------------------------------------------");

module.exports = sequelize;