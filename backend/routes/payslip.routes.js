const router = require('express').Router();
const { protect } = require('../middlewares/auth.middleware');
const { list, download } = require('../controllers/payslip.controller');

router.use(protect);

// list & filter
router.get('/', list);

// download single
router.get('/:id/download', download);

module.exports = router;