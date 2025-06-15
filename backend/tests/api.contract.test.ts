import request from 'supertest';
import app from '../src/index';

const expectedPickFields = [
  'id',
  'userId',
  'weekId',
  'symbol',
  'entryPrice',
  'createdAt',
  'updatedAt',
  'dailyPriceData',
  'currentValue',
  'weekReturn',
  'returnPercentage',
  'user',
];

describe('API Contract', () => {
  it('/api/weeks/current returns picks with correct fields', async () => {
    const res = await request(app).get('/api/weeks/current');
    expect(res.status).toBe(200);
    const picks = res.body.picks;
    expect(Array.isArray(picks)).toBe(true);
    if (picks.length > 0) {
      for (const field of expectedPickFields) {
        expect(picks[0]).toHaveProperty(field);
      }
    }
  });

  it('/api/weeks returns picks with correct fields', async () => {
    const res = await request(app).get('/api/weeks');
    expect(res.status).toBe(200);
    const weeks = res.body;
    expect(Array.isArray(weeks)).toBe(true);
    if (weeks.length > 0 && weeks[0].picks.length > 0) {
      for (const field of expectedPickFields) {
        expect(weeks[0].picks[0]).toHaveProperty(field);
      }
    }
  });
}); 