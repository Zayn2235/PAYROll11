const router = require('express').Router();
const { protect } = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { summary, assign } = require('../controllers/tax.controller');

// Anyone logged in can view summary
router.get('/summary', protect, summary);

// Only admin can assign new records
router.post('/assign', protect, role.admin, assign);

module.exports = router;