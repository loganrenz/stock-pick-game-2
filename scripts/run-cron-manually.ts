import { runUpdate } from '../api/crons/update-last-close';

async function main() {
  console.log('--- Manually running cron job: update-last-close ---');
  try {
    await runUpdate();
    console.log('--- Cron job finished ---');
    process.exit(0);
  } catch (error) {
    console.error('--- Cron job failed ---', error);
    process.exit(1);
  }
}

main();
