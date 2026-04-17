const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GradeHoraria = sequelize.define(
  "Tb_Grade_Horaria",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    curso_id: { type: DataTypes.INTEGER, allowNull: false },
    coordenador_id: { type: DataTypes.INTEGER, allowNull: true },
    disciplina_id: { type: DataTypes.INTEGER, allowNull: true },
    professor_id: { type: DataTypes.INTEGER, allowNull: true },
    horario_id: { type: DataTypes.INTEGER, allowNull: false },
    dia_semana_id: { type: DataTypes.INTEGER, allowNull: false },
    ano_id: { type: DataTypes.INTEGER, allowNull: false },
    semestre_id: { type: DataTypes.INTEGER, allowNull: false },
    curriculo_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "Tb_Grade_Horaria",
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        name: "uk_grade_slot",
        unique: true,
        fields: ["curso_id", "ano_id", "semestre_id", "curriculo_id", "horario_id", "dia_semana_id"],
      },
    ],
  }
);

GradeHoraria.associate = (models) => {
  GradeHoraria.belongsTo(models.Disciplina, {
    foreignKey: "disciplina_id",
    as: "disciplina",
    onDelete: "SET NULL",
  });
  GradeHoraria.belongsTo(models.Pessoa, {
    foreignKey: "professor_id",
    as: "professor",
    onDelete: "SET NULL",
  });
  GradeHoraria.belongsTo(models.Pessoa, {
    foreignKey: "coordenador_id",
    as: "coordenador",
    onDelete: "SET NULL",
  });
  GradeHoraria.belongsTo(models.Horario, {
    foreignKey: "horario_id",
    as: "horario",
  });
  GradeHoraria.belongsTo(models.DiaSemana, {
    foreignKey: "dia_semana_id",
    as: "diaSemana",
  });
  GradeHoraria.belongsTo(models.Semestre, {
    foreignKey: "semestre_id",
    as: "semestre",           // ← ESSENCIAL para o PDF
  });
  GradeHoraria.belongsTo(models.Curso, {
    foreignKey: "curso_id",
    as: "curso",
  });
  GradeHoraria.belongsTo(models.Ano, {
    foreignKey: "ano_id",
    as: "ano",
  });
  GradeHoraria.belongsTo(models.Curriculo, {
    foreignKey: "curriculo_id",
    as: "curriculo",
  });
};

module.exports = GradeHoraria;