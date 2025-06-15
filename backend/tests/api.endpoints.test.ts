import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let server: any;

beforeAll((done) => {
  server = app.listen(0, done);
});
afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe('Auth Endpoints', () => {
  it('POST /api/login should fail with invalid credentials', async () => {
    const res = await request(server)
      .post('/api/login')
      .send({ username: 'notarealuser', password: 'badpass' });
    expect(res.status).toBe(401);
  });
});

describe('Week Endpoints', () => {
  it('GET /api/weeks/current should return current week', async () => {
    const res = await request(server).get('/api/weeks/current');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
  it('GET /api/weeks should return all weeks', async () => {
    const res = await request(server).get('/api/weeks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  it('GET /api/next-week should return next week or null', async () => {
    const res = await request(server).get('/api/next-week');
    expect(res.status).toBe(200);
  });
});

describe('Scoreboard', () => {
  it('GET /api/scoreboard should return scoreboard', async () => {
    const res = await request(server).get('/api/scoreboard');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Stats', () => {
  it('GET /api/stats should return stats', async () => {
    const res = await request(server).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('weeks');
    expect(res.body).toHaveProperty('picks');
  });
});

describe('Backfill and Update', () => {
  it('POST /api/backfill-all-picks should return message', async () => {
    const res = await request(server).post('/api/backfill-all-picks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
  it('POST /api/backfill-daily-prices should return message', async () => {
    const res = await request(server).post('/api/backfill-daily-prices');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
  it('POST /api/update-prices should return message', async () => {
    const res = await request(server).post('/api/update-prices');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
}); 