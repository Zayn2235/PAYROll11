// backend/models/payrollFund.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

// single‐row table for all funds
const PayrollFund = sequelize.define('PayrollFund', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1
    },
    amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'payroll_funds',
    timestamps: true
});

module.exports = PayrollFund;