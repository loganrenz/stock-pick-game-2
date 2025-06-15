import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PROD_URL = 'https://api.stockpickgame.tideye.com';

beforeAll(() => {});
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Next Week Pick Flow (PROD)', () => {
  let token: string;
  let nextWeek: any;

  it('should log in as logan', async () => {
    const res = await request(PROD_URL)
      .post('/api/login')
      .send({ username: 'logan', password: 'loganpw' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should get the next week', async () => {
    const res = await request(PROD_URL)
      .get('/api/next-week');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    nextWeek = res.body;
    expect(nextWeek).toHaveProperty('id');
    expect(Array.isArray(nextWeek.picks)).toBe(true);
  });

  it('should submit a pick for next week as logan', async () => {
    const res = await request(PROD_URL)
      .post('/api/weeks/next/picks')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'AAPL' });
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.symbol).toBe('AAPL');
    expect(res.body.weekId).toBe(nextWeek.id);
    expect(res.body.user.username).toBe('logan');
  });

  it('should see logan\'s pick for next week in /api/next-week', async () => {
    const res = await request(PROD_URL)
      .get('/api/next-week');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    const found = res.body.picks.find((p: any) => p.user && p.user.username === 'logan' && p.symbol === 'AAPL');
    expect(found).toBeDefined();
    expect(found.symbol).toBe('AAPL');
    expect(found.user.username).toBe('logan');
  });
}); 