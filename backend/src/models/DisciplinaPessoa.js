const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DisciplinaPessoa = sequelize.define(
  'Tb_Disciplina_Pessoa',
  {
    disciplina_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Tb_Disciplina',
        key: 'id'
      }
    },
    pessoa_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Tb_Pessoa',
        key: 'id'
      }
    }
  },
  {
    tableName: 'Tb_Disciplina_Pessoa',
    timestamps: false
  }
);

module.exports = DisciplinaPessoa;