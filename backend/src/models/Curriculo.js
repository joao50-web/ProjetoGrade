const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Curriculo = sequelize.define(
  'Tb_Curriculo',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    descricao: {
      type: DataTypes.STRING(4),
      allowNull: false,
      unique: 'uk_curriculo_descricao',
      validate: {
        isNumeric: true,
        len: [4, 4]
      }
    }
  },
  {
    tableName: 'Tb_Curriculo',
    timestamps: true
  }
);

module.exports = Curriculo;
