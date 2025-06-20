import { db } from './lib/db.js';
import { weeks, users } from './lib/schema.js';
import { eq, isNotNull } from 'drizzle-orm';

export async function getScoreboard() {
  try {
    const weeksWithWinners = await db.query.weeks.findMany({
      where: isNotNull(weeks.winnerId),
      with: {
        winner: true,
      },
    });

    const allUsers = await db.query.users.findMany();

    const scoreboard = allUsers.map((user) => {
      const wins = weeksWithWinners.filter((week) => week.winnerId === user.id).length;
      return {
        username: user.username,
        wins,
      };
    });

    scoreboard.sort((a, b) => b.wins - a.wins);

    return scoreboard;
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    return [];
  }
}
