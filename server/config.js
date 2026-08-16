const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const env = process.env;
const defaultPort = Number(env.PORT || 4000);

module.exports = {
  port: defaultPort,
  host: env.API_HOST || '0.0.0.0',
  baseUrl: env.API_BASE_URL || `http://localhost:${defaultPort}`,
  nodeEnv: env.NODE_ENV || 'development',
  allowedOrigins: (env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
