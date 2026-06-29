const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Disciplina = sequelize.define('tb_disciplina', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  codigo: {
    type: DataTypes.STRING,
    allowNull: false
  },

  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },

  carga_horaria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }

}, {
  tableName: 'tb_disciplina',
  timestamps: false,
  createdAt: false,
  updatedAt: false
});

/* ==========================================
   ASSOCIAÇÕES
========================================== */

Disciplina.associate = (models) => {

  Disciplina.hasMany(models.GradeHoraria, {
    foreignKey: "disciplina_id",
    as: "gradesHorarias",
  });

};

module.exports = Disciplina;