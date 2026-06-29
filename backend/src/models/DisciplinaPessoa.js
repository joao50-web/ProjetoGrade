const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DisciplinaPessoa = sequelize.define(
  'tb_disciplina_pessoa',
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
    tableName: 'tb_disciplina_pessoa',
    timestamps: false
  }
);

module.exports = DisciplinaPessoa;