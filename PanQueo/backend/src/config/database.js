const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'postgres';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: dialect,
  logging: process.env.NODE_ENV === 'development' ? false : false,
  define: {
    timestamps: true,
    underscored: true,
  },
};

if (dialect !== 'sqlite') {
  config.pool = {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  };
} else if (process.env.DB_STORAGE) {
  config.storage = process.env.DB_STORAGE;
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'panqueo',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  config
);

module.exports = sequelize;
