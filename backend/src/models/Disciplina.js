const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Disciplina = sequelize.define('Tb_Disciplina', {

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  codigo: {
    type: DataTypes.STRING,
    allowNull: false
  },

  nome: {
    type: DataTypes.STRING,
    allowNull: false
  }

}, {
  tableName: 'Tb_Disciplina',
  timestamps: false
});

module.exports = Disciplina;