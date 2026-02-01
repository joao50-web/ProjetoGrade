const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DisciplinaCurso = sequelize.define(
  'Tb_Disciplina_Curso',
  {
    curso_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    disciplina_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  },
  {
    tableName: 'Tb_Disciplina_Curso',
    timestamps: false
  }
);

module.exports = DisciplinaCurso;
