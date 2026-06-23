const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Hierarquia = sequelize.define("Hierarquia", {
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: "tb_hierarquia", 
  freezeTableName: true,
  timestamps: true
});

module.exports = Hierarquia;