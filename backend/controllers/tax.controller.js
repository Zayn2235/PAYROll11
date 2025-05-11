const asyncHandler = require('express-async-handler');
const { success } = require('../utils/responseFormatter');
const { getTaxSummary, assignTax } = require('../services/tax.service');

exports.summary = asyncHandler(async(req, res) => {
    const data = await getTaxSummary();
    success(res, data);
});

exports.assign = asyncHandler(async(req, res) => {
    const { employeeId, incomeTax, ni, providentFund, month, year } = req.body;
    await assignTax({ employeeId, incomeTax, ni, providentFund, month, year });
    success(res, { message: 'Tax record assigned' });
});