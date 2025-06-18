import { describe, it, expect, beforeEach } from 'vitest';
import { TestServer } from '../../helpers/test-server.js';

const testServer = TestServer.getInstance();
let testUser = { username: 'logan', password: 'loganpw' };
let token: string;

beforeEach(async () => {
  await testServer.createTestUser(testUser);
  token = await testServer.getAuthToken(testUser);
});

describe('POST /api/auth/logout', () => {
  it('should return 401 when no token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/logout`, {
      method: 'POST',
    });
    expect(response.status).toBe(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    expect(response.status).toBe(401);
  });

  it('should return 200 and message when valid token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message', 'Logged out successfully');
  });
}); 