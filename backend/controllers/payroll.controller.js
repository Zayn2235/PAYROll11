// backend/controllers/payroll.controller.js
const asyncHandler = require('express-async-handler');
const { success, error } = require('../utils/responseFormatter');
const svc = require('../services/payroll.service');

exports.summary = asyncHandler(async(req, res) => {
    const data = await svc.getPayrollSummary();
    success(res, data);
});

exports.addFund = asyncHandler(async(req, res) => {
    const { amount } = req.body;
    if (amount == null) {
        return error(res, 400, 'Amount is required');
    }
    const fund = await svc.addPayrollFund({ amount });
    success(res, { fund });
});

exports.getFund = asyncHandler(async(req, res) => {
    const fund = await svc.getPayrollFund();
    success(res, { fund: fund || { amount: 0 } });
});

exports.distribute = asyncHandler(async(req, res) => {
    const { month, year, department, role } = req.body;
    await svc.distributePoolPayroll({ month, year, department, role });
    success(res, { message: 'Payroll pool distributed' });
});