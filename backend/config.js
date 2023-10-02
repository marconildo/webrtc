require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4005,
  retryAfter: 10000,
};