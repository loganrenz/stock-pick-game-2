import 'dotenv/config';

const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  isDevelopment,
  database: {
    url: isDevelopment
      ? process.env.TURSO_DB_URL_DEV || process.env.TURSO_DB_URL
      : process.env.TURSO_DB_URL,
    token: isDevelopment
      ? process.env.TURSO_DB_TOKEN_DEV || process.env.TURSO_DB_TOKEN
      : process.env.TURSO_DB_TOKEN,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiry: '1y',
  },
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
  },
};

// Log configuration values
console.log('[CONFIG] Environment:', isDevelopment ? 'development' : 'production');
console.log('[CONFIG] Database URL:', config.database.url);
console.log('[CONFIG] Database token present:', !!config.database.token);
