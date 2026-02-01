const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DisciplinaPessoa = sequelize.define(
  'Tb_Disciplina_Pessoa',
  {
    disciplina_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    pessoa_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    }
  },
  {
    tableName: 'Tb_Disciplina_Pessoa',
    timestamps: false
  }
);

module.exports = DisciplinaPessoa;
