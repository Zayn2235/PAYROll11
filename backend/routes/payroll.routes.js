// backend/routes/payroll.routes.js
const router = require('express').Router();
const { protect } = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ctrl = require('../controllers/payroll.controller');

// All endpoints require authentication
router.use(protect);

// Admin-only: deposit funds
router.post('/fund', role.admin, ctrl.addFund);

// Admin-only: view current fund
router.get('/fund', role.admin, ctrl.getFund);

// Admin-only: distribute entire pool in one go
router.post('/distribute', role.admin, ctrl.distribute);

// Summary (gross/tax/net) for dashboard cards—admin or employee
router.get('/summary', ctrl.summary);

module.exports = router;