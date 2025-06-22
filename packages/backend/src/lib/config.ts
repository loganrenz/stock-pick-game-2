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
  apple: {
    teamId: string;
    clientId: string;
    keyId: string;
    privateKey: string;
    redirectUri: string;
  };
};

export const config: Config = {
  isDevelopment,
  database: {
    url: process.env.DATABASE_URL || 'file:../../data/stonx.db',
    token: process.env.DATABASE_AUTH_TOKEN,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiry: process.env.JWT_EXPIRY || '1y',
  },
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
  },
  apple: {
    teamId: process.env.APPLE_TEAM_ID || '',
    clientId: process.env.APPLE_CLIENT_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY || '',
    redirectUri: process.env.APPLE_REDIRECT_URI || '',
  },
};

// Log configuration values
console.log('[CONFIG] Environment:', isDevelopment ? 'development' : 'production');
console.log('[CONFIG] Database URL:', config.database.url);
console.log('[CONFIG] Database token present:', !!config.database.token);
console.log('[CONFIG] Apple Sign In configured:', !!config.apple.teamId && !!config.apple.clientId);
