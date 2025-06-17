import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestServer } from '../../helpers/test-server.js';
import { db } from '../../api/lib/db.js';
import { weeks } from '../../api/lib/schema.js';

describe('GET /api/weeks/current', () => {
  const testServer = new TestServer();
  let authToken: string;

  beforeAll(async () => {
    // Create a test user and get auth token
    const testUser = await testServer.createTestUser({
      username: 'testuser',
      password: 'testpass'
    });
    authToken = await testServer.getAuthToken(testUser);

    // Insert a test week
    await db.insert(weeks).values({
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalPicks: 0
    });
  });

  afterAll(async () => {
    await testServer.cleanup();
  });

  it('should return 401 when no auth token is provided', async () => {
    const response = await fetch('http://localhost:3004/api/weeks/current');
    expect(response.status).toBe(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await fetch('http://localhost:3004/api/weeks/current', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    expect(response.status).toBe(401);
  });

  it('should return current week data with valid token', async () => {
    const response = await fetch('http://localhost:3004/api/weeks/current', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('startDate');
    expect(data).toHaveProperty('endDate');
  });

  it('should return 405 for non-GET methods', async () => {
    const response = await fetch('http://localhost:3004/api/weeks/current', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    expect(response.status).toBe(405);
  });
}); 