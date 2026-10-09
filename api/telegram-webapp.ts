import { Client, Users } from 'node-appwrite';
import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { initData } = req.body;

  if (!initData) {
    return res.status(400).json({ error: 'Missing initData' });
  }

  try {
    // 1. Parse the initData string
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Sort keys alphabetically
    const keys = Array.from(urlParams.keys()).sort();
    const dataCheckArr = keys.map(key => `${key}=${urlParams.get(key)}`);
    const dataCheckString = dataCheckArr.join('\n');

    // 2. Verify Telegram Hash
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('Server misconfiguration: No bot token');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // WebApp verification uses 'WebAppData' as the key prefix
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (hmac !== hash) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Telegram hash' });
    }

    // 3. Extract user data
    const userString = urlParams.get('user');
    if (!userString) {
      return res.status(400).json({ error: 'No user data found in initData' });
    }
    const userData = JSON.parse(userString);
    const tgId = userData.id;

    // 4. Connect to Appwrite
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');

    const users = new Users(client);
    const userId = `tg_${tgId}`;
    
    // 5. Create or Get User
    try {
      await users.get(userId);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 404) {
        await users.create(
          userId, 
          undefined, 
          undefined, 
          undefined, 
          userData.first_name + (userData.last_name ? ` ${userData.last_name}` : '')
        );
      } else {
        throw err;
      }
    }

    // 6. Generate Custom Token
    const token = await users.createToken(userId);

    // 7. Return the token secret to the frontend
    return res.status(200).json({ 
      success: true, 
      userId: userId,
      secret: token.secret 
    });

  } catch (error: unknown) {
    console.error('WebApp Authentication error:', error);
    return res.status(500).json({ 
      error: 'Failed to authenticate WebApp user', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
