const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Semestre = sequelize.define(
  'Tb_Semestre',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    descricao: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: 'uk_semestre_descricao'
    }
  },
  {
    tableName: 'Tb_Semestre',
    timestamps: true
  }
);

module.exports = Semestre;
