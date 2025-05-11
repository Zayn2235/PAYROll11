const asyncHandler = require('express-async-handler');
const { User } = require('../models');
const { success, error } = require('../utils/responseFormatter');

exports.changePassword = asyncHandler(async(req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return error(res, 404, 'User not found');

    if (!(await user.comparePassword(currentPassword))) {
        return error(res, 401, 'Current password incorrect');
    }
    user.password = newPassword;
    await user.save(); // beforeUpdate hook hashes
    success(res, null, 'Password changed');
});

exports.updateProfile = asyncHandler(async(req, res) => {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return error(res, 404, 'User not found');

    user.name = name;
    user.email = email;
    await user.save();
    success(res, { name: user.name, email: user.email }, 'Profile updated');
});