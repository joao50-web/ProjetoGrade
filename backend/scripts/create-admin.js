require("dotenv").config();

const bcrypt = require("bcrypt");
const sequelize = require("../src/config/database");

const Usuario = require("../src/models/Usuario");
const Pessoa = require("../src/models/Pessoa");
const Cargo = require("../src/models/Cargo");
const Hierarquia = require("../src/models/Hierarquia");

(async () => {
  try {

    await sequelize.authenticate();
    console.log("✔ Conectado ao banco");

    // pegar hierarquia administrador (corrigido para minúsculas)
    const hierarquia = await Hierarquia.findOne({
      where: { descricao: "administrador" } // Corrigido aqui
    });

    if (!hierarquia) {
      console.error("❌ Erro: Hierarquia 'administrador' não encontrada. Execute 'create-hierarquia.js' primeiro.");
      process.exit(1);
    }

    // criar cargo
    const [cargo] = await Cargo.findOrCreate({
      where: { descricao: "Administrador" },
      defaults: { descricao: "Administrador" }
    });

    // criar pessoa
    const [pessoa] = await Pessoa.findOrCreate({
      where: { email: "admin@ufcspa.edu.br" },
      defaults: {
        nome: "Administrador Sistema",
        email: "admin@ufcspa.edu.br",
        cargo_id: cargo.id
      }
    });

    // criar usuário
    const [usuario, created] = await Usuario.findOrCreate({
      where: { login: "admin" },
      defaults: {
        login: "admin",
        senha: await bcrypt.hash("admin123", 10),
        pessoa_id: pessoa.id,
        hierarquia_id: hierarquia.id
      }
    });

    if (created) {
      console.log("✅ ADMIN criado com sucesso");
      console.log("Login: admin");
      console.log("Senha: admin123");
    } else {
      console.log("ℹ️ ADMIN já existe. Ignorando criação.");
    }

    process.exit();

  } catch (err) {

    console.error("❌ Erro ao criar admin", err);
    process.exit(1);

  }
})();