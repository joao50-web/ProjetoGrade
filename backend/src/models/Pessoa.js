const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pessoa = sequelize.define(
  "Pessoa",
  {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmailOrNull(value) {
          if (value && !/^\S+@\S+\.\S+$/.test(value)) {
            throw new Error("Email inválido");
          }
        },
      },
    },

    matricula: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🔗 Adicionando a FK para o Cargo (Necessário para o Admin)
    cargo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tb_cargo', // Nome da tabela no banco
        key: 'id'
      }
    }
  },
  {
    tableName: "tb_pessoa",
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = Pessoa;