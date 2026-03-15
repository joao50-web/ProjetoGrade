require('dotenv').config();

const bcrypt = require('bcrypt');
const sequelize = require('../src/config/database');

const Usuario = require('../src/models/Usuario');
const Pessoa = require('../src/models/Pessoa');
const Cargo = require('../src/models/Cargo');
const Hierarquia = require('../src/models/Hierarquia');

(async () => {
  try {

    await sequelize.authenticate();
    console.log("✔ Conectado ao banco");

    // pegar hierarquia administrador
    const hierarquia = await Hierarquia.findOne({
      where: { descricao: 'Administrador' }
    });

    // criar cargo
    const cargo = await Cargo.create({
      descricao: "Administrador"
    });

    // criar pessoa
    const pessoa = await Pessoa.create({
      nome: "Administrador Sistema",
      email: "admin@ufcspa.edu.br",
      cargo_id: cargo.id
    });

    // criar usuário
    const usuario = await Usuario.create({
      login: "admin",
      senha: await bcrypt.hash("admin123", 10),
      pessoa_id: pessoa.id,
      hierarquia_id: hierarquia.id
    });

    console.log("✅ ADMIN criado com sucesso");
    console.log("Login: admin");
    console.log("Senha: admin123");

    process.exit();

  } catch (err) {

    console.error("❌ Erro ao criar admin", err);
    process.exit(1);

  }
})();