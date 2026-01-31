module.exports = (req, res, next) => {
  if (req.session.userId) {
    return next(); // El usuario está logueado, adelante.
  }
  res.redirect('/auth/login'); // No está logueado, al login.
};
