const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Pessoa = require('./Pessoa');
const Hierarquia = require('./Hierarquia');

const Usuario = sequelize.define('Tb_Usuario', {
  login: {
    type: DataTypes.STRING,
    unique: true
  },
  senha: DataTypes.STRING
}, {
  tableName: 'Tb_Usuario'
});




module.exports = Usuario;
