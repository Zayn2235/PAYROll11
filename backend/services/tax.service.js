const { Payroll, Tax } = require('../models');
const taxConfig = require('../config/tax.config');

function calculateIncomeTax(gross) {
    let taxable = Math.max(0, gross - taxConfig.personalAllowance);
    let tax = 0,
        prev = taxConfig.personalAllowance;
    for (const band of taxConfig.bands) {
        const amount = Math.min(taxable, band.upTo - prev);
        if (amount <= 0) break;
        tax += amount * band.rate;
        taxable -= amount;
        prev = band.upTo;
    }
    return +tax.toFixed(2);
}

function calculateNI(gross) {
    const { lowerLimit, upperLimit, rateLower, rateUpper } = taxConfig.ni;
    let ni = 0;
    if (gross > lowerLimit) {
        const tier1 = Math.min(gross, upperLimit) - lowerLimit;
        ni += tier1 * rateLower;
        if (gross > upperLimit) ni += (gross - upperLimit) * rateUpper;
    }
    return +ni.toFixed(2);
}

function calculateProvident(gross) {
    return +(gross * taxConfig.providentRate).toFixed(2);
}

async function getTaxSummary() {
    const recs = await Payroll.findAll({ attributes: ['gross', 'tax', 'ni', 'net'] });
    let incomeTax = 0,
        ni = 0,
        provident = 0,
        netTotal = 0;
    for (const r of recs) {
        incomeTax += parseFloat(r.tax);
        ni += parseFloat(r.ni);
        provident += calculateProvident(parseFloat(r.gross));
        netTotal += parseFloat(r.net);
    }
    const totalDeductions = incomeTax + ni + provident;
    return {
        incomeTax: +incomeTax.toFixed(2),
        ni: +ni.toFixed(2),
        providentFund: +provident.toFixed(2),
        totalDeductions: +totalDeductions.toFixed(2),
        netReceived: +netTotal.toFixed(2)
    };
}

async function assignTax({ employeeId, incomeTax, ni, providentFund, month, year }) {
    const total = +(incomeTax + ni + providentFund).toFixed(2);
    return Tax.create({ employeeId, incomeTax, ni, providentFund, total, month, year });
}

module.exports = {
    calculateIncomeTax,
    calculateNI,
    calculateProvident,
    getTaxSummary,
    assignTax
};