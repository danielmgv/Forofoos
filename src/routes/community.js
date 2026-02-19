const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/community', authMiddleware, communityController.showCommunityPage);

module.exports = router;