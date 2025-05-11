// backend/config/db.config.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// 1) Try a single connection string first (Railway-provided)
const url =
  process.env.DB_URL             ||  // your own if you ever set it
  process.env.MYSQL_URL          ||  // Railway’s internal URL
  process.env.MYSQL_PUBLIC_URL;     // Railway’s external URL

if (url) {
  module.exports = new Sequelize(url, {
    dialect: 'mysql',     // url already includes the protocol
    logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
    pool: { max:5, min:0, acquire:30000, idle:10000 }
  });
  return;
}

// 2) Otherwise build from pieces
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
  host, port, dialect: 'mysql',
  logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
  pool: { max:5, min:0, acquire:30000, idle:10000 }
});
