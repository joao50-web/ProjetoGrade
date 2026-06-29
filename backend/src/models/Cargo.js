const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cargo = sequelize.define("tb_cargo", {
  descricao: DataTypes.STRING
}, {
  tableName: "tb_cargo"
});

module.exports = Cargo;