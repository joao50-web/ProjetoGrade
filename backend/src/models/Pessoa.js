const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cargo = require('./Cargo');
const Usuario = require('./Usuario');
const Pessoa = sequelize.define('Tb_Pessoa', {
  nome: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
     unique: 'uk_pessoa_email'
  },
  matricula: DataTypes.STRING
}, {
  tableName: 'Tb_Pessoa'
});




module.exports = Pessoa;