const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Disciplina = sequelize.define('Tb_Disciplina', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Tb_Disciplina'
});


module.exports = Disciplina;
