const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cargo = sequelize.define('Tb_Cargo', {
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Tb_Cargo'
});

module.exports = Cargo;
