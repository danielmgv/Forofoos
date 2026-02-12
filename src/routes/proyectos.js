const express = require('express');
const router = express.Router();
const proyectosController = require('../controllers/proyectosController');
const isAuth = require('../middlewares/authMiddleware');

// LISTAR: Ver todos los proyectos del usuario
router.get('/proyectos', isAuth, proyectosController.listarProyectos);

// CREAR: Procesar formulario de nuevo proyecto
router.post('/proyectos/crear', isAuth, proyectosController.crearProyecto);

// EDITAR (VISTA): Mostrar formulario de edición
router.get('/proyectos/editar/:id', isAuth, proyectosController.mostrarFormularioEditar);

// EDITAR (ACCIÓN): Actualizar proyecto
router.post('/proyectos/editar/:id', isAuth, proyectosController.editarProyecto);

// COMPLETAR: Marcar proyecto como completado
router.post('/proyectos/completar/:id', isAuth, proyectosController.completarProyecto);

// ELIMINAR: Borrar proyecto
router.post('/proyectos/eliminar/:id', isAuth, proyectosController.eliminarProyecto);

module.exports = router;