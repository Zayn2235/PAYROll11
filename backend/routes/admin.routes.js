const router = require('express').Router();
const { changePassword, updateProfile } = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { admin } = require('../middlewares/role.middleware');

// Edit profile
router.post('/update-profile', protect, admin, updateProfile);
// Change password
router.post('/change-password', protect, admin, changePassword);

module.exports = router;