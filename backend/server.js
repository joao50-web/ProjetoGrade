require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');

// IMPORTANTE: importar os models antes do sync
require('./src/models/Cargo');
require('./src/models/Hierarquia');
require('./src/models/Pessoa');
require('./src/models/Usuario');
require('./src/models/Curso');
require('./src/models/Disciplina');
require('./src/models/DisciplinaCurso');
require('./src/models/Log'); 
require('./src/models/Departamento'); // ✅ ADICIONADO: Para o módulo de Departamento funcionar

sequelize.sync()
  .then(() => {
    console.log('✔ Tabelas criadas / atualizadas com sucesso');
    app.listen(3001, () => {
      console.log('🚀 API rodando em http://localhost:3001' );
    });
  })
  .catch(err => {
    console.error('❌ Erro ao criar tabelas:', err);
  });