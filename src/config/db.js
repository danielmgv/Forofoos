const mysql = require('mysql2');
require('dotenv').config(); // Carga las variables del archivo .env

// Creamos un "Pool" de conexiones
// Es más eficiente que una conexión única porque reutiliza conexiones abiertas
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Máximo de conexiones simultáneas
    queueLimit: 0
});

// Exportar un wrapper estable con métodos `execute` y `query` delegando al PromisePool.
// Esto evita problemas si alguien inspecciona el módulo antes de que el objeto PromisePool
// tenga propiedades enumerables (o en caso de orden de require inesperado).
function getPool() {
  return pool.promise();
}

module.exports = {
  execute: (...args) => getPool().execute(...args),
  query: (...args) => getPool().query(...args),
  end: (...args) => getPool().end(...args),
  getPool,
};