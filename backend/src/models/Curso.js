const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Curso = sequelize.define('Tb_Curso', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Tb_Curso'
});


module.exports = Curso;
