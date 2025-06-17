import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import getPort from 'get-port';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test if it exists
const envTestPath = path.resolve(process.cwd(), '.env.test');
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
  console.log('[TEST SERVER] After loading .env.test:');
  console.log('  TURSO_DB_URL:', process.env.TURSO_DB_URL);
  console.log('  TURSO_DB_TOKEN:', process.env.TURSO_DB_TOKEN);
}

export interface TestUser {
  username: string;
  password: string;
  id?: number;
}

export class TestServer {
  private serverProcess: ChildProcessWithoutNullStreams | null = null;
  public baseUrl: string = '';
  private testUsers: TestUser[] = [];

  async start() {
    const port = await getPort();
    this.baseUrl = `http://localhost:${port}`;
    console.log('[TEST SERVER] TURSO_DB_URL before spawn:', process.env.TURSO_DB_URL);
    console.log('[TEST SERVER] TURSO_DB_TOKEN before spawn:', process.env.TURSO_DB_TOKEN);
    this.serverProcess = spawn('vercel', ['dev', '--listen', String(port)], {
      env: {
        ...process.env,
        TURSO_DB_URL: process.env.TURSO_DB_URL,
        TURSO_DB_TOKEN: process.env.TURSO_DB_TOKEN,
        NODE_ENV: 'test',
      },
      stdio: 'inherit',
    }) as ChildProcessWithoutNullStreams;
    // Wait for server to be ready
    await this.waitForServerReady();
    // Add a small delay to ensure server is fully ready
    await new Promise((r) => setTimeout(r, 1000));

    // Call the /api/test/setup endpoint to run migration and seed
    console.log('[TEST] Calling /api/test/setup to migrate and seed...');
    const response = await fetch(`${this.baseUrl}/api/test/setup`, { method: 'POST' });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[TEST] Setup failed: ${error}`);
    }
    console.log('[TEST] /api/test/setup completed');
  }

  async stop() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  private async waitForServerReady(timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const res = await fetch(`${this.baseUrl}/api/auth/login`, { method: 'OPTIONS' });
        if (res.ok || res.status === 405) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error('Vercel dev server did not start in time');
  }

  async createTestUser(user: TestUser): Promise<TestUser> {
    // Use your API endpoint to create a user (or seed as needed)
    // For now, just store for cleanup
    this.testUsers.push(user);
    return user;
  }

  async cleanup() {
    // Optionally, call your API to delete test users
    this.testUsers = [];
  }

  async getAuthToken(user: TestUser): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: user.username,
        password: user.password
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get auth token: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.token;
  }
} 