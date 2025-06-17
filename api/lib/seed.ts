import { db } from './db.js';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

async function main() {
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
  ];

  console.log('Creating test users...');
  
  for (const user of testUsers) {
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

// Run the seed function
main().catch(console.error); 