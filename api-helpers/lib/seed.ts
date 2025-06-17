import { db } from './db.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

export async function main() {
  // Create test users
  const testUsers = [
    {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
    },
    {
      username: 'patrick',
      password: await bcrypt.hash('patrickpw', 10),
    },
    {
      username: 'taylor',
      password: await bcrypt.hash('taylorpw', 10),
    },
    {
      username: 'logan',
      password: await bcrypt.hash('loganpw', 10),
    },
    {
      username: 'testuser',
      password: await bcrypt.hash('testuserpw', 10),
    }
  ];

  console.log('Creating test users...');
  
  for (const user of testUsers) {
    console.log('Seeding user:', user.username, 'with hashed password:', user.password);
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, user.username)
    });

    if (!existingUser) {
      const [newUser] = await db.insert(users)
        .values(user)
        .returning();
      console.log('Created user:', newUser.username);
    } else {
      console.log('User already exists:', existingUser.username);
    }
  }
}

// Only run if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} 