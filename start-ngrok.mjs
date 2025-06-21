import { exec } from 'child_process';
import { setTimeout } from 'timers/promises';

const NGROK_API_URL = 'http://127.0.0.1:4040/api/tunnels';
const RETRY_DELAY = 500;
const MAX_RETRIES = 10;

// Start ngrok in the background
const ngrokProcess = exec('ngrok http 6969 --log=stdout');

ngrokProcess.stdout.on('data', (data) => {
  // We can pipe ngrok's logs if needed, but for now, we'll keep it clean.
  // console.log(`[ngrok]: ${data.toString().trim()}`);
});

ngrokProcess.stderr.on('data', (data) => {
  console.error(`[ngrok-error]: ${data}`);
});

async function getNgrokUrl() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await setTimeout(RETRY_DELAY);
      const response = await fetch(NGROK_API_URL);
      if (!response.ok) {
        throw new Error(`Ngrok API not ready, status: ${response.status}`);
      }
      const data = await response.json();
      const httpsTunnel = data.tunnels.find(t => t.proto === 'https');
      
      if (httpsTunnel && httpsTunnel.public_url) {
        return httpsTunnel.public_url;
      }

    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        console.error('❌ Could not get ngrok URL after multiple retries.', error);
        process.exit(1);
      }
    }
  }
}

getNgrokUrl().then(url => {
  if (url) {
    console.log('--------------------------------------------------');
    console.log('✅ ngrok tunnel is ready!');
    console.log(`🔗 Public URL: ${url}`);
    console.log('--------------------------------------------------');
    console.log('Use this URL for your Apple Developer Portal and .env file.');
  }
}); 