const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define("Usuario", {
  login: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pessoa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tb_pessoa", key: "id" }
  },
  hierarquia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tb_hierarquia", key: "id" }
  }
}, {
  tableName: "tb_usuario", // ✅ Corrigido para minúsculo
  freezeTableName: true,
  timestamps: true
});

module.exports = Usuario;