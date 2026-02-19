const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Proyecto = sequelize.define('Proyecto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  estado: {
    type: DataTypes.ENUM('En progreso', 'Completado', 'En espera', 'Cancelado'),
    defaultValue: 'En progreso'
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'proyectos'
});

module.exports = Proyecto;