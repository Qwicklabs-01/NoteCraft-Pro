import { Client, Users, Databases, Query, ID } from 'node-appwrite';
import { createHash, createHmac } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jsPDF } from 'jspdf';

interface ChatNote {
  id: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'photo';
  caption?: string;
}

interface ChatNotebook {
  id: string;
  title: string;
  notes: ChatNote[];
  isActive?: boolean;
}

// In-memory fallback / cache across warm serverless invocations
const globalNotebooks = new Map<number, ChatNotebook[]>();

const DEFAULT_REPLY_KEYBOARD = {
  keyboard: [
    [{ text: '📝 New Note' }, { text: '📚 My Notebooks' }],
    [{ text: '📖 Read Notes' }, { text: '📄 Export PDF' }],
    [{ text: 'ℹ️ Help' }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

async function getNotebooksForUser(chatId: number): Promise<ChatNotebook[]> {
  if (globalNotebooks.has(chatId)) {
    const list = globalNotebooks.get(chatId)!;
    if (list.length > 0) return list;
  }

  // Try fetching from Appwrite Database if configured
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.VITE_APPWRITE_NOTEBOOKS_COLLECTION_ID;
  if (databaseId && collectionId && process.env.APPWRITE_API_KEY) {
    try {
      const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
        .setKey(process.env.APPWRITE_API_KEY || '');
      const databases = new Databases(client);

      const res = await databases.listDocuments(databaseId, collectionId, [
        Query.equal('userId', `tg_${chatId}`),
        Query.orderDesc('lastEdited')
      ]);

      if (res.documents.length > 0) {
        const loaded: ChatNotebook[] = res.documents.map((doc, idx) => {
          let notes: ChatNote[] = [];
          if (doc.content) {
            try {
              const parsed = JSON.parse(doc.content);
              if (Array.isArray(parsed.chatNotes)) {
                notes = parsed.chatNotes;
              }
            } catch {
              notes = [];
            }
          }
          return {
            id: doc.$id,
            title: doc.title || 'My Notes',
            notes,
            isActive: idx === 0
          };
        });

        globalNotebooks.set(chatId, loaded);
        return loaded;
      }
    } catch {
      // Appwrite offline or paused, fallback to local memory
    }
  }

  // Default initial notebook
  const defaultList: ChatNotebook[] = [
    {
      id: 'default',
      title: 'Quick Notes',
      notes: [],
      isActive: true
    }
  ];
  globalNotebooks.set(chatId, defaultList);
  return defaultList;
}

async function saveNotebooksForUser(chatId: number, notebooks: ChatNotebook[]): Promise<void> {
  globalNotebooks.set(chatId, notebooks);

  // Sync active notebook to Appwrite Database if accessible
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.VITE_APPWRITE_NOTEBOOKS_COLLECTION_ID;
  if (databaseId && collectionId && process.env.APPWRITE_API_KEY) {
    try {
      const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
        .setKey(process.env.APPWRITE_API_KEY || '');
      const databases = new Databases(client);

      const active = notebooks.find(n => n.isActive) || notebooks[0];
      if (active) {
        const contentStr = JSON.stringify({ chatNotes: active.notes, paperStyle: 'lined' });
        if (active.id && active.id !== 'default') {
          await databases.updateDocument(databaseId, collectionId, active.id, {
            title: active.title,
            content: contentStr,
            lastEdited: new Date().toISOString()
          });
        } else {
          const created = await databases.createDocument(databaseId, collectionId, ID.unique(), {
            userId: `tg_${chatId}`,
            title: active.title,
            content: contentStr,
            lastEdited: new Date().toISOString()
          });
          active.id = created.$id;
        }
      }
    } catch {
      // Ignore background sync errors
    }
  }
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string, replyMarkup?: unknown) {
  return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      parse_mode: 'HTML',
      text,
      reply_markup: replyMarkup || DEFAULT_REPLY_KEYBOARD
    })
  }).then(r => r.json());
}

