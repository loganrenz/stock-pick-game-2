import { db } from '../../api/lib/db.js';
import { users } from '../../api/lib/schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

export interface TestUser {
  username: string;
  password: string;
  id?: number;
}

export class TestServer {
  private testUsers: TestUser[] = [];

  async createTestUser(user: TestUser): Promise<TestUser> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      username: user.username,
      password: hashedPassword
    }).returning();

    const createdUser = { ...user, id: result[0].id };
    this.testUsers.push(createdUser);
    return createdUser;
  }

  async cleanup() {
    // Clean up all test users
    for (const user of this.testUsers) {
      await db.delete(users).where(eq(users.username, user.username));
    }
    this.testUsers = [];
  }

  async getAuthToken(user: TestUser): Promise<string> {
    const response = await fetch('http://localhost:3004/api/auth/login', {
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

    const data = await response.json();
    return data.token;
  }
} 