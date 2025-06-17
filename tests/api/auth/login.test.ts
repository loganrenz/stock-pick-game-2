import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestServer } from '../../helpers/test-server.js';
import { db } from '../../../api/lib/db.js';

describe('POST /api/auth/login', () => {
  const testServer = new TestServer();
  let testUser: { username: string; password: string } = {
    username: 'logan',
    password: 'loganpw'
  };
  let db, weeks;

  beforeAll(async () => {
    console.log('[TEST] Environment variables:', process.env);
    console.log('[TEST] Starting test server...');
    await testServer.start();
    console.log('[TEST] Test server started at', testServer.baseUrl);
    db = (await import('../../../api/lib/db.js')).db;
    weeks = (await import('../../../api/lib/schema.js')).weeks;
    console.log('[TEST] DB and schema loaded');
  });

  afterAll(async () => {
    await testServer.cleanup();
  });

  it('should return 400 when no credentials are provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(400);
  });

  it('should return 400 when only username is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: testUser.username })
    });
    expect(response.status).toBe(400);
  });

  it('should return 400 when only password is provided', async () => {
    const response = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: testUser.password })
    });
    expect(response.status).toBe(400);
  });

  it('should return 401 when invalid credentials are provided', async () => {
    const response = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'invalid',
        password: 'invalid'
      })
    });
    expect(response.status).toBe(401);
  });

  it('should return 200 and token when valid credentials are provided', async () => {
    const response = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('username', testUser.username);
  });

  it('should return 405 for non-POST methods', async () => {
    const response = await fetch('http://localhost:3004/api/auth/login', {
      method: 'GET'
    });
    expect(response.status).toBe(405);
  });
}); 