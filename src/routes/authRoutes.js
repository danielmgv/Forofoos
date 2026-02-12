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

// Verificación de email
router.get('/auth/verify', authController.verify);

// Reenviar token si el usuario no ha verificado
router.post('/auth/resend-verification', authController.resendVerification);

// Cambiar contraseña (protegido)
router.post('/auth/change-password', isAuth, authController.changePassword);

module.exports = router;
