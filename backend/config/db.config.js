// backend/config/db.config.js
require('dotenv').config();
const { Sequelize } = require('sequelize');


const database = process.env.DB_NAME ||
    process.env.MYSQL_DATABASE ||
    process.env.MYSQLDATABASE;

const username = process.env.DB_USER ||
    process.env.MYSQL_USER ||
    process.env.MYSQLUSER;

const password = process.env.DB_PASSWORD ||
    process.env.MYSQL_PASSWORD ||
    process.env.MYSQLPASSWORD;

const host = process.env.DB_HOST ||
    process.env.MYSQL_HOST ||
    process.env.MYSQLHOST;

const port = process.env.DB_PORT ||
    process.env.MYSQL_PORT ||
    process.env.MYSQLPORT;

const dialect = process.env.DB_DIALECT || 'mysql';

if (!database || !username || !password || !host) {
    console.error('❌ Missing database connection environment variables:', {
        database,
        username,
        password: !!password,
        host,
        port
    });
    process.exit(1);
}

module.exports = new Sequelize(database, username, password, {
    host,
    port,
    dialect,
    logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

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
