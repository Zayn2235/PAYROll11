// backend/config/db.config.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const url = process.env.DB_URL           // if you ever add your own
          || process.env.MYSQL_URL      // Railway’s internal URL
          || process.env.MYSQL_PUBLIC_URL; // (optional) public‐facing URL

if (!url) {
  console.error('❌ No database URL found in DB_URL, MYSQL_URL or MYSQL_PUBLIC_URL');
  process.exit(1);
}

const sequelize = new Sequelize(url, {
  dialect: 'mysql',    // URL already encodes "mysql://"
  logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
