// backend/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { User } = require('../models');
const { error } = require('../utils/responseFormatter');

exports.protect = asyncHandler(async(req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return error(res, 401, 'Not authorized');
    }

    try {
        // 1) verify & decode
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // 2) fetch the user so we get the role
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'name', 'email', 'role']
        });
        if (!user) {
            return error(res, 401, 'Not authorized');
        }
        // 3) attach the full user
        req.user = user;
        next();
    } catch (err) {
        return error(res, 401, 'Not authorized');
    }
});