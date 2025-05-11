// backend/models/index.js

// initialize Sequelize instance (now MySQL)
const sequelize = require('../config/db.config');

// require each model (they call sequelize.define internally)
const User = require('./user.model');
const Employee = require('./employee.model');
const Payroll = require('./payroll.model');
const Leave = require('./leave.model');
const Tax = require('./tax.model');
const PasswordToken = require('./PasswordToken');
const PayrollFund = require('./payrollFund.model');

// ─── Associations ─────────────────────────────────────────────────────
Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
Leave.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Tax, { foreignKey: 'employeeId', as: 'taxRecords' });
Tax.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// PasswordTokens are independent—no associations needed here

module.exports = {
    sequelize,
    User,
    Employee,
    Payroll,
    PayrollFund,
    Leave,
    Tax,
    PasswordToken
};