const db = require('../config/db');
const logger = require('../utils/logger');

// LISTAR: Ver todos los proyectos del usuario
exports.listarProyectos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    let baseQuery = 'FROM proyectos WHERE usuario_id = ?';
    const params = [req.session.userId];

    if (req.query.search) {
      baseQuery += ' AND nombre LIKE ?';
      params.push(`%${req.query.search}%`);
    }

    // Lógica de ordenamiento
    const sort = req.query.sort || 'date_desc';
    let orderByClause = 'ORDER BY created_at DESC';
    
    if (sort === 'date_asc') {
      orderByClause = 'ORDER BY created_at ASC';
    } else if (sort === 'status') {
      orderByClause = 'ORDER BY estado ASC, created_at DESC';
    }

    // 1. Obtener total de elementos para calcular páginas
    const [countResult] = await db.execute(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Obtener los datos paginados
    // Nota: LIMIT y OFFSET se interpolan porque son enteros calculados seguros
    const [proyectos] = await db.execute(
      `SELECT * ${baseQuery} ${orderByClause} LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.render('proyectos', {
      user: { name: req.session.username },
      proyectos,
      search: req.query.search,
      sort,
      currentPage: page,
      totalPages,
      totalItems,
      error: req.query.error,
      success: req.query.success
    });
  } catch (err) {
    logger.error(err);
    res.status(500).render('error', { message: 'Error al cargar los proyectos' });
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
    await db.execute(
      'INSERT INTO proyectos (nombre, descripcion, estado, fecha_inicio, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, estado || 'En progreso', fecha_inicio || new Date(), req.session.userId]
    );
    res.redirect('/proyectos?success=Proyecto creado exitosamente');
  } catch (err) {
    logger.error(err);
    res.redirect('/proyectos?error=Error al crear el proyecto');
  }
};

// EDITAR (VISTA): Mostrar formulario de edición
exports.mostrarFormularioEditar = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM proyectos WHERE id = ? AND usuario_id = ?',
      [id, req.session.userId]
    );
    
    if (rows.length === 0) {
      return res.redirect('/proyectos?error=Proyecto no encontrado');
    }

    res.render('proyectos_editar', {
      user: { name: req.session.username },
      proyecto: rows[0],
      error: req.query.error
    });
  } catch (err) {
    logger.error(err);
    res.redirect('/proyectos?error=Error al cargar el proyecto');
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
    // Verificar propiedad antes de actualizar
    const [check] = await db.execute('SELECT id FROM proyectos WHERE id = ? AND usuario_id = ?', [id, req.session.userId]);
    if (check.length === 0) {
      return res.redirect('/proyectos?error=No tienes permiso para editar este proyecto');
    }

    await db.execute(
      'UPDATE proyectos SET nombre = ?, descripcion = ?, estado = ?, fecha_inicio = ? WHERE id = ?',
      [nombre, descripcion, estado, fecha_inicio, id]
    );
    res.redirect('/proyectos?success=Proyecto actualizado');
  } catch (err) {
    logger.error(err);
    res.redirect(`/proyectos/editar/${id}?error=Error al actualizar`);
  }
};

// COMPLETAR: Marcar proyecto como completado
exports.completarProyecto = async (req, res) => {
  const { id } = req.params;
  const redirectUrl = req.query.redirect || '/proyectos';
  try {
    // Actualizamos directamente verificando usuario_id para seguridad
    await db.execute('UPDATE proyectos SET estado = ? WHERE id = ? AND usuario_id = ?', ['Completado', id, req.session.userId]);
    res.redirect(`${redirectUrl}?success=Proyecto marcado como completado`);
  } catch (err) {
    logger.error(err);
    res.redirect(`${redirectUrl}?error=Error al actualizar el estado del proyecto`);
  }
};

// ELIMINAR: Borrar proyecto
exports.eliminarProyecto = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM proyectos WHERE id = ? AND usuario_id = ?', [id, req.session.userId]);
    res.redirect('/proyectos?success=Proyecto eliminado');
  } catch (err) {
    logger.error(err);
    res.redirect('/proyectos?error=Error al eliminar el proyecto');
  }
};