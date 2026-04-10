const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Usuario = require("./Usuario");

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
      allowNull: false,
      references: {
        model: 'tb_usuario',
        key: "id",
      },
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

// ✅ ASSOCIAÇÕES
Log.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
Usuario.hasMany(Log, { foreignKey: "usuario_id", as: "logs" });

module.exports = Log;