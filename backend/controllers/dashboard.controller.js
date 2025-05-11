// backend/controllers/dashboard.controller.js
const asyncHandler = require('express-async-handler');
const { Employee, Leave, Payroll } = require('../models');

exports.summary = asyncHandler(async(req, res) => {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    // 1) Total employees
    const totalEmployees = await Employee.count();

    // 2) Pending leaves
    const leaveWhere = { status: 'pending' };
    if (req.user.role !== 'admin') {
        // lookup by email instead of by non-existent userId
        const me = await Employee.findOne({ where: { email: req.user.email } });
        leaveWhere.employeeId = me ? me.id : -1;
    }
    const pendingLeaves = await Leave.count({ where: leaveWhere });

    // 3) Upcoming payroll
    const payrollWhere = { month: thisMonth, year: thisYear };
    if (req.user.role !== 'admin') {
        const me = await Employee.findOne({ where: { email: req.user.email } });
        payrollWhere.employeeId = me ? me.id : -1;
    }
    const upcomingPayroll = (await Payroll.sum('net', { where: payrollWhere })) || 0;

    return res.json({ totalEmployees, pendingLeaves, upcomingPayroll });
});