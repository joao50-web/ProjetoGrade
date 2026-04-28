const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GradeHoraria = sequelize.define(
  "GradeHoraria",
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
    tableName: "tb_grade_horaria",
    freezeTableName: true,
    timestamps: true,

    //  IGUAL AO BANCO
    indexes: [
      {
        name: "uk_grade_slot",
        unique: true,
        fields: ["dia_semana_id", "horario_id", "professor_id"],
      },
    ],
  }
);

/* ================= ASSOCIAÇÕES ================= */
GradeHoraria.associate = (models) => {
  GradeHoraria.belongsTo(models.Disciplina, { foreignKey: "disciplina_id", as: "disciplina" });
  GradeHoraria.belongsTo(models.Pessoa, { foreignKey: "professor_id", as: "professor" });
  GradeHoraria.belongsTo(models.Pessoa, { foreignKey: "coordenador_id", as: "coordenador" });
  GradeHoraria.belongsTo(models.Horario, { foreignKey: "horario_id", as: "horario" });
  GradeHoraria.belongsTo(models.DiaSemana, { foreignKey: "dia_semana_id", as: "diaSemana" });
  GradeHoraria.belongsTo(models.Semestre, { foreignKey: "semestre_id", as: "semestre" });
  GradeHoraria.belongsTo(models.Curso, { foreignKey: "curso_id", as: "curso" });
  GradeHoraria.belongsTo(models.Ano, { foreignKey: "ano_id", as: "ano" });
  GradeHoraria.belongsTo(models.Curriculo, { foreignKey: "curriculo_id", as: "curriculo" });
};

module.exports = GradeHoraria;