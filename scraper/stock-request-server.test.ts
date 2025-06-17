import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import { app } from './stock-request-server';

// Mock scrapeOhlc for dependency injection
const mockScrapeOhlc = async (symbol: string, date: string) => {
  if (symbol === 'AAPL' && date === '2025-06-16') {
    return {
      symbol: 'AAPL',
      date: '2025-06-16',
      open: '100',
      high: '110',
      low: '90',
      close: '105',
      adjClose: '105',
      volume: '1000000',
    };
  }
  throw new Error('No data found');
};

beforeAll(() => {
  app.locals.scrapeOhlc = mockScrapeOhlc;
});

describe('/api/stock endpoint', () => {
  it('returns OHLC data for a valid symbol and date', async () => {
    const res = await request(app)
      .post('/api/stock')
      .send({ symbol: 'AAPL', date: '2025-06-16' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('symbol', 'AAPL');
    expect(res.body).toHaveProperty('date', '2025-06-16');
    expect(res.body).toHaveProperty('open');
    expect(res.body).toHaveProperty('high');
    expect(res.body).toHaveProperty('low');
    expect(res.body).toHaveProperty('close');
    expect(res.body).toHaveProperty('adjClose');
    expect(res.body).toHaveProperty('volume');
  });

  it('returns 400 for missing params', async () => {
    const res = await request(app)
      .post('/api/stock')
      .send({ symbol: 'AAPL' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 500 for unknown symbol/date', async () => {
    const res = await request(app)
      .post('/api/stock')
      .send({ symbol: 'UNKNOWN', date: '2025-01-01' });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
}); 