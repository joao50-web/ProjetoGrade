const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pessoa = sequelize.define(
  "Pessoa",
  {
    nome: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: "uk_pessoa_email",
    },
    matricula: DataTypes.STRING,
  },
  {
    tableName: "tb_pessoa",
    freezeTableName: true,
    timestamps: true,
  }
);

// 👇 TEM QUE SER A ÚLTIMA LINHA DO ARQUIVO
module.exports = Pessoa;