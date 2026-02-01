const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Hierarquia = sequelize.define('Tb_Hierarquia', {
  descricao: DataTypes.STRING
}, {
  tableName: 'Tb_Hierarquia'
});

module.exports = Hierarquia;
