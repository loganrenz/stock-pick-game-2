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

describe('POST /api/auth/register', () => {
  it('should return 400 when no credentials are provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(400);
  });

  it('should return 400 when only username is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: testUser.username })
    });
    expect(response.status).toBe(400);
  });

  it('should return 400 when only password is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: testUser.password })
    });
    expect(response.status).toBe(400);
  });

  it('should return 409 when username already exists', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    expect(response.status).toBe(409);
  });

  it('should return 201 and token when valid credentials are provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'newuser',
        password: 'newpassword'
      })
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('username', 'newuser');
  });

  it('should return 405 for non-POST methods', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/register`, {
      method: 'GET'
    });
    expect(response.status).toBe(405);
  });
}); 