const asyncHandler = require('express-async-handler');
const { Leave, Employee } = require('../models');
const { success, error } = require('../utils/responseFormatter');

// 1) Employee applies
exports.apply = asyncHandler(async(req, res) => {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
        return error(res, 400, 'startDate, endDate, and reason are required');
    }

    // 🔍 Find the matching Employee row by the currently logged-in email
    //    (we assume your auth.middleware populates req.user.email)
    const emp = await Employee.findOne({
        where: { email: req.user.email }
    });
    if (!emp) {
        return error(res, 404,
            'No employee record found for this user; please contact Admin');
    }

    //  Create the leave with the correct employeeId
    const leave = await Leave.create({
        employeeId: emp.id,
        startDate,
        endDate,
        reason
    });

    success(res, leave, 'Leave applied');
});

// 2) Employee: list own requests
exports.getMine = asyncHandler(async(req, res) => {
    // again map user → employee
    const emp = await Employee.findOne({ where: { email: req.user.email } });
    if (!emp) return error(res, 404, 'Employee record missing');

    const arr = await Leave.findAll({
        where: { employeeId: emp.id },
        order: [
            ['createdAt', 'DESC']
        ]
    });
    success(res, arr);
});

// 3) Admin: list all pending
exports.getPending = asyncHandler(async(req, res) => {
    const arr = await Leave.findAll({
        where: { status: 'pending' },
        order: [
            ['createdAt', 'ASC']
        ]
    });
    success(res, arr);
});

// 4) Admin: approve or reject
exports.decide = asyncHandler(async(req, res) => {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return error(res, 400, 'Invalid status');
    }
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) return error(res, 404, 'Leave request not found');

    await leave.update({ status, adminNote });
    success(res, leave, `Leave ${status}`);
});