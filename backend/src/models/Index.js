const Curso = require("./Curso");
const Disciplina = require("./Disciplina");
const DisciplinaCurso = require("./DisciplinaCurso");
const DisciplinaPessoa = require("./DisciplinaPessoa");
const Pessoa = require("./Pessoa");
const Usuario = require("./Usuario");
const Cargo = require("./Cargo");
const Hierarquia = require("./Hierarquia");
const Horario = require("./Horario");
const DiaSemana = require("./DiaSemana");
const Ano = require("./Ano");
const Semestre = require("./Semestre");
const Curriculo = require("./Curriculo");
const GradeHoraria = require("./GradeHoraria");
const Departamento = require("./Departamento");
const Log = require("./Log");

const models = {
  Curso,
  Disciplina,
  DisciplinaCurso,
  DisciplinaPessoa,
  Pessoa,
  Usuario,
  Cargo,
  Hierarquia,
  Horario,
  DiaSemana,
  Ano,
  Semestre,
  Curriculo,
  GradeHoraria,
  Departamento,
  Log,
};

/* ================= ASSOCIAÇÕES ================= */

/* PESSOA */
Pessoa.belongsTo(Cargo, { foreignKey: "cargo_id", as: "cargo" });
Cargo.hasMany(Pessoa, { foreignKey: "cargo_id", as: "pessoas" });

Pessoa.hasOne(Usuario, { foreignKey: "pessoa_id", as: "usuario" });
Usuario.belongsTo(Pessoa, { foreignKey: "pessoa_id", as: "pessoa" });

Usuario.belongsTo(Hierarquia, {
  foreignKey: "hierarquia_id",
  as: "hierarquia",
});
Hierarquia.hasMany(Usuario, {
  foreignKey: "hierarquia_id",
  as: "usuarios",
});

/* DEPARTAMENTO */
Curso.belongsTo(Departamento, {
  foreignKey: "departamento_id",
  as: "departamento",
});
Departamento.hasMany(Curso, {
  foreignKey: "departamento_id",
  as: "cursos",
});

Disciplina.belongsTo(Departamento, {
  foreignKey: "departamento_id",
  as: "departamento",
});
Departamento.hasMany(Disciplina, {
  foreignKey: "departamento_id",
  as: "disciplinas",
});

/* CURSO ↔ DISCIPLINA */
Curso.belongsToMany(Disciplina, {
  through: DisciplinaCurso,
  foreignKey: "curso_id",
  otherKey: "disciplina_id",
  as: "disciplinas",
});

Disciplina.belongsToMany(Curso, {
  through: DisciplinaCurso,
  foreignKey: "disciplina_id",
  otherKey: "curso_id",
  as: "cursos",
});

/* DISCIPLINA ↔ PROFESSOR */
Disciplina.belongsToMany(Pessoa, {
  through: DisciplinaPessoa,
  foreignKey: "disciplina_id",
  otherKey: "pessoa_id",
  as: "professores",
});

Pessoa.belongsToMany(Disciplina, {
  through: DisciplinaPessoa,
  foreignKey: "pessoa_id",
  otherKey: "disciplina_id",
  as: "disciplinas",
});

/* LOG */
Log.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

Usuario.hasMany(Log, {
  foreignKey: "usuario_id",
  as: "logs_atividades",
});

/* ================= SAFE EXPORT ================= */
module.exports = models;

/* ================= EXECUÇÃO SEGURA DOS ASSOCIATES ================= */
Object.values(models).forEach((model) => {
  if (model && typeof model.associate === "function") {
    model.associate(models);
  }
});