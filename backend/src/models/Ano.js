const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ano = sequelize.define(
  'Tb_Ano',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    descricao: {
      type: DataTypes.STRING(7),
      allowNull: false,
      unique: 'uk_ano_descricao',
    }
  },
  {
    tableName: 'Tb_Ano',
    timestamps: true
  }
);

module.exports = Ano;
