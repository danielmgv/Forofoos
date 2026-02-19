const sequelize = require('../config/sequelize');
const User = require('./User');
const Proyecto = require('./Proyecto');

// Definir relaciones
User.hasMany(Proyecto, { foreignKey: 'usuario_id', as: 'proyectos' });
Proyecto.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = {
  sequelize,
  User,
  Proyecto
};