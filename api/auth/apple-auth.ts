import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Types
interface AppleAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
}

interface AppleIdToken {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  c_hash: string;
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  auth_time: number;
  nonce_supported: boolean;
}

// Constants
const APPLE_AUTH_URL = 'https://appleid.apple.com/auth/token';
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';

// Generate client secret (JWT)
function generateClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  
  const claims = {
    iss: process.env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 15777000, // 6 months
    aud: 'https://appleid.apple.com',
    sub: process.env.APPLE_CLIENT_ID,
  };

  return jwt.sign(claims, process.env.APPLE_PRIVATE_KEY!, {
    algorithm: 'ES256',
    keyid: process.env.APPLE_KEY_ID,
  });
}

// Verify Apple's ID token
async function verifyIdToken(idToken: string): Promise<AppleIdToken> {
  try {
    // Get Apple's public keys
    const { data: keys } = await axios.get(APPLE_KEYS_URL);
    
    // Decode the token header to get the key ID
    const decodedHeader = jwt.decode(idToken, { complete: true })?.header;
    if (!decodedHeader?.kid) {
      throw new Error('Invalid token header');
    }

    // Find the matching public key
    const key = keys.keys.find((k: any) => k.kid === decodedHeader.kid);
    if (!key) {
      throw new Error('No matching key found');
    }

    // Verify the token
    const verified = jwt.verify(idToken, key.n, {
      algorithms: ['RS256'],
      audience: process.env.APPLE_CLIENT_ID,
      issuer: 'https://appleid.apple.com',
    }) as AppleIdToken;

    return verified;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, id_token } = req.body;

    if (!code || !id_token) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate client secret
    const clientSecret = generateClientSecret();

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post<AppleAuthResponse>(
      APPLE_AUTH_URL,
      {
        client_id: process.env.APPLE_CLIENT_ID,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.APPLE_REDIRECT_URI,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Verify the ID token
    const verifiedToken = await verifyIdToken(id_token);

    // Return user info
    return res.status(200).json({
      sub: verifiedToken.sub,
      email: verifiedToken.email,
      email_verified: verifiedToken.email_verified === 'true',
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
} 