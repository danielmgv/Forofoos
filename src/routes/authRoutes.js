const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const isAuth = require('../middlewares/authMiddleware');

// Redirigir la raíz al login
router.get('/', (req, res) => {
  res.redirect('/login');
});

// Rutas de Auth
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Registro
router.get('/register', authController.showRegister);
router.post('/auth/register', authController.register);

// Esta ruta vive fuera del prefijo /auth normalmente, pero aquí la protegemos
router.get('/dashboard', isAuth, async (req, res) => {
  try {
    const [posts] = await require('../config/db').execute(
      'SELECT p.*, u.username FROM publicaciones p LEFT JOIN users u ON u.id = p.usuario_id ORDER BY p.fecha_publicacion DESC LIMIT 20'
    );
    res.render('dashboard', { user: req.session.username, posts });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { user: req.session.username, posts: [] });
  }
});

module.exports = router;
