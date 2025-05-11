// backend/routes/dashboard.routes.js
const router = require('express').Router();
const { protect } = require('../middlewares/auth.middleware');
const { summary } = require('../controllers/dashboard.controller');

router.get('/summary', protect, summary);

module.exports = router;