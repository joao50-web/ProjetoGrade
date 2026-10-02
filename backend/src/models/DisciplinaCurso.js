const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DisciplinaCurso = sequelize.define(
  'tb_disciplina_curso',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
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
    timestamps: false,
    indexes: [
      {
        name: 'uk_disciplina_curso_contexto',
        unique: true,
        fields: ['curso_id', 'disciplina_id', 'semestre_id', 'curriculo_id']
      }
    ]
  }
);

module.exports = DisciplinaCurso;
