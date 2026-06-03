const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Turma = sequelize.define(
  "Turma",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    codigo: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
  },
  {
    tableName: "tb_turma",
    timestamps: false,
  }
);

module.exports = Turma;