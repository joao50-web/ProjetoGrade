const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Curriculo = sequelize.define(
  'tb_curriculo',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
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
    tableName: 'tb_curriculo',
    timestamps: true,
    indexes: [
      {
        name: 'uk_curriculo_descricao',
        unique: true,
        fields: ['descricao']
      }
    ]
  }
);

module.exports = Curriculo;
