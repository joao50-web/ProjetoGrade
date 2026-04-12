const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Curso = sequelize.define('Tb_Curso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // ✅ ADICIONADO: Chave estrangeira para o Departamento
  departamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Permite nulo caso existam cursos sem departamento definido
    references: {
      model: 'tb_departamento', // Nome da tabela de departamentos no banco
      key: 'id'
    }
  }
}, {
  tableName: 'tb_curso', // Recomendo usar letras minúsculas para evitar problemas em Linux/Docker
  timestamps: false
});

module.exports = Curso;