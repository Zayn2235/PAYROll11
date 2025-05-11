// backend/config/db.config.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const url = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
if (!url) {
  console.error('❌ No MYSQL_URL in env — did you add a Variable Reference?');
  process.exit(1);
}

module.exports = new Sequelize(url, {
  dialect: 'mysql',
  logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
  pool: { max:5, min:0, acquire:30000, idle:10000 }
});
