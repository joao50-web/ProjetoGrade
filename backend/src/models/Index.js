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

// ===============================
// RELACIONAMENTOS BÁSICOS
// ===============================

// Pessoa ↔ Cargo ✅ (ESTAVA FALTANDO)
Pessoa.belongsTo(Cargo, { foreignKey: 'cargo_id', as: 'cargo' });
Cargo.hasMany(Pessoa, { foreignKey: 'cargo_id', as: 'pessoas' });

// Pessoa ↔ Usuario ✅ (ESTAVA FALTANDO)
Pessoa.hasOne(Usuario, { foreignKey: 'pessoa_id', as: 'usuario' });
Usuario.belongsTo(Pessoa, { foreignKey: 'pessoa_id', as: 'pessoa' });

// Usuario ↔ Hierarquia
Usuario.belongsTo(Hierarquia, { foreignKey: 'hierarquia_id', as: 'hierarquia' });
Hierarquia.hasMany(Usuario, { foreignKey: 'hierarquia_id', as: 'usuarios' });

// ===============================
// CURSO ↔ DISCIPLINA
// ===============================

Curso.belongsToMany(Disciplina, {
  through: DisciplinaCurso,
  foreignKey: 'curso_id',
  otherKey: 'disciplina_id',
  as: 'disciplinas'
});

Disciplina.belongsToMany(Curso, {
  through: DisciplinaCurso,
  foreignKey: 'disciplina_id',
  otherKey: 'curso_id',
  as: 'cursos'
});

// ===============================
// DISCIPLINA ↔ PESSOA (PROFESSORES)
// ===============================

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

// ===============================
// GRADE HORÁRIA
// ===============================

GradeHoraria.belongsTo(Curso, { foreignKey: 'curso_id', as: 'curso' });
GradeHoraria.belongsTo(Pessoa, { foreignKey: 'coordenador_id', as: 'coordenador' });
GradeHoraria.belongsTo(Pessoa, { foreignKey: 'professor_id', as: 'professor' });
GradeHoraria.belongsTo(Disciplina, { foreignKey: 'disciplina_id', as: 'disciplina' });
GradeHoraria.belongsTo(Horario, { foreignKey: 'horario_id', as: 'horario' });
GradeHoraria.belongsTo(DiaSemana, { foreignKey: 'dia_semana_id', as: 'diaSemana' });
GradeHoraria.belongsTo(Ano, { foreignKey: 'ano_id', as: 'ano' });
GradeHoraria.belongsTo(Semestre, { foreignKey: 'semestre_id', as: 'semestre' });
GradeHoraria.belongsTo(Curriculo, { foreignKey: 'curriculo_id', as: 'curriculo' });

// ===============================
module.exports = {
  Curso,
  Disciplina,
  Pessoa,
  Usuario,
  Cargo,
  Hierarquia,
  DisciplinaCurso,
  DisciplinaPessoa,
  Horario,
  DiaSemana,
  Ano,
  Semestre,
  Curriculo,
  GradeHoraria
};