const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Horario = sequelize.define(
  'Tb_Horario',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    descricao: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: 'uk_horario_descricao'
    }
  },
  {
    tableName: 'Tb_Horario',
    timestamps: true
  }
);

module.exports = Horario;
