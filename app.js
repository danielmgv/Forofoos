const express = require('express');
const mysql = require('mysql2');
const app = express();

// Configuración de conexión a MySQL (XAMPP suele no tener contraseña por defecto)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'forofoos'
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Conectado a la base de datos de XAMPP');
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// Ruta principal para ver publicaciones
app.get('/', (req, res) => {
    db.query('SELECT * FROM publicaciones ORDER BY fecha_publicacion DESC', (err, results) => {
        res.render('index', { posts: results });
    });
});
const PORT = 3000;
const HOST = '0.0.0.0'; // Esto permite conexiones de otros dispositivos en la red

app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en: http://192.168.1.100:${PORT}`);
}); 
// Middleware para leer datos del formulario
app.use(express.urlencoded({ extended: true }));

app.post('/publicar', (req, res) => {
    const { contenido } = req.body;
    const query = 'INSERT INTO publicaciones (contenido, usuario_id) VALUES (?, 1)';
    db.query(query, [contenido], (err) => {
        if (err) throw err;
        res.redirect('/'); // Vuelve al inicio para ver el nuevo post
    });
});

