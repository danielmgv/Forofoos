const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const isAuth = require('../middlewares/authMiddleware');

router.get('/perfil', isAuth, authController.perfil);

module.exports = router;