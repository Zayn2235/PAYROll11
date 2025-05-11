const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Payroll = sequelize.define('Payroll', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gross: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    ni: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    net: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'payrolls',
    timestamps: true
});

module.exports = Payroll;