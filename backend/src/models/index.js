const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// ================= MODELOS =================
const Curso = require('./Curso');
const Disciplina = require('./Disciplina');
const DisciplinaCurso = require('./DisciplinaCurso');
const DisciplinaPessoa = require('./DisciplinaPessoa');
const Pessoa = require('./Pessoa');
const Usuario = require('./Usuario');
const Cargo = require('./Cargo');
const Hierarquia = require('./Hierarquia');
const Horario = require('./Horario');
const DiaSemana = require('./DiaSemana');
const Ano = require('./Ano');
const Semestre = require('./Semestre');
const Curriculo = require('./Curriculo');
const GradeHoraria = require('./GradeHoraria');
const Departamento = require('./Departamento');
const Log = require('./log');
const Turma = require('./Turma');

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
  Turma
};

// ================= ASSOCIAÇÕES DECLARADAS PELOS MODELOS =================
Object.values(models).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(models);
  }
});

// ================= ASSOCIAÇÕES MANUAIS =================

// Pessoa <-> Cargo
Pessoa.belongsTo(Cargo, {
  foreignKey: 'cargo_id',
  as: 'cargo'
});

Cargo.hasMany(Pessoa, {
  foreignKey: 'cargo_id',
  as: 'pessoas'
});

// Pessoa <-> Usuario
Pessoa.hasOne(Usuario, {
  foreignKey: 'pessoa_id',
  as: 'usuario'
});

Usuario.belongsTo(Pessoa, {
  foreignKey: 'pessoa_id',
  as: 'pessoa'
});

// Usuario <-> Hierarquia
Usuario.belongsTo(Hierarquia, {
  foreignKey: 'hierarquia_id',
  as: 'hierarquia'
});

Hierarquia.hasMany(Usuario, {
  foreignKey: 'hierarquia_id',
  as: 'usuarios'
});

// Curso <-> Departamento
Curso.belongsTo(Departamento, {
  foreignKey: 'departamento_id',
  as: 'departamento'
});

Departamento.hasMany(Curso, {
  foreignKey: 'departamento_id',
  as: 'cursos'
});

// Curso <-> Coordenador (Pessoa)
Curso.belongsTo(Pessoa, {
  foreignKey: 'coordenador_id',
  as: 'coordenador'
});

Pessoa.hasMany(Curso, {
  foreignKey: 'coordenador_id',
  as: 'cursos_coordenados'
});

// Disciplina <-> Departamento
Disciplina.belongsTo(Departamento, {
  foreignKey: 'departamento_id',
  as: 'departamento'
});

Departamento.hasMany(Disciplina, {
  foreignKey: 'departamento_id',
  as: 'disciplinas'
});

// Curso <-> Disciplina (N:N)
//
// uniqueKey: false estava incorreto. uniqueKey serve para nomear uma
// constraint; ele não desativa a unicidade criada pelo belongsToMany.
// A opção correta é through.unique = false.
// A unicidade real fica protegida no banco por:
// (curso_id, disciplina_id, semestre_id, curriculo_id)
Curso.belongsToMany(Disciplina, {
  through: {
    model: DisciplinaCurso,
    unique: false
  },
  foreignKey: 'curso_id',
  otherKey: 'disciplina_id',
  as: 'disciplinas'
});

Disciplina.belongsToMany(Curso, {
  through: {
    model: DisciplinaCurso,
    unique: false
  },
  foreignKey: 'disciplina_id',
  otherKey: 'curso_id',
  as: 'cursos'
});

// Disciplina <-> Pessoa (N:N)
Disciplina.belongsToMany(Pessoa, {
  through: DisciplinaPessoa,
  foreignKey: 'disciplina_id',
  otherKey: 'pessoa_id',
  as: 'professores'
});

Pessoa.belongsToMany(Disciplina, {
  through: DisciplinaPessoa,
  foreignKey: 'pessoa_id',
  otherKey: 'disciplina_id',
  as: 'disciplinas'
});

// Log <-> Usuario
Log.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

Usuario.hasMany(Log, {
  foreignKey: 'usuario_id',
  as: 'logs_atividades'
});

// ================= EXPORTAÇÃO =================
module.exports = {
  ...models,
  sequelize,
  Sequelize
};
