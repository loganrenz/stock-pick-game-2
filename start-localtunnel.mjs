import localtunnel from 'localtunnel';
import { setTimeout } from 'timers/promises';

const PORT = 6969;
const MAX_RETRIES = 5;

async function startTunnel() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const tunnel = await localtunnel({ port: PORT });

      console.log('--------------------------------------------------');
      console.log('✅ localtunnel is ready!');
      console.log(`🔗 Public URL: ${tunnel.url}`);
      console.log('--------------------------------------------------');
      console.log('Use this URL for your Apple Developer Portal and .env file.');

      tunnel.on('close', () => {
        console.log('Tunnel closed. Restarting...');
        startTunnel();
      });

      tunnel.on('error', (err) => {
        console.error('Tunnel error:', err);
      });
      
      return; // Exit the loop on success

    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i < MAX_RETRIES - 1) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await setTimeout(RETRY_DELAY);
      } else {
        console.error('Failed to start localtunnel after all attempts');
        process.exit(1);
      }
    }
  }
}

const RETRY_DELAY = 2000;

startTunnel().catch(console.error); 