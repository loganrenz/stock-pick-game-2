import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import authRoutes from './routes/auth.js';
import weekRoutes from './routes/weeks.js';
import scoreboardRoutes from './routes/scoreboard.js';
import statsRoutes from './routes/stats.js';
import stocksRoutes from './routes/stocks.js';
import { getStats } from './lib/stats.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 6969;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://appleid.cdn-apple.com'],
        styleSrc: ["'self'", "'unsafe-inline'"], // Unsafe-inline for Vue styles
        connectSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        frameSrc: ["'self'", 'https://appleid.cdn-apple.com'],
      },
    },
  }),
);
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:6969',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/weeks', weekRoutes);
app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/update-prices', stocksRoutes); // for POST /api/update-prices

// Serve static files from the frontend build
const frontendPath = path.join(process.cwd(), 'packages', 'frontend', 'dist');
app.use(express.static(frontendPath));

// Handle SPA routing - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // Serve the frontend index.html for all other routes
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.isDevelopment ? 'development' : 'production'}`);

  // Print the absolute path of the database file
  const dbPath = path.resolve(config.database.url.replace('file:', ''));
  logger.info(`Database file path: ${dbPath}`);

  try {
    const stats = await getStats();
    logger.info('Database stats:', stats);
  } catch (error) {
    logger.error('Failed to get database stats:', error);
  }
});

export default app;
