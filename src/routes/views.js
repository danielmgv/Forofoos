const express = require('express');
const router = express.Router();
const isAuth = require('../middlewares/authMiddleware');

router.get('/mensajes', isAuth, (req, res) => {
  res.render('mensajes', {
    user: { name: req.session.username }
  });
});

router.get('/configuracion', isAuth, (req, res) => {
  res.render('configuracion', {
    user: { name: req.session.username }
  });
});

module.exports = router;