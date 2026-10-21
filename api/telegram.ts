import { Client, Users } from 'node-appwrite';
import { createHash, createHmac } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'Server misconfiguration: No bot token' });
  }

  // =========================================================================
  // 1. POST: Telegram Bot Webhook Handler (Commands, /start, Inline Buttons)
  // =========================================================================
  if (req.method === 'POST') {
    try {
      const update = req.body;
      if (!update) {
        return res.status(200).json({ ok: true });
      }

      const WEB_APP_URL = 'https://note-craft-pro.vercel.app/';

      // Handle direct messages (/start, /app, /help, text)
      if (update.message) {
        const chatId = update.message.chat?.id;
        const text = (update.message.text || '').trim();
        const firstName = update.message.from?.first_name || 'Creator';

        if (chatId) {
          if (text === '/help') {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `<b>📖 NoteCraft Pro User Guide</b>\n\n` +
                  `• <b>🎨 Studio Canvas:</b> Draw smoothly with Pen, Pencil, Highlighter, Geometric Shapes & Text.\n` +
                  `• <b>📝 Paper Styles:</b> Toggle between Grid, Lined Notebook, Dotted Bullet Journal, or Blank.\n` +
                  `• <b>📖 3D Booklet View:</b> Flip through multi-page notebooks with realistic page-turning.\n` +
                  `• <b>📑 Pro Exports:</b> Download multi-page PDFs and Microsoft Word (.docx) files.\n` +
                  `• <b>💾 Offline Safe:</b> Instant local storage auto-saves everything, even offline.\n\n` +
                  `<i>Tap below to launch NoteCraft Pro directly inside Telegram:</i>`,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '🎨 Launch NoteCraft Pro',
                        web_app: { url: WEB_APP_URL }
                      }
                    ],
                    [
                      { text: '🌐 Open in Browser', url: WEB_APP_URL }
                    ]
                  ]
                }
              })
            });
          } else {
            // Default /start or any message
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `✨ <b>Welcome to NoteCraft Pro, ${firstName}!</b> ✨\n\n` +
                  `Your creative digital notebook and sketchbook, tailored specifically for Telegram.\n\n` +
                  `🎨 <b>Studio Canvas</b> — Sketch with Pen, Pencil & Highlighter\n` +
                  `📖 <b>3D Booklet</b> — Realistic page-flip book reader\n` +
                  `🖼️ <b>Image Studio</b> — Crop, scale & photographic filters\n` +
                  `📑 <b>Pro Exports</b> — Multi-page PDF & MS Word (.docx)\n` +
                  `☁️ <b>Cloud Sync & Local Backup</b> — Never lose your work\n\n` +
                  `<i>Tap the button below to launch NoteCraft Pro right inside Telegram:</i>`,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '🚀 Launch NoteCraft Pro',
                        web_app: { url: WEB_APP_URL }
                      }
                    ],
                    [
                      { text: '📖 Help & Features', callback_data: 'help_info' },
                      { text: '🌐 Web Browser', url: WEB_APP_URL }
                    ]
                  ]
                }
              })
            });
          }
        }
      } else if (update.callback_query) {
        // Handle inline keyboard button callbacks
        const callbackId = update.callback_query.id;
        const chatId = update.callback_query.message?.chat?.id;

        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackId })
        });

        if (update.callback_query.data === 'help_info' && chatId) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `<b>📖 NoteCraft Pro Quick Guide</b>\n\n` +
                `1. <b>Sketch & Draw</b>: Select pencil or pen, pick a color and thickness, and draw smoothly on mobile or desktop.\n` +
                `2. <b>Change Paper Style</b>: Tap the paper icon to select Grid, Lined, Dots, or Blank canvas.\n` +
                `3. <b>Multi-Page Booklets</b>: Add unlimited pages and click <b>Booklet</b> to see your 3D interactive book.\n` +
                `4. <b>Export Anywhere</b>: Download your notes as high-res PDF or editable Word document with drawing snapshots embedded.\n\n` +
                `Ready to create?`,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Open NoteCraft Pro',
                      web_app: { url: WEB_APP_URL }
                    }
                  ]
                ]
              }
            })
          });
        }
      }
    } catch (botErr) {
      console.error('Telegram bot webhook error:', botErr);
    }

    return res.status(200).json({ ok: true });
  }

  // =========================================================================
  // 2. GET: Telegram Login Widget OAuth Callback
  // =========================================================================
  if (req.method === 'GET') {
    const { hash, ...data } = req.query as Record<string, string>;

    const secretKey = createHash('sha256').update(botToken).digest();
    const dataCheckArr: string[] = [];
    for (const key in data) {
      dataCheckArr.push(`${key}=${data[key]}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');
    
    const hmac = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (hmac !== hash) {
      return res.status(401).json({ error: 'Unauthorized: Invalid hash' });
    }

    const authDate = parseInt(data.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) { // 1 day
      return res.status(401).json({ error: 'Unauthorized: Data is too old' });
    }

    try {
      const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
        .setKey(process.env.APPWRITE_API_KEY || '');

      const users = new Users(client);
      const userId = `tg_${data.id}`;
      
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

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
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
      return res.status(500).json({ error: 'Failed to create Appwrite token', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
