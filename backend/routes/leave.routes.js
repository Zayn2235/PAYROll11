// backend/routes/leave.routes.js
const router = require('express').Router();
const { protect } = require('../middlewares/auth.middleware');
const { admin } = require('../middlewares/role.middleware');
const {
    apply,
    getMine,
    getPending,
    decide
} = require('../controllers/leave.controller');

// Employee endpoints
router.post('/apply', protect, apply);
router.get('/mine', protect, getMine);

// Admin endpoints
router.get('/pending', protect, admin, getPending);
router.post('/decide/:id', protect, admin, decide);

module.exports = router;