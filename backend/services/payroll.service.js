// backend/services/payroll.service.js
const { Payroll, Employee, Tax, PayrollFund } = require('../models');
const { calculateIncomeTax, calculateNI } = require('./tax.service');

// Default salaries for each role
const defaultSalaries = {
    'Backend Developer': 35000,
    'Database Admin': 32000,
    'API Engineer': 34000,
    'Frontend Developer': 25000,
    'UI Engineer': 26000,
    'Accessibility Specialist': 24000,
    'DevOps Engineer': 33000,
    'Release Manager': 31000,
    'SRE': 30000,
    'QA Engineer': 28000,
    'Test Automation Engineer': 29000,
    'Manual Tester': 27000,
    'Product Manager': 45000,
    'Associate PM': 35000,
    'Product Owner': 40000,
    'UX Designer': 30000,
    'UI Designer': 30000,
    'Interaction Designer': 29000,
    'Data Scientist': 50000,
    'Data Analyst': 38000,
    'ML Engineer': 48000,
    'Accountant': 36000,
    'Financial Analyst': 37000,
    'Controller': 42000,
    'Sales Exec': 30000,
    'Marketing Manager': 40000,
    'BD Manager': 38000,
    'Support Specialist': 25000,
    'CS Manager': 34000,
    'Tech Support': 26000,
    'IT Support': 30000,
    'SysAdmin': 32000,
    'Network Admin': 33000,
    'Training Coordinator': 28000,
    'L&D Specialist': 30000,
    'Operations Manager': 45000,
    'Supply Chain Analyst': 37000,
    'CEO': 120000,
    'COO': 110000,
    'CTO': 115000,
    'CFO': 110000
};

/**
 * 1) Get the current payroll summary (for dashboard cards)
 */
async function getPayrollSummary() {
    const recs = await Payroll.findAll({ attributes: ['gross', 'tax', 'ni', 'net'] });
    const totalGross = recs.reduce((sum, r) => sum + parseFloat(r.gross), 0);
    const totalTax = recs.reduce((sum, r) => sum + parseFloat(r.tax), 0);
    const totalNI = recs.reduce((sum, r) => sum + parseFloat(r.ni), 0);
    return {
        total: +totalGross.toFixed(2),
        tax: +totalTax.toFixed(2),
        net: +(totalGross - totalTax - totalNI).toFixed(2)
    };
}

/**
 * 2) Deposit funds (accumulate in single row id=1)
 */
async function addPayrollFund({ amount }) {
    const [fund, created] = await PayrollFund.findOrCreate({
        where: { id: 1 },
        defaults: { amount }
    });
    if (!created) {
        fund.amount = parseFloat(fund.amount) + parseFloat(amount);
        await fund.save();
    }
    return fund;
}

/**
 * 3) Read current fund
 */
async function getPayrollFund() {
    return PayrollFund.findByPk(1);
}

/**
 * 4) Distribute the entire pool for given month/year (and optional department/role),
 *    creating Payroll+Tax rows, then zero‐out the fund
 */
async function distributePoolPayroll({ month, year, department, role }) {
    // 4a) load and validate fund
    const fund = await getPayrollFund();
    if (!fund) throw new Error('No payroll fund available');

    // 4b) select employees
    const where = {};
    if (department) where.department = department;
    if (role) where.role = role;
    const emps = await Employee.findAll({ where });
    if (!emps.length) throw new Error('No matching employees');

    // 4c) for each, use either e.salary or default
    let totalDue = 0;
    for (const e of emps) {
        const gross = e.salary ?
            parseFloat(e.salary) :
            (defaultSalaries[e.role] || 0);
        totalDue += gross;

        const incomeTax = calculateIncomeTax(gross);
        const niAmt = calculateNI(gross);
        const net = gross - incomeTax - niAmt;

        // create payroll record
        await Payroll.create({
            employeeId: e.id,
            gross,
            tax: incomeTax,
            ni: niAmt,
            net,
            month,
            year
        });
        // separate Tax table if desired
        await Tax.create({
            employeeId: e.id,
            incomeTax,
            ni: niAmt,
            total: incomeTax + niAmt,
            month,
            year
        });
    }

    // 4d) deduct exactly what we paid
    fund.amount = Math.max(0, parseFloat(fund.amount) - totalDue);
    await fund.save();
}

module.exports = {
    getPayrollSummary,
    addPayrollFund,
    getPayrollFund,
    distributePoolPayroll
};