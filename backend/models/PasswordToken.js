// backend/models/PasswordToken.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const PasswordToken = sequelize.define('PasswordToken', {
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    indexes: [
        // allow upsert by email+type
        { unique: true, fields: ['email', 'type'] }
    ]
});

module.exports = PasswordToken;