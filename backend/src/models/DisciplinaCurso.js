const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DisciplinaCurso = sequelize.define(
  'tb_disciplina_curso',
  {
    // 1. NOVA CHAVE PRIMÁRIA ADICIONADA:
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // 2. PRIMARY KEY REMOVIDA DE CURSO E DISCIPLINA:
    curso_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    disciplina_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    semestre_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    curriculo_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: 'tb_disciplina_curso',
    timestamps: false
  }
);

module.exports = DisciplinaCurso;