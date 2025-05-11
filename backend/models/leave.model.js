const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Leave = sequelize.define('Leave', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { // enforce FK at the DB level
            model: 'employees', // table name
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    adminNote: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'leaves',
    timestamps: true
});

module.exports = Leave;