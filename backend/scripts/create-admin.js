require('dotenv').config();

const bcrypt = require('bcrypt');
const Usuario = require('../src/models/Usuario');
const Pessoa = require('../src/models/Pessoa');
const Cargo = require('../src/models/Cargo');
const Hierarquia = require('../src/models/Hierarquia');
const sequelize = require('../src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✔ Conectado ao banco');

    const cargo = await Cargo.create({ descricao: 'Professor' });
    const hierarquia = await Hierarquia.create({ descricao: 'Visualização' });

    const pessoa = await Pessoa.create({
      nome: 'Rodrigo',
      email: 'rodrigo@ufcspa.edu.br',
      cargo_id: cargo.id
    });

    await Usuario.create({
      login: 'rodrigo.matos',
      senha: await bcrypt.hash('rodrigo123', 10),
      pessoa_id: pessoa.id,
      hierarquia_id: hierarquia.id
    });

    console.log('✔ Administrador criado com sucesso');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao criar administrador:', err);
    process.exit(1);
  }
})();
