// backend/config/db.config.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// prefer your own DB_* envs, but fall back to Railway's MYSQL_* if unset
const database = process.env.DB_NAME       || process.env.MYSQL_DATABASE;
const username = process.env.DB_USER       || process.env.MYSQLUSER   || process.env.MYSQL_USER;
const password = process.env.DB_PASSWORD   || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD;
const host     = process.env.DB_HOST       || process.env.MYSQLHOST    || process.env.MYSQL_HOST;
const port     = process.env.DB_PORT       || process.env.MYSQLPORT    || process.env.MYSQL_PORT;
const dialect  = process.env.DB_DIALECT    || 'mysql';

if (!database || !username || !password || !host) {
  console.error('❌ Missing database connection environment variables');
  process.exit(1);
}

const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect,
  logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
  pool: {
    max:   5,
    min:   0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
