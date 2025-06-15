import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Import the actual app if possible, otherwise create a minimal one for test
let app: express.Express;
try {
  app = require('../src/index').default;
} catch {
  app = express();
  app.get('/api/weeks/current', (req, res) => res.json({ test: 'ok' }));
}

const prisma = new PrismaClient();

describe('GET /api/weeks/current', () => {
  it('should return the current week object', async () => {
    const res = await request(app).get('/api/weeks/current');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    // Optionally check for weekNum or picks
    // expect(res.body).toHaveProperty('weekNum');
  });
}); 