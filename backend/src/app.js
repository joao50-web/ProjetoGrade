const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());



app.use(express.json());



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
const gradeHorariaRoutes = require('./routes/grade-horaria.routes')
const anoRoutes = require('./routes/ano.routes')
const curriculoRoutes = require('./routes/curriculo.routes')
const semestreRoutes =  require('./routes/semestre.routes')
const relatorioRoutes =  require('./routes/relatorio.routes')

app.use('/auth', authRoutes);
app.use('/cursos', cursoRoutes);
app.use('/disciplinas', disciplinaRoutes);
app.use('/curso-disciplinas', cursoDisciplinaRoutes);
app.use('/pessoas', pessoaRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/hierarquias', hierarquiaRoutes);
app.use('/cargos', cargoRoutes);
app.use('/horarios', horarioRoutes);
app.use('/dias-semana', diaSemanaRoutes);
app.use('/grade-horaria', gradeHorariaRoutes);
app.use('/anos', anoRoutes);
app.use('/curriculos', curriculoRoutes);
app.use('/semestres',semestreRoutes);
app.use('/relatorios', relatorioRoutes);


module.exports = app;
