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
      allowNull: true, // ✅ AGORA É OPCIONAL
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
  },
  {
    tableName: "tb_pessoa",
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = Pessoa;