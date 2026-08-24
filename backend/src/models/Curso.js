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
    allowNull: true, 
    references: {
      model: 'tb_departamento', 
      key: 'id'
    }
  },
  coordenador_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Permite nulo caso o curso seja criado sem coordenador inicialmente
    references: {
      model: 'tb_pessoa', // Confirme se o nome da sua tabela de pessoas é este
      key: 'id'
    }
  }
}, {
  tableName: 'tb_curso', 
  timestamps: false
});

module.exports = Curso;