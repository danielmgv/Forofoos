const express = require('express');
const router = express.Router();
const db = require('../config/db');
const isAuth = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

router.get('/home', isAuth, async (req, res) => {
  try {
    // Consulta para obtener el conteo de proyectos por estado
    const [projectStats] = await db.execute(
      'SELECT estado, COUNT(*) as count FROM proyectos WHERE usuario_id = ? GROUP BY estado',
      [req.session.userId]
    );

    // Obtener los últimos 5 proyectos actualizados
    const [recentProjects] = await db.execute(
      'SELECT id, nombre, estado, updated_at FROM proyectos WHERE usuario_id = ? ORDER BY updated_at DESC LIMIT 5',
      [req.session.userId]
    );

    const lastProject = recentProjects.length > 0 ? recentProjects[0] : null;
    const totalProjects = projectStats.reduce((acc, curr) => acc + curr.count, 0);

    // Formatear datos para el gráfico
    const chartData = {
      labels: projectStats.map(stat => stat.estado),
      data: projectStats.map(stat => stat.count),
    };

    res.render('home', {
      user: { name: req.session.username },
      chartData: JSON.stringify(chartData), // Pasar como JSON string
      totalProjects,
      lastProject,
      recentProjects,
      error: req.query.error,
      success: req.query.success
    });
  } catch (err) {
    logger.error(err);
    res.status(500).render('error', { message: 'Error al cargar el home' });
  }
});

module.exports = router;