import { Client, Users } from 'node-appwrite';
import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hash, ...data } = req.query as Record<string, string>;

  // 1. Verify Telegram Hash
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'Server misconfiguration: No bot token' });
  }

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const dataCheckArr = [];
  for (const key in data) {
    dataCheckArr.push(`${key}=${data[key]}`);
  }
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');
  
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  
  if (hmac !== hash) {
    return res.status(401).json({ error: 'Unauthorized: Invalid hash' });
  }

  // 2. Hash is valid, check timestamp to prevent replay attacks
  const authDate = parseInt(data.auth_date);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) { // 1 day
    return res.status(401).json({ error: 'Unauthorized: Data is too old' });
  }

  // 3. Create Custom Token using Appwrite Admin SDK
  try {
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');

    const users = new Users(client);

    // Using Telegram ID as the unique Appwrite User ID. 
    // We prefix with 'tg_' since Appwrite IDs cannot start with numbers.
    const userId = `tg_${data.id}`;
    
    // We try to fetch the user, if they don't exist we create them.
    try {
      await users.get(userId);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 404) {
        await users.create(userId, undefined, undefined, undefined, data.first_name + (data.last_name ? ` ${data.last_name}` : ''));
      } else {
        throw err;
      }
    }

    const token = await users.createToken(userId);

    // 4. Return the secret to the frontend
    // Send HTML that passes the secret to the parent window
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'telegram_auth', secret: '${token.secret}', userId: '${userId}' }, '*');
          window.close();
        } else {
          window.location.href = '/?secret=${token.secret}&userId=${userId}';
        }
      </script>
    `);
  } catch (error: unknown) {
    console.error('Appwrite error:', error);
    res.status(500).json({ error: 'Failed to create Appwrite token', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
