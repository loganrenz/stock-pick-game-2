import { describe, it, expect, beforeEach } from 'vitest';
import { TestServer } from '../../helpers/test-server.js';

const testServer = TestServer.getInstance();
let testUser: { username: string; password: string } = {
  username: 'logan',
  password: 'loganpw'
};
let db, weeks;

beforeEach(async () => {
  db = (await import('../../../api-helpers/lib/db.js')).db;
  weeks = (await import('../../../api-helpers/lib/schema.js')).weeks;
  await testServer.createTestUser(testUser);
});

describe('GET /api/auth/verify', () => {
  it('should return 401 when no token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/verify`);
    expect(response.status).toBe(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/verify`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    expect(response.status).toBe(401);
  });

  it('should return 200 and user data when valid token is provided', async () => {
    const loginResponse = await fetch(`${testServer.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    const { token } = await loginResponse.json();

    const response = await fetch(`${testServer.baseUrl}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('username', testUser.username);
  });

  it('should return 405 for non-GET methods', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/verify`, {
      method: 'POST'
    });
    expect(response.status).toBe(405);
  });
}); 