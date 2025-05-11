const router = require('express').Router();
const {
    register,
    login,
    me,
    forgotRequestOtp,
    forgotVerifyOtp,
    forgotResetPassword,
    loginRequestOtp,
    loginVerifyOtp,
    registerRequestOtp,
    registerVerifyOtp,
    registerComplete,
    adminRegisterRequestOtp,
    adminRegisterVerifyOtp,
    adminRegisterComplete
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// 1) Password-only register & login
router.post('/register', register);
router.post('/login', login);

// 2) REGISTER via OTP + security code
router.post('/otp/register/request', registerRequestOtp);
router.post('/otp/register/verify', registerVerifyOtp);
router.post('/register/complete', registerComplete);

// 3) LOGIN via OTP
router.post('/otp/login/request', loginRequestOtp);
router.post('/otp/login/verify', loginVerifyOtp);

// 4) FORGOT-PASSWORD via OTP
router.post('/forgot/request-otp', forgotRequestOtp);
router.post('/forgot/verify-otp', forgotVerifyOtp);
router.post('/forgot/reset-password', forgotResetPassword);

// 5) “Me” (protected)
router.get('/me', protect, me);

// 6) ADMIN-ONLY OTP flows
router.post('/admin/register/request-otp', adminRegisterRequestOtp);
router.post('/admin/register/verify-otp', adminRegisterVerifyOtp);
router.post('/admin/register/complete', adminRegisterComplete);

module.exports = router;