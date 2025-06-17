import dotenv from 'dotenv';
import { describe, it, expect, beforeAll, afterAll, test } from 'vitest';
import { TestServer } from '../../helpers/test-server.js';

dotenv.config({ path: '.env.test' });

let db, weeks, token;
describe('GET /api/weeks/current', { timeout: 30000 }, () => {
  const testServer = new TestServer();

  beforeAll(async () => {
    console.log('[TEST] Environment variables:', process.env);
    console.log('[TEST] Starting test server...');
    await testServer.start();
    console.log('[TEST] Test server started at', testServer.baseUrl);
    db = (await import('../../../api/lib/db.js')).db;
    weeks = (await import('../../../api/lib/schema.js')).weeks;
    console.log('[TEST] DB and schema loaded');

    // Create a test user and get auth token
    const testUser = await testServer.createTestUser({
      username: 'logan',
      password: 'loganpw'
    });
    console.log('[TEST] Test user created:', testUser);

    // Log in the test user to get a valid JWT token
    const loginResponse = await fetch(`${testServer.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
      }),
    });
    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    token = loginData.token;

    // Test the /api/weeks/current endpoint
    const response = await fetch(`${testServer.baseUrl}/api/weeks/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('week');

    // Comment out migrate and seed setup for faster iterations
    // await fetch(`${baseUrl}/api/test/setup`, { method: 'POST' });
  });

  afterAll(async () => {
    await testServer.cleanup();
    await testServer.stop();
  });

  it('should return 401 when no auth token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/weeks/current`);
    expect(response.status).toBe(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/weeks/current`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    expect(response.status).toBe(401);
  });

  it('should return 405 for non-GET methods', async () => {
    const response = await fetch(`${testServer.baseUrl}/api/weeks/current`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    expect(response.status).toBe(405);
  });
});

