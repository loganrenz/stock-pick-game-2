import { createServer } from 'http';
import { parse } from 'url';
import { db } from '../../api-helpers/lib/db.js';
import { users } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import getPort from 'get-port';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Singleton instance
let instance: TestServer | null = null;

export interface TestUser {
  username: string;
  password: string;
  id?: number;
}

export class TestServer {
  private server: any;
  public baseUrl: string;
  private port: number;
  private serverProcess: ChildProcessWithoutNullStreams | null = null;
  private testUsers: TestUser[] = [];

  private constructor() {
    this.port = 3001;
    this.baseUrl = `http://localhost:${this.port}`;
  }

  public static getInstance(): TestServer {
    if (!instance) {
      instance = new TestServer();
    }
    return instance;
  }

  async start() {
    return new Promise<void>((resolve) => {
      this.server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        const path = parsedUrl.pathname;

        // Enable CORS
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
        );

        // Handle preflight request
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // Handle test setup
        if (path === '/api/test/setup') {
          res.statusCode = 200;
          res.end(JSON.stringify({ message: 'Test setup complete' }));
          return;
        }

        // Handle test cleanup
        if (path === '/api/test/cleanup') {
          res.statusCode = 200;
          res.end(JSON.stringify({ message: 'Test cleanup complete' }));
          return;
        }

        // Handle auth endpoints
        if (path?.startsWith('/api/auth/')) {
          const authPath = path.split('/').pop();
          switch (authPath) {
            case 'login':
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }
              let body = '';
              req.on('data', (chunk) => {
                body += chunk.toString();
              });
              req.on('end', async () => {
                try {
                  const { username, password } = JSON.parse(body);
                  if (!username || !password) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Username and password are required' }));
                    return;
                  }
                  const user = await db.query.users.findFirst({
                    where: eq(users.username, username)
                  });
                  if (!user || !user.password) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: 'Invalid username or password' }));
                    return;
                  }
                  const passwordMatch = await bcrypt.compare(password, user.password);
                  if (!passwordMatch) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: 'Invalid username or password' }));
                    return;
                  }
                  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
                  await db.update(users).set({ jwtToken: token }).where(eq(users.id, user.id));
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    token,
                    user: {
                      id: user.id,
                      username: user.username
                    }
                  }));
                } catch (error) {
                  console.error('Login error:', error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;

            case 'logout':
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }
              const logoutToken = req.headers.authorization?.split(' ')[1];
              if (!logoutToken) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'No token provided' }));
                return;
              }
              (async () => {
                try {
                  const decoded = jwt.verify(logoutToken, JWT_SECRET) as { userId: number };
                  await db.update(users).set({ jwtToken: null }).where(eq(users.id, decoded.userId));
                  res.statusCode = 200;
                  res.end(JSON.stringify({ message: 'Logged out successfully' }));
                } catch (error) {
                  console.error('Logout error:', error);
                  res.statusCode = 401;
                  res.end(JSON.stringify({ error: 'Invalid token' }));
                }
              })();
              return;

            case 'refresh-token':
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }
              const refreshToken = req.headers.authorization?.split(' ')[1];
              if (!refreshToken) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'No token provided' }));
                return;
              }
              (async () => {
                try {
                  const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: number };
                  const newToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1h' });
                  await db.update(users).set({ jwtToken: newToken }).where(eq(users.id, decoded.userId));
                  res.statusCode = 200;
                  res.end(JSON.stringify({ token: newToken }));
                } catch (error) {
                  console.error('Refresh token error:', error);
                  res.statusCode = 401;
                  res.end(JSON.stringify({ error: 'Invalid token' }));
                }
              })();
              return;

            case 'me':
              if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }
              const meToken = req.headers.authorization?.split(' ')[1];
              if (!meToken) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'No token provided' }));
                return;
              }
              (async () => {
                try {
                  const decoded = jwt.verify(meToken, JWT_SECRET) as { userId: number };
                  const user = await db.query.users.findFirst({
                    where: eq(users.id, decoded.userId)
                  });
                  if (!user || user.jwtToken !== meToken) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: 'Invalid token' }));
                    return;
                  }
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    id: user.id,
                    username: user.username
                  }));
                } catch (error) {
                  console.error('Auth error:', error);
                  res.statusCode = 401;
                  res.end(JSON.stringify({ error: 'Invalid token' }));
                }
              })();
              return;

            case 'register':
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }
              let regBody = '';
              req.on('data', (chunk) => {
                regBody += chunk.toString();
              });
              req.on('end', async () => {
                try {
                  const { username, password } = JSON.parse(regBody);
                  if (!username || !password) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Username and password are required' }));
                    return;
                  }
                  const existingUser = await db.query.users.findFirst({
                    where: eq(users.username, username)
                  });
                  if (existingUser) {
                    res.statusCode = 409;
                    res.end(JSON.stringify({ error: 'Username already exists' }));
                    return;
                  }
                  const hashedPassword = await bcrypt.hash(password, 10);
                  const inserted = await db.insert(users).values({ username, password: hashedPassword }).returning();
                  const user = inserted[0];
                  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
                  await db.update(users).set({ jwtToken: token }).where(eq(users.id, user.id));
                  res.statusCode = 201;
                  res.end(JSON.stringify({
                    token,
                    user: {
                      id: user.id,
                      username: user.username
                    }
                  }));
                } catch (error) {
                  console.error('Register error:', error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;

            case 'verify':
              if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }
              const verifyToken = req.headers.authorization?.split(' ')[1];
              if (!verifyToken) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'No token provided' }));
                return;
              }
              (async () => {
                try {
                  const decoded = jwt.verify(verifyToken, JWT_SECRET) as { userId: number };
                  const user = await db.query.users.findFirst({
                    where: eq(users.id, decoded.userId)
                  });
                  if (!user || user.jwtToken !== verifyToken) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: 'Invalid token' }));
                    return;
                  }
                  res.statusCode = 200;
                  res.end(JSON.stringify({ user: { id: user.id, username: user.username } }));
                } catch (error) {
                  console.error('Verify error:', error);
                  res.statusCode = 401;
                  res.end(JSON.stringify({ error: 'Invalid token' }));
                }
              })();
              return;

            default:
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Not found' }));
              return;
          }
        }

        // Handle other endpoints
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
      });

      this.server.listen(this.port, () => {
        console.log(`Test server running at ${this.baseUrl}`);
        resolve();
      });
    });
  }

  async stop() {
    return new Promise<void>((resolve, reject) => {
      if (this.server) {
        this.server.close((err: any) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('Test server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async cleanup() {
    try {
      await db.delete(users);
      console.log('Test database cleaned up');
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
    this.testUsers = [];
  }

  async clearAllTables() {
    const schema = await import('../../api-helpers/lib/schema.js');
    // Delete from child tables first due to foreign key constraints
    await db.delete(schema.picks);
    await db.delete(schema.weeks);
    await db.delete(users);
  }

  async createTestUser(user: TestUser): Promise<TestUser> {
    await this.clearAllTables();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.insert(users).values({
      username: user.username,
      password: hashedPassword
    });
    this.testUsers.push(user);
    return user;
  }

  async getAuthToken(user: TestUser): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });
    const data = await response.json() as { token: string };
    return data.token;
  }
} 