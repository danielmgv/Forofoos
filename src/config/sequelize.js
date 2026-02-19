const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Ponlo en true si quieres ver las queries SQL en consola
    define: {
      timestamps: true,
      underscored: true, // Convierte camelCase a snake_case (ej: createdAt -> created_at)
    },
  }
);

module.exports = sequelize;