// backend/config/db.config.js
require('dotenv').config();
const path = require('path');
const { Sequelize } = require('sequelize');

// If you explicitly set DB_DIALECT to "mysql", it'll use MySQL.
// Otherwise it falls back to SQLite.
const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;
if (dialect === 'mysql') {
  // (Optional) keep your MySQL URL logic if you ever want to switch back:
  const url = process.env.MYSQL_URL || process.env.DB_URL;
  if (!url) {
    console.error('❌ DB_DIALECT=mysql but no MYSQL_URL or DB_URL provided');
    process.exit(1);
  }
  sequelize = new Sequelize(url, {
    dialect: 'mysql',
    logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
  });
} else {
  // SQLite mode
  // Use DB_STORAGE if set, otherwise store a file under /data/database.sqlite
  const storagePath = process.env.DB_STORAGE
    ? path.resolve(process.env.DB_STORAGE)
    : path.resolve(__dirname, '..', 'data', 'database.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
  });
}

module.exports = sequelize;
