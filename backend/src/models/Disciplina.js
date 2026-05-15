const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Disciplina = sequelize.define('Tb_Disciplina', {
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
  }

}, {
  tableName: 'Tb_Disciplina',
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