import { describe, it, expect, beforeEach } from 'vitest';
import { TestServer } from '../../helpers/test-server.js';

const testServer = TestServer.getInstance();
let testUser = { username: 'logan', password: 'loganpw' };
let token: string;

beforeEach(async () => {
  await testServer.createTestUser(testUser);
  token = await testServer.getAuthToken(testUser);
});

describe('GET /api/auth/me', () => {
  it('should return 401 when no token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/me`, {
      method: 'GET',
    });
    expect(response.status).toBe(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    expect(response.status).toBe(401);
  });

  it('should return 200 and user info when valid token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('username', testUser.username);
  });

  it('should return 405 for non-GET methods', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/me`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status).toBe(405);
  });
}); 