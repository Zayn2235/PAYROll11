const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('../models');
const { success, error } = require('../utils/responseFormatter');
const { sendMail } = require('../utils/email.service');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_SECURITY_CODE = process.env.ADMIN_SECURITY_CODE;

// get the PasswordToken model
const PasswordToken = sequelize.models.PasswordToken;
if (!PasswordToken) {
    throw new Error('PasswordToken model not initialized.');
}

// helper to gen & upsert OTP
async function genOTP(email, type) {
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    await PasswordToken.upsert({
        email,
        type,
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000
    });
    return otp;
}

// ─── 1) PASSWORD-ONLY REGISTER (you may still use this if you want) ─────────
const register = asyncHandler(async(req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return error(res, 400, 'Name, email, and password are required');
    }
    if (await User.findOne({ where: { email } })) {
        return error(res, 400, 'Email already in use');
    }
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    success(res, { token }, 'Registration successful');
});

// ─── 2) LOGIN (password) ───────────────────────────────────────────────────
const login = asyncHandler(async(req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return error(res, 400, 'Email and password are required');
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
        return error(res, 401, 'Invalid email or password');
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    // after
    success(res, { token, role: user.role },
        'Login successful'
    );
});

// ─── 3) “ME” ENDPOINT ───────────────────────────────────────────────────────
const me = asyncHandler(async(req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'role']
    });
    if (!user) return error(res, 404, 'User not found');
    success(res, { user }, 'User fetched');
});

// ─── 4) FORGOT-PASSWORD OTP FLOW ─────────────────────────────────────────────
const forgotRequestOtp = asyncHandler(async(req, res) => {
    const { email } = req.body;
    if (!(await User.findOne({ where: { email } }))) {
        return error(res, 404, 'Email not found');
    }
    const otp = await genOTP(email, 'forgot-password');
    await sendMail(email, 'Your Password Reset OTP',
        `<p>Your OTP to reset your password is <b>${otp}</b>. Expires in 10 minutes.</p>`
    );
    success(res, null, 'OTP sent');
});

const forgotVerifyOtp = asyncHandler(async(req, res) => {
    const { email, otp } = req.body;
    const rec = await PasswordToken.findOne({ where: { email, type: 'forgot-password' } });
    if (!rec || rec.otp !== otp || rec.expiresAt < Date.now()) {
        return error(res, 400, 'Invalid or expired OTP');
    }
    success(res, null, 'OTP verified');
});

const forgotResetPassword = asyncHandler(async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return error(res, 404, 'User not found');
    user.password = password;
    await user.save();
    await PasswordToken.destroy({ where: { email, type: 'forgot-password' } });
    success(res, null, 'Password reset');
});

// ─── 5) LOGIN VIA OTP FLOW ─────────────────────────────────────────────────
const loginRequestOtp = asyncHandler(async(req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return error(res, 404, 'Email not found');
    const otp = await genOTP(email, 'login');
    await sendMail(email, 'Your Login OTP',
        `<p>Your login OTP is <b>${otp}</b>. Expires in 10 minutes.</p>`
    );
    success(res, null, 'OTP sent');
});

const loginVerifyOtp = asyncHandler(async(req, res) => {
    const { email, otp } = req.body;
    const rec = await PasswordToken.findOne({ where: { email, type: 'login' } });
    if (!rec || rec.otp !== otp || rec.expiresAt < Date.now()) {
        return error(res, 400, 'Invalid or expired OTP');
    }
    const user = await User.findOne({ where: { email } });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    await PasswordToken.destroy({ where: { email, type: 'login' } });
    success(res, { token }, 'Login successful');
});

// ─── 6) REGISTER VIA OTP + SECURITY-CODE ────────────────────────────────────
// 6.1) Request OTP
const registerRequestOtp = asyncHandler(async(req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return error(res, 400, 'Name and email are required');
    if (await User.findOne({ where: { email } })) {
        return error(res, 400, 'Email already in use');
    }
    const otp = await genOTP(email, 'register');
    await sendMail(email, 'Your Registration OTP',
        `<p>Hello ${name},</p>
     <p>Your OTP to complete registration is <b>${otp}</b>. Expires in 10 minutes.</p>`
    );
    success(res, null, 'OTP sent');
});

// 6.2) Verify OTP
const registerVerifyOtp = asyncHandler(async(req, res) => {
    const { email, otp } = req.body;
    const rec = await PasswordToken.findOne({ where: { email, type: 'register' } });
    if (!rec || rec.otp !== otp || rec.expiresAt < Date.now()) {
        return error(res, 400, 'Invalid or expired OTP');
    }
    success(res, null, 'OTP verified');
});

// ─── 6.3) Final “complete” with security code → only here we create the user ─────
const registerComplete = asyncHandler(async(req, res) => {
    const { name, email, password, role, code } = req.body;

    if (!name || !email || !password || !role) {
        return error(res, 400, 'Name, email, password and role are required');
    }
    // check your security code
    if (code !== ADMIN_SECURITY_CODE) {
        return error(res, 403, 'Invalid security code');
    }

    // create user with the selected role
    const user = await User.create({ name, email, password, role });

    // clean up any lingering OTPs
    await PasswordToken.destroy({ where: { email, type: 'register' } });

    // issue JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    success(res, { token }, 'Registration complete');
});


// ─── 7) ADMIN-ONLY OTP FLOWS (unchanged) ───────────────────────────────────
const adminRegisterRequestOtp = asyncHandler(async(req, res) => {
    const { name, email } = req.body;
    if (await User.findOne({ where: { email } })) {
        return error(res, 400, 'Email in use');
    }
    const otp = await genOTP(email, 'admin-register');
    await sendMail(email, 'Your Admin Registration OTP',
        `<p>Hello ${name},</p><p>Your OTP is <b>${otp}</b>. Expires in 10 minutes.</p>`
    );
    success(res, null, 'OTP sent');
});

const adminRegisterVerifyOtp = asyncHandler(async(req, res) => {
    const { email, otp } = req.body;
    const rec = await PasswordToken.findOne({ where: { email, type: 'admin-register' } });
    if (!rec || rec.otp !== otp || rec.expiresAt < Date.now()) {
        return error(res, 400, 'Invalid or expired OTP');
    }
    success(res, null, 'OTP verified');
});

const adminRegisterComplete = asyncHandler(async(req, res) => {
    const { name, email, password, securityCode } = req.body;
    if (securityCode !== ADMIN_SECURITY_CODE) {
        return error(res, 403, 'Invalid security code');
    }
    const user = await User.create({ name, email, password, role: 'admin' });
    await PasswordToken.destroy({ where: { email, type: 'admin-register' } });
    success(res, { id: user.id }, 'Admin registered');
});

module.exports = {
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
    adminRegisterComplete,
};