const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiaSemana = sequelize.define(
  'Tb_Dia_Semana',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    descricao: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: 'uk_dia_semana_descricao'
    }
  },
  {
    tableName: 'Tb_Dia_Semana',
    timestamps: true
  }
);

module.exports = DiaSemana;
