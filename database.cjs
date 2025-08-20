// Database configuration for future use
// This can be extended to support PostgreSQL, MongoDB, etc.

const config = {
  development: {
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: console.log
  },
  production: {
    dialect: 'postgres',
    url: process.env.DATABASE_URL,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];