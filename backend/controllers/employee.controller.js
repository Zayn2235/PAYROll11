// backend/controllers/employee.controller.js

const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const { Employee, User } = require('../models');
const { success, error } = require('../utils/responseFormatter');

// Admin: list all employees
exports.getAll = asyncHandler(async(req, res) => {
    const emps = await Employee.findAll({
        order: [
            ['createdAt', 'DESC']
        ]
    });
    success(res, emps);
});

// Any user: fetch by id
exports.getOne = asyncHandler(async(req, res) => {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return error(res, 404, 'Employee not found');
    success(res, emp);
});

// Admin: create new Employee + matching User
// Default password = first4(name).toLowerCase() + '123'
exports.create = asyncHandler(async(req, res) => {
    const { name, email, department, role, salary } = req.body;

    // Prevent duplicate email across both tables
    if (await Employee.findOne({ where: { email } }) ||
        await User.findOne({ where: { email } })) {
        return error(res, 400, 'Email already in use');
    }

    // Build default password
    const defaultPwd = name.trim().substring(0, 4).toLowerCase() + '123';
    // Hash for Employee
    const hash = await bcrypt.hash(defaultPwd, 10);

    // Create Employee record (stores hashed)
    const emp = await Employee.create({
        name,
        email,
        department,
        role,
        salary,
        password: hash
    });

    // Create User record (hooks will hash the plaintext)
    await User.create({
        name,
        email,
        password: defaultPwd,
        role: 'user' // must match User.role ENUM('user','admin')
    });

    // Return both the employee and the plaintext default
    success(res, { emp, defaultPassword: defaultPwd }, 'Employee created');
});

// Admin: update both Employee & User
exports.update = asyncHandler(async(req, res) => {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return error(res, 404, 'Employee not found');

    const { name, email, department, role, salary } = req.body;

    // Prevent duplicate email
    if (email !== emp.email &&
        (await Employee.findOne({ where: { email } }) ||
            await User.findOne({ where: { email } }))) {
        return error(res, 400, 'Email already in use');
    }

    const oldEmail = emp.email;
    await emp.update({ name, email, department, role, salary });

    // Mirror into User row
    const user = await User.findOne({ where: { email: oldEmail } });
    if (user) {
        await user.update({ name, email /* keep role='user' */ });
    }

    success(res, emp, 'Employee updated');
});

// Admin: delete both Employee & User
exports.remove = asyncHandler(async(req, res) => {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return error(res, 404, 'Employee not found');

    const email = emp.email;
    await emp.destroy();
    await User.destroy({ where: { email } });

    success(res, null, 'Employee deleted');
});

// Employee self‐service: update own profile
exports.updateProfile = asyncHandler(async(req, res) => {
    const id = req.user.id;
    const emp = await Employee.findByPk(id);
    if (!emp) return error(res, 404, 'Not found');

    const { name, email } = req.body;
    if (email !== emp.email &&
        await Employee.findOne({ where: { email } })) {
        return error(res, 400, 'Email in use');
    }

    emp.name = name;
    emp.email = email;
    await emp.save();
    success(res, { name: emp.name, email: emp.email }, 'Profile updated');
});

// Employee: change own password (and sync into User)
exports.changePassword = asyncHandler(async(req, res) => {
    const id = req.user.id;
    const emp = await Employee.findByPk(id);
    if (!emp) return error(res, 404, 'Not found');

    const { currentPassword, newPassword } = req.body;
    const match = await bcrypt.compare(currentPassword, emp.password);
    if (!match) return error(res, 401, 'Current password incorrect');

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);
    emp.password = hash;
    await emp.save();

    // Update User table too
    await User.update({ password: newPassword }, // plaintext → hooks will hash
        { where: { email: emp.email } }
    );

    success(res, null, 'Password changed');
});