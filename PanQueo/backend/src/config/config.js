require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'panqueo_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};
