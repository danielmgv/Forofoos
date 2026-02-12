const express = require('express');
const router = express.Router();
const db = require('../config/db');
const isAuth = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

router.post('/publicar', isAuth, async (req, res, next) => {
  const { contenido } = req.body;
  const usuarioId = req.session.userId;
  try {
    await db.execute('INSERT INTO publicaciones (contenido, usuario_id) VALUES (?, ?)', [
      contenido,
      usuarioId,
    ]);
    res.redirect('/dashboard');
  } catch (err) {
    logger.error(err);
    next(err);
  }
});

module.exports = router;
