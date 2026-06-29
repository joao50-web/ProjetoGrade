const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Horario = sequelize.define(
  'tb_horario',
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
    tableName: 'tb_horario',
    timestamps: true
  }
);

module.exports = Horario;
