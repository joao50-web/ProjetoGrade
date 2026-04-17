const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ MIDDLEWARES
const auditMiddleware = require('./middlewares/audit.middleware');
app.use(auditMiddleware); // registra ações no banco (opcional, não interfere no PDF)

// ✅ ROTAS
const authRoutes = require('./routes/auth.routes');
const cursoRoutes = require('./routes/curso.routes');
const disciplinaRoutes = require('./routes/disciplina.routes');
const cursoDisciplinaRoutes = require('./routes/curso-disciplina.routes');
const pessoaRoutes = require('./routes/pessoa.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const hierarquiaRoutes = require('./routes/hierarquia.routes');
const cargoRoutes = require('./routes/cargo.routes');
const horarioRoutes = require('./routes/horario.routes');
const diaSemanaRoutes = require('./routes/dia-semana.routes');
const gradeHorariaRoutes = require('./routes/grade-horaria.routes');
const anoRoutes = require('./routes/ano.routes');
const curriculoRoutes = require('./routes/curriculo.routes');
const semestreRoutes = require('./routes/semestre.routes');
const relatorioRoutes = require('./routes/relatorio.routes');
const logRoutes = require('./routes/log.routes');
const departamentoRoutes = require('./routes/departamento.routes');
const relatorioGradeRoutes = require('./routes/relatorio-grade.routes'); // ← ROTA DO PDF

// Registrar rotas (sem duplicação)
app.use('/auth', authRoutes);
app.use('/cursos', cursoRoutes);
app.use('/disciplinas', disciplinaRoutes);
app.use('/', cursoDisciplinaRoutes);
app.use('/pessoas', pessoaRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/hierarquias', hierarquiaRoutes);
app.use('/cargos', cargoRoutes);
app.use('/horarios', horarioRoutes);
app.use('/dias-semana', diaSemanaRoutes);
app.use('/grade-horaria', gradeHorariaRoutes);          // Rota base para grade (ex: /grade-horaria)
app.use('/anos', anoRoutes);
app.use('/curriculos', curriculoRoutes);
app.use('/semestres', semestreRoutes);
app.use('/relatorios', relatorioRoutes);                // Relatórios existentes (exemplo)
app.use('/logs', logRoutes);
app.use('/departamentos', departamentoRoutes);
app.use('/api/relatorio-grade', relatorioGradeRoutes); // Rota específica para PDF da grade

// Tratamento de erros global (opcional)
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;