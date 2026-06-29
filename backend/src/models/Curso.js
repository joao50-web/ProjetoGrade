const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Curso = sequelize.define('tb_curso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  departamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Permite nulo caso existam cursos sem departamento definido
    references: {
      model: 'tb_departamento', 
      key: 'id'
    }
  }
}, {
  tableName: 'tb_curso', 
  timestamps: false
});

module.exports = Curso;