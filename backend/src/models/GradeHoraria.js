const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GradeHoraria = sequelize.define(
  "GradeHoraria",
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    curso_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    coordenador_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    disciplina_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    professor_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    departamento_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    horario_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    dia_semana_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    ano_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    semestre_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    curriculo_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    // ✅ Ajustado e centralizado como STRING para texto livre (Ex: "TURMA A")
    turma: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
  },
  {
    tableName: "tb_grade_horaria", // ✅ Mantido exatamente como no DBeaver
    freezeTableName: true,
    timestamps: true,
  },
);

// Mapeamento das chaves estrangeiras (Sem o model antigo de Turma)
GradeHoraria.associate = (models) => {
  GradeHoraria.belongsTo(models.Disciplina, {
    foreignKey: "disciplina_id",
    as: "disciplina",
  });
  GradeHoraria.belongsTo(models.Pessoa, {
    foreignKey: "professor_id",
    as: "professor",
  });
  GradeHoraria.belongsTo(models.Pessoa, {
    foreignKey: "coordenador_id",
    as: "coordenador",
  });
  GradeHoraria.belongsTo(models.Departamento, {
    foreignKey: "departamento_id",
    as: "departamento",
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
    as: "semestre",
  });
  GradeHoraria.belongsTo(models.Curso, { 
    foreignKey: "curso_id", 
    as: "curso" 
  });
  GradeHoraria.belongsTo(models.Ano, { 
    foreignKey: "ano_id", 
    as: "ano" 
  });
  GradeHoraria.belongsTo(models.Curriculo, {
    foreignKey: "curriculo_id",
    as: "curriculo",
  });
};

module.exports = GradeHoraria;