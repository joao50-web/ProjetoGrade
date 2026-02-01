const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GradeHoraria = sequelize.define(
  'Tb_Grade_Horaria',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    curso_id: DataTypes.INTEGER,
    coordenador_id: DataTypes.INTEGER,
    disciplina_id: DataTypes.INTEGER,
    professor_id: DataTypes.INTEGER,
    horario_id: DataTypes.INTEGER,
    dia_semana_id: DataTypes.INTEGER,
    ano_id: DataTypes.INTEGER,
    semestre_id: DataTypes.INTEGER,
    curriculo_id: DataTypes.INTEGER
  },
  {
    tableName: 'Tb_Grade_Horaria',
    timestamps: true,
    indexes: [
      {
        name: 'uk_grade_slot',
        unique: true,
        fields: [
          'curso_id',
          'ano_id',
          'semestre_id',
          'curriculo_id',
          'horario_id',
          'dia_semana_id'
        ]
      }
    ]
  }
);

/* 🔗 RELACIONAMENTOS */
GradeHoraria.associate = models => {
  GradeHoraria.belongsTo(models.Disciplina, {
    foreignKey: 'disciplina_id'
  });

  GradeHoraria.belongsTo(models.Pessoa, {
    foreignKey: 'professor_id',
    as: 'professor'
  });

  GradeHoraria.belongsTo(models.Horario, {
    foreignKey: 'horario_id'
  });

  GradeHoraria.belongsTo(models.DiaSemana, {
    foreignKey: 'dia_semana_id'
  });

  GradeHoraria.belongsTo(models.Semestre, {
    foreignKey: 'semestre_id'
  });
};

module.exports = GradeHoraria;