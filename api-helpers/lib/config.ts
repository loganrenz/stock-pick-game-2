import { devConfig } from '../../dev.config.js';

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

export const config = {
  database: {
    url: process.env.TURSO_DB_URL || (isDevelopment ? devConfig.TURSO_DB_URL : ''),
    token: process.env.TURSO_DB_TOKEN || (isDevelopment ? devConfig.TURSO_DB_TOKEN : ''),
  },
  jwt: {
    secret: process.env.JWT_SECRET || (isDevelopment ? devConfig.JWT_SECRET : ''),
    expiry: process.env.JWT_EXPIRY || (isDevelopment ? devConfig.JWT_EXPIRY : '1d'),
  },
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || (isDevelopment ? devConfig.ALPHA_VANTAGE_API_KEY : ''),
  },
  isDevelopment,
};

// Log configuration values
console.log('[CONFIG] Environment:', isDevelopment ? 'development' : 'production');
console.log('[CONFIG] Database URL:', config.database.url);
console.log('[CONFIG] Database token present:', !!config.database.token); 