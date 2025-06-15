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

describe('Pick Submission and Modification', () => {
  let token: string;
  let currentWeek: any;
  let submittedPick: any;

  it('should log in as patrick', async () => {
    const res = await request(server)
      .post('/api/login')
      .send({ username: 'logan', password: 'loganpw' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should get the current week', async () => {
    const res = await request(server)
      .get('/api/weeks/current')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    currentWeek = res.body;
  });

  it('should submit a pick for the current week', async () => {
    const res = await request(server)
      .post('/api/picks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        weekId: currentWeek.id
      });
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.symbol).toBe('AAPL');
    expect(res.body.weekId).toBe(currentWeek.id);
    expect(res.body.entryPrice).toBeDefined();
    submittedPick = res.body;
  });

  it('should fetch the current week and verify the new pick is present', async () => {
    const res = await request(server)
      .get('/api/weeks/current')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(Array.isArray(res.body.picks)).toBe(true);
    const found = res.body.picks.find((p: any) => p.id === submittedPick.id);
    expect(found).toBeDefined();
    expect(found.symbol).toBe('AAPL');
    expect(found.userId).toBe(submittedPick.userId);
  });

  it('should modify the existing pick to a different symbol', async () => {
    const res = await request(server)
      .post('/api/picks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'MSFT',
        weekId: currentWeek.id
      });
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.symbol).toBe('MSFT');
    expect(res.body.weekId).toBe(currentWeek.id);
    expect(res.body.id).toBe(submittedPick.id); // Same pick ID
    expect(res.body.entryPrice).toBeDefined();
    submittedPick = res.body;
  });

  it('should verify the pick was modified correctly', async () => {
    const res = await request(server)
      .get('/api/weeks/current')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(Array.isArray(res.body.picks)).toBe(true);
    const found = res.body.picks.find((p: any) => p.id === submittedPick.id);
    expect(found).toBeDefined();
    expect(found.symbol).toBe('MSFT');
    expect(found.userId).toBe(submittedPick.userId);
    expect(found.entryPrice).toBeDefined();
  });

  it('should not allow submitting a pick for a past week', async () => {
    // Create a past week
    const pastWeek = await prisma.week.create({
      data: {
        weekNum: 1,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
      }
    });

    const res = await request(server)
      .post('/api/picks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        weekId: pastWeek.id
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot submit pick for past week');
  });
}); 