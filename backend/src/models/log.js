const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Log = sequelize.define(
  "Log",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    acao: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entidade: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entidade_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    detalhes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    data_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tb_logs",
    timestamps: false,
  }
);

module.exports = Log;