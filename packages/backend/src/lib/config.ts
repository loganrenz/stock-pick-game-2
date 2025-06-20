import 'dotenv/config';

const isDevelopment = process.env.NODE_ENV === 'development';

type Config = {
  isDevelopment: boolean;
  database: {
    url: string;
    token: string | undefined;
  };
  jwt: {
    secret: string;
    expiry: string;
  };
  alphaVantage: {
    apiKey: string;
  };
};

export const config: Config = {
  isDevelopment,
  database: {
    url: process.env.DATABASE_URL || 'file:../../data/stock-pick-game.db',
    token: process.env.DATABASE_AUTH_TOKEN,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiry: process.env.JWT_EXPIRY || '1y',
  },
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
  },
};

// Log configuration values
console.log('[CONFIG] Environment:', isDevelopment ? 'development' : 'production');
console.log('[CONFIG] Database URL:', config.database.url);
console.log('[CONFIG] Database token present:', !!config.database.token);
