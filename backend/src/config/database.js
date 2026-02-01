const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD, // <-- CORRIGIDO
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

module.exports = sequelize;