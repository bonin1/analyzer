require('dotenv').config();

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: 'auth_token'
  },
  api: {
    secretKey: process.env.API_SECRET_KEY || 'dev_secret_key_12345'
  },
  server: {
    port: process.env.PORT || 3001
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'nonprofit_analyzer',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  }
};
