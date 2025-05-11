// backend/config/db.config.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// 1) Railway provides this internal URL as MYSQL_URL
const url = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;

if (url) {
  // If we have a full URL, use that and exit early
  module.exports = new Sequelize(url, {
    dialect: 'mysql',
    logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
  return;
}

// 2) Otherwise fall back to individual parts (just in case)
const database = process.env.DB_NAME 
               || process.env.MYSQL_DATABASE 
               || process.env.MYSQLDATABASE;

const username = process.env.DB_USER 
               || process.env.MYSQL_USER 
               || process.env.MYSQLUSER;

const password = process.env.DB_PASSWORD 
               || process.env.MYSQL_PASSWORD 
               || process.env.MYSQLPASSWORD;

const host     = process.env.DB_HOST 
               || process.env.MYSQL_HOST 
               || process.env.MYSQLHOST;

const port     = process.env.DB_PORT 
               || process.env.MYSQL_PORT 
               || process.env.MYSQLPORT;

if (!database || !username || !password || !host) {
  console.error('❌ Missing DB vars:', { database, username, hasPassword: !!password, host, port });
  process.exit(1);
}

module.exports = new Sequelize(database, username, password, {
  host,
  port,
  dialect: 'mysql',
  logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});
