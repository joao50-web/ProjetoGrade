const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DisciplinaCurso = sequelize.define(
  'tb_disciplina_curso',
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
    tableName: 'tb_disciplina_curso',
    timestamps: false
  }
);

module.exports = DisciplinaCurso;
