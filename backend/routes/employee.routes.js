const router = require('express').Router();
const {
    getAll,
    getOne,
    create,
    update,
    remove,
    updateProfile,
    changePassword
} = require('../controllers/employee.controller');
const { protect } = require('../middlewares/auth.middleware');
const { admin } = require('../middlewares/role.middleware');

// all employee endpoints require login
router.use(protect);

// Admin‐only CRUD
router.get('/', admin, getAll);
router.post('/', admin, create);
router.put('/:id', admin, update);
router.delete('/:id', admin, remove);

// Self‐service (any logged‐in user)
router.get('/:id', getOne);
router.post('/profile', updateProfile);
router.post('/change-password', changePassword);

module.exports = router;