async function sendNotebookPDF(botToken: string, chatId: number, notebook: ChatNotebook) {
  const doc = new jsPDF();
  
  // Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('NoteCraft Pro', 20, 22);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(`Notebook: ${notebook.title}`, 20, 32);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Exported on ${new Date().toLocaleString()} • ${notebook.notes.length} notes`, 20, 39);

  doc.setDrawColor(226, 232, 240);
  doc.line(20, 43, 190, 43);

  let y = 52;
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);

  if (notebook.notes.length === 0) {
    doc.text('This notebook is currently empty.', 20, y);
  } else {
    notebook.notes.forEach((note, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('Helvetica', 'bold');
      doc.text(`${index + 1}.`, 20, y);
      doc.setFont('Helvetica', 'normal');
      const lines = doc.splitTextToSize(note.text, 160);
      doc.text(lines, 27, y);
      y += lines.length * 6 + 2;

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      const timeStr = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      doc.text(`— Added at ${timeStr}`, 27, y);
      y += 8;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
    });
  }

  const arrayBuffer = doc.output('arraybuffer');
  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const filename = `${notebook.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_notes.pdf`;
  formData.append('document', blob, filename);
  formData.append('caption', `📄 Here is your exported notebook: "${notebook.title}" (${notebook.notes.length} notes)`);

  return fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: formData
  }).then(r => r.json());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'Server misconfiguration: No bot token' });
  }

  // =========================================================================
  // 1. POST: Telegram Bot Conversational In-Chat Webhook
  // =========================================================================
  if (req.method === 'POST') {
    try {
      const update = req.body;
      if (!update) return res.status(200).json({ ok: true });

      // A. INLINE CALLBACK QUERIES
      if (update.callback_query) {
        const callbackId = update.callback_query.id;
        const chatId = update.callback_query.message?.chat?.id;
        const data = update.callback_query.data as string;

        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackId })
        });

        if (chatId) {
          const notebooks = await getNotebooksForUser(chatId);
          const active = notebooks.find(n => n.isActive) || notebooks[0];

          if (data.startsWith('switch_nb:')) {
            const targetId = data.replace('switch_nb:', '');
            notebooks.forEach(n => { n.isActive = (n.id === targetId); });
            await saveNotebooksForUser(chatId, notebooks);
            const current = notebooks.find(n => n.isActive) || notebooks[0];
            await sendTelegramMessage(botToken, chatId, `Switched active notebook to: <b>"${current.title}"</b> (${current.notes.length} notes)!\n\nSend any text message to add notes.`);
          } else if (data === 'read_notes') {
            await formatAndSendNotes(botToken, chatId, active);
          } else if (data === 'export_pdf') {
            await sendNotebookPDF(botToken, chatId, active);
          } else if (data === 'clear_confirm') {
            active.notes = [];
            await saveNotebooksForUser(chatId, notebooks);
            await sendTelegramMessage(botToken, chatId, `🗑️ Notes cleared in <b>"${active.title}"</b>.`);
          } else if (data === 'clear_cancel') {
            await sendTelegramMessage(botToken, chatId, 'Action cancelled.');
          }
        }
        return res.status(200).json({ ok: true });
      }

      // B. DIRECT MESSAGES
      if (update.message) {
        const chatId = update.message.chat?.id;
        const text = (update.message.text || '').trim();
        const firstName = update.message.from?.first_name || 'Friend';

        if (chatId) {
          const notebooks = await getNotebooksForUser(chatId);
          const active = notebooks.find(n => n.isActive) || notebooks[0];

          // 1. /start command
          if (text === '/start') {
            await sendTelegramMessage(
              botToken,
              chatId,
              `✨ <b>Welcome to NoteCraft Pro, ${firstName}!</b> ✨\n\n` +
              `You can now use NoteCraft <b>directly inside this chat</b> — no need to launch any app!\n\n` +
              `📝 <b>How to use:</b>\n` +
              `• <b>Send any message:</b> Instantly saved to <b>"${active.title}"</b>\n` +
              `• <b>Send photos:</b> Saved as image notes\n` +
              `• <b>/notes:</b> View & switch between notebooks\n` +
              `• <b>/new &lt;title&gt;:</b> Create a new notebook\n` +
              `• <b>/read:</b> View notes in your active notebook\n` +
              `• <b>/export:</b> Download your notebook as a PDF file\n` +
              `• <b>/clear:</b> Clear notes in active notebook\n\n` +
              `<i>Tap the menu buttons below to start:</i>`,
              DEFAULT_REPLY_KEYBOARD
            );
            return res.status(200).json({ ok: true });
          }

          // 2. /help or "ℹ️ Help"
          if (text === '/help' || text === 'ℹ️ Help') {
            await sendTelegramMessage(
              botToken,
              chatId,
              `<b>📖 NoteCraft In-Chat Guide</b>\n\n` +
              `• <b>Write a Note:</b> Simply type anything and send it here. It will be added to your current notebook.\n` +
              `• <b>Active Notebook:</b> Currently <b>"${active.title}"</b> (${active.notes.length} notes).\n` +
              `• <b>Create Notebook:</b> Send <code>/new Travel Plans</code> or <code>/new Work</code>.\n` +
              `• <b>Export PDF:</b> Tap <b>📄 Export PDF</b> or send <code>/export</code> to receive your formatted PDF document.\n` +
              `• <b>Read Notes:</b> Tap <b>📖 Read Notes</b> or send <code>/read</code>.\n\n` +
              `<i>Everything is stored safely inside NoteCraft!</i>`,
              DEFAULT_REPLY_KEYBOARD
            );
            return res.status(200).json({ ok: true });
          }

          // 3. "📝 New Note"
          if (text === '📝 New Note') {
            await sendTelegramMessage(
              botToken,
              chatId,
              `✍️ <b>Ready for your note!</b>\n\nType your note below and send it. It will be added directly to <b>"${active.title}"</b>.\n\n<i>Tip: To create a new notebook, type <code>/new &lt;Notebook Name&gt;</code></i>`
            );
            return res.status(200).json({ ok: true });
          }

          // 4. "📚 My Notebooks" or "/notes"
          if (text === '📚 My Notebooks' || text === '/notes' || text === '/list') {
            const inlineButtons = notebooks.map(nb => [
              {
                text: `${nb.isActive ? '⭐ ' : ''}📂 ${nb.title} (${nb.notes.length} notes)`,
                callback_data: `switch_nb:${nb.id}`
              }
            ]);

            await sendTelegramMessage(
              botToken,
              chatId,
              `📚 <b>Your Notebooks:</b>\n\n` +
              notebooks.map((nb, i) => `${i + 1}. <b>${nb.title}</b> — ${nb.notes.length} notes ${nb.isActive ? '<i>[ACTIVE]</i>' : ''}`).join('\n') +
              `\n\n<i>Tap a notebook below to switch to it, or type <code>/new &lt;title&gt;</code> to make a new one:</i>`,
              { inline_keyboard: inlineButtons }
            );
            return res.status(200).json({ ok: true });
          }

          // 5. "📖 Read Notes" or "/read"
          if (text === '📖 Read Notes' || text === '/read') {
            await formatAndSendNotes(botToken, chatId, active);
            return res.status(200).json({ ok: true });
          }

          // 6. "📄 Export PDF" or "/export"
          if (text === '📄 Export PDF' || text === '/export') {
            await sendTelegramMessage(botToken, chatId, `⏳ Generating PDF for <b>"${active.title}"</b>...`);
            await sendNotebookPDF(botToken, chatId, active);
            return res.status(200).json({ ok: true });
          }

          // 7. /new <title> command
          if (text.startsWith('/new')) {
            const title = text.replace(/^\/new\s*/, '').trim() || 'Untitled Notebook';
            const newNb: ChatNotebook = {
              id: 'nb_' + Date.now(),
              title,
              notes: [],
              isActive: true
            };
            notebooks.forEach(n => { n.isActive = false; });
            notebooks.push(newNb);
            await saveNotebooksForUser(chatId, notebooks);
            await sendTelegramMessage(
              botToken,
              chatId,
              `✨ Created new notebook: <b>"${title}"</b>!\nIt is now your active notebook. Send any message to add notes to it.`
            );
            return res.status(200).json({ ok: true });
          }

          // 8. /clear command
          if (text === '/clear') {
            await sendTelegramMessage(
              botToken,
              chatId,
              `⚠️ Are you sure you want to clear all ${active.notes.length} notes in <b>"${active.title}"</b>?`,
              {
                inline_keyboard: [
                  [
                    { text: '✅ Yes, Clear', callback_data: 'clear_confirm' },
                    { text: '❌ Cancel', callback_data: 'clear_cancel' }
                  ]
                ]
              }
            );
            return res.status(200).json({ ok: true });
          }

          // 9. Photo message
          if (update.message.photo) {
            const caption = update.message.caption ? ` (${update.message.caption})` : '';
            const newNote: ChatNote = {
              id: 'note_' + Date.now(),
              text: `[Photo Note]${caption}`,
              timestamp: new Date().toISOString(),
              type: 'photo'
            };
            active.notes.push(newNote);
            await saveNotebooksForUser(chatId, notebooks);

            await sendTelegramMessage(
              botToken,
              chatId,
              `📸 <b>Photo note saved to "${active.title}"</b> (#${active.notes.length})\n\n` +
              `<i>Tap 📖 Read Notes to review or 📄 Export PDF to download.</i>`,
              {
                inline_keyboard: [
                  [
                    { text: '📖 Read Notes', callback_data: 'read_notes' },
                    { text: '📄 Export PDF', callback_data: 'export_pdf' }
                  ]
                ]
              }
            );
            return res.status(200).json({ ok: true });
          }

          // 10. Default: Any normal text message is saved as a note!
          if (text.length > 0) {
            const newNote: ChatNote = {
              id: 'note_' + Date.now(),
              text,
              timestamp: new Date().toISOString(),
              type: 'text'
            };
            active.notes.push(newNote);
            await saveNotebooksForUser(chatId, notebooks);

            await sendTelegramMessage(
              botToken,
              chatId,
              `✅ <b>Note saved to "${active.title}"</b> (#${active.notes.length})\n\n` +
              `<blockquote>${escapeHtml(text)}</blockquote>\n` +
              `<i>Tap below to read or export:</i>`,
              {
                inline_keyboard: [
                  [
                    { text: '📖 Read Notes', callback_data: 'read_notes' },
                    { text: '📄 Export PDF', callback_data: 'export_pdf' }
                  ]
                ]
              }
            );
            return res.status(200).json({ ok: true });
          }
        }
      }
    } catch (botErr) {
      console.error('Telegram bot webhook error:', botErr);
    }
    return res.status(200).json({ ok: true });
  }

  // =========================================================================
  // 2. GET: Telegram Login Widget OAuth Callback (for web integration)
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
    if (now - authDate > 86400) {
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

async function formatAndSendNotes(botToken: string, chatId: number, notebook: ChatNotebook) {
  if (notebook.notes.length === 0) {
    return sendTelegramMessage(
      botToken,
      chatId,
      `📖 <b>"${notebook.title}"</b> is empty.\n\nSend any message to add your first note!`,
      DEFAULT_REPLY_KEYBOARD
    );
  }

  let text = `📖 <b>${notebook.title}</b> (${notebook.notes.length} ${notebook.notes.length === 1 ? 'note' : 'notes'}):\n`;
  text += `──────────────────\n`;

  notebook.notes.forEach((note, idx) => {
    const time = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    text += `<b>${idx + 1}.</b> ${escapeHtml(note.text)}\n<i>📅 ${time}</i>\n\n`;
  });
  text += `──────────────────`;

  return sendTelegramMessage(
    botToken,
    chatId,
    text,
    {
      inline_keyboard: [
        [
          { text: '📄 Export PDF', callback_data: 'export_pdf' },
          { text: '🗑️ Clear Notes', callback_data: 'clear_confirm' }
        ]
      ]
    }
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
