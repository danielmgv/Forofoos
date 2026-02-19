// Importamos los modelos de Sequelize
const { Proyecto } = require('../models');
const { Op } = require('sequelize');

// LISTAR: Ver todos los proyectos del usuario
exports.listarProyectos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = { usuario_id: req.session.userId };

    if (req.query.search) {
      where.nombre = { [Op.like]: `%${req.query.search}%` };
    }

    // Lógica de ordenamiento
    const sort = req.query.sort || 'date_desc';
    let order = [['createdAt', 'DESC']];
    
    if (sort === 'date_asc') {
      order = [['createdAt', 'ASC']];
    } else if (sort === 'status') {
      order = [['estado', 'ASC'], ['createdAt', 'DESC']];
    }

    // 1. Obtener datos paginados y total usando Sequelize
    const { count: totalItems, rows } = await Proyecto.findAndCountAll({
      where,
      limit,
      offset,
      order
    });

    const totalPages = Math.ceil(totalItems / limit);

    // Mapear resultados para mantener compatibilidad con la vista (created_at)
    const proyectos = rows.map(p => ({ ...p.get({ plain: true }), created_at: p.createdAt }));

    res.render('proyectos', {
      user: { name: req.session.username },
      proyectos,
      search: req.query.search,
      sort,
      currentPage: page,
      totalPages,
      totalItems,
      error: req.query.error,
      success: req.query.success,
      suggestion: {
        userId: req.query.suggest_user,
        username: req.query.suggest_name,
      },
    });
  } catch (err) {
    next(err);
  }
};

// CREAR: Procesar formulario de nuevo proyecto
exports.crearProyecto = async (req, res) => {
  const { nombre, descripcion, estado, fecha_inicio } = req.body;
  
  if (!nombre) {
    return res.redirect('/proyectos?error=El nombre del proyecto es obligatorio');
  }

  if (fecha_inicio && new Date(fecha_inicio) > new Date()) {
    return res.redirect('/proyectos?error=La fecha de inicio no puede ser en el futuro');
  }

  try {
    // MIGRACIÓN A SEQUELIZE: Reemplazo de db.execute por Proyecto.create
    await Proyecto.create({
      nombre,
      descripcion,
      estado: estado || 'En progreso',
      fecha_inicio: fecha_inicio || new Date(),
      usuario_id: req.session.userId
    });
    res.redirect('/proyectos?success=Proyecto creado exitosamente');
  } catch (err) {
    next(err);
  }
};

// EDITAR (VISTA): Mostrar formulario de edición
exports.mostrarFormularioEditar = async (req, res) => {
  const { id } = req.params;
  try {
    // MIGRACIÓN A SEQUELIZE: Usamos Proyecto.findOne para buscar el proyecto
    const proyecto = await Proyecto.findOne({
      where: {
        id: id,
        usuario_id: req.session.userId,
      },
    });

    if (!proyecto) {
      return res.redirect('/proyectos?error=Proyecto no encontrado');
    }

    // Preparamos el objeto para la vista, asegurando la compatibilidad de campos.
    const plainProyecto = proyecto.get({ plain: true });

    // 1. Mapeamos `createdAt` a `created_at` por consistencia con otras vistas.
    plainProyecto.created_at = plainProyecto.createdAt;

    // 2. Formateamos `fecha_inicio` para el input HTML `type="date"` que espera 'YYYY-MM-DD'.
    if (plainProyecto.fecha_inicio) {
      plainProyecto.fecha_inicio = new Date(plainProyecto.fecha_inicio).toISOString().slice(0, 10);
    }

    res.render('proyectos_editar', {
      user: { name: req.session.username },
      proyecto: plainProyecto,
      error: req.query.error
    });
  } catch (err) {
    next(err);
  }
};

// EDITAR (ACCIÓN): Actualizar proyecto
exports.editarProyecto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, estado, fecha_inicio } = req.body;

  if (fecha_inicio && new Date(fecha_inicio) > new Date()) {
    return res.redirect(`/proyectos/editar/${id}?error=La fecha de inicio no puede ser en el futuro`);
  }

  try {
    // MIGRACIÓN A SEQUELIZE: Usamos Proyecto.update con un 'where' para seguridad.
    // Esto actualiza el registro solo si el ID del proyecto y el ID del usuario en sesión coinciden.
    const [affectedRows] = await Proyecto.update(
      { nombre, descripcion, estado, fecha_inicio },
      {
        where: {
          id: id,
          usuario_id: req.session.userId,
        },
      }
    );

    if (affectedRows > 0) {
      res.redirect('/proyectos?success=Proyecto actualizado');
    } else {
      // Si no se afectó ninguna fila, es porque el proyecto no existe o no pertenece al usuario.
      res.redirect('/proyectos?error=Proyecto no encontrado o no tienes permiso para editarlo');
    }
  } catch (err) {
    next(err);
  }
};

// COMPLETAR: Marcar proyecto como completado
exports.completarProyecto = async (req, res) => {
  const { id } = req.params;
  const redirectUrl = req.query.redirect || '/proyectos';
  try {
    // MIGRACIÓN A SEQUELIZE: Usamos Proyecto.update con 'where' para seguridad
    const [affectedRows] = await Proyecto.update(
      { estado: 'Completado' },
      {
        where: {
          id: id,
          usuario_id: req.session.userId,
        },
      }
    );

    if (affectedRows > 0) {
      res.redirect(`${redirectUrl}?success=Proyecto marcado como completado`);
    } else {
      res.redirect(`${redirectUrl}?error=Proyecto no encontrado o no tienes permiso`);
    }
  } catch (err) {
    next(err);
  }
};

// ELIMINAR: Borrar proyecto
exports.eliminarProyecto = async (req, res) => {
  const { id } = req.params;
  try {
    // MIGRACIÓN A SEQUELIZE: Usamos Proyecto.destroy con 'where' para seguridad
    const affectedRows = await Proyecto.destroy({
      where: {
        id: id,
        usuario_id: req.session.userId,
      },
    });

    if (affectedRows > 0) {
      res.redirect('/proyectos?success=Proyecto eliminado');
    } else {
      res.redirect('/proyectos?error=Proyecto no encontrado o no tienes permiso');
    }
  } catch (err) {
    next(err);
  }
};