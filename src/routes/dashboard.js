const express = require('express');
const router = express.Router();
const db = require('../config/db');
const isAuth = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

router.get('/dashboard', isAuth, async (req, res) => {
  try {
    // Consulta para obtener el conteo de proyectos por estado
    const [projectStats] = await db.execute(
      'SELECT estado, COUNT(*) as count FROM proyectos WHERE usuario_id = ? GROUP BY estado',
      [req.session.userId]
    );

    // Obtener el último proyecto actualizado
    const [lastProjectResult] = await db.execute(
      'SELECT nombre, updated_at FROM proyectos WHERE usuario_id = ? ORDER BY updated_at DESC LIMIT 1',
      [req.session.userId]
    );

    const lastProject = lastProjectResult.length > 0 ? lastProjectResult[0] : null;
    const totalProjects = projectStats.reduce((acc, curr) => acc + curr.count, 0);

    // Formatear datos para el gráfico
    const chartData = {
      labels: projectStats.map(stat => stat.estado),
      data: projectStats.map(stat => stat.count),
    };

    res.render('dashboard', {
      user: { name: req.session.username },
      chartData: JSON.stringify(chartData), // Pasar como JSON string
      totalProjects,
      lastProject
    });
  } catch (err) {
    logger.error(err);
    res.status(500).render('error', { message: 'Error al cargar el dashboard' });
  }
});

module.exports = router;