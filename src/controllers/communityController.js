const { User } = require('../models');
const { Op } = require('sequelize');

exports.showCommunityPage = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 12;
    const offset = (page - 1) * limit;

    const where = {
      id: { [Op.ne]: req.session.userId },
      is_verified: true,
    };

    if (req.query.search) {
      where.username = { [Op.like]: `%${req.query.search}%` };
    }

    const { count: totalItems, rows: users } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['username', 'ASC']],
      attributes: ['id', 'username', 'createdAt'],
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.render('community', {
      users,
      search: req.query.search || '',
      currentPage: page,
      totalPages,
      totalItems,
      error: req.query.error,
      success: req.query.success,
    });
  } catch (err) {
    next(err);
  }
};