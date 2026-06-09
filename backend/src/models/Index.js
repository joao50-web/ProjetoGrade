const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");

// Importa os modelos
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
const Turma = require("./Turma");

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
  Turma,
};

// ================= ASSOCIAÇÕES =================

// Executa as associações de cada modelo
Object.values(models).forEach((model) => {
  if (model && typeof model.associate === "function") {
    model.associate(models);
  }
});

// Associações manuais (caso não estejam dentro dos arquivos dos modelos)
// Pessoa ↔ Cargo
Pessoa.belongsTo(Cargo, { foreignKey: "cargo_id", as: "cargo" });
Cargo.hasMany(Pessoa, { foreignKey: "cargo_id", as: "pessoas" });

// Pessoa ↔ Usuario
Pessoa.hasOne(Usuario, { foreignKey: "pessoa_id", as: "usuario" });
Usuario.belongsTo(Pessoa, { foreignKey: "pessoa_id", as: "pessoa" });

// Usuario ↔ Hierarquia
Usuario.belongsTo(Hierarquia, { foreignKey: "hierarquia_id", as: "hierarquia" });
Hierarquia.hasMany(Usuario, { foreignKey: "hierarquia_id", as: "usuarios" });

// Curso ↔ Departamento
Curso.belongsTo(Departamento, { foreignKey: "departamento_id", as: "departamento" });
Departamento.hasMany(Curso, { foreignKey: "departamento_id", as: "cursos" });

// Disciplina ↔ Departamento
Disciplina.belongsTo(Departamento, { foreignKey: "departamento_id", as: "departamento" });
Departamento.hasMany(Disciplina, { foreignKey: "departamento_id", as: "disciplinas" });

// Curso ↔ Disciplina (N:N)
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

// Disciplina ↔ Pessoa (N:N)
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

// Log ↔ Usuario
Log.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
Usuario.hasMany(Log, { foreignKey: "usuario_id", as: "logs_atividades" });

// Exporta o sequelize e os modelos
module.exports = {
  ...models,
  sequelize,
  Sequelize,
};
