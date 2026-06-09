const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cargo = sequelize.define("Tb_Cargo", {
  descricao: DataTypes.STRING
}, {
  tableName: "Tb_Cargo"
});

module.exports = Cargo;