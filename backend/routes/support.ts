import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { toSupportChat } from '../serialize';

const router = Router();

function loadChat(id: string) {
  const row = db.prepare('SELECT * FROM support_chats WHERE id = ?').get(id) as any;
  if (!row) return null;
  const messages = db.prepare('SELECT * FROM support_messages WHERE chat_id = ? ORDER BY timestamp ASC').all(id);
  return toSupportChat(row, messages);
}

// GET /api/support-chats
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT id FROM support_chats ORDER BY last_message_at DESC').all() as any[];
  res.json(rows.map((r) => loadChat(r.id)).filter(Boolean));
});

// POST /api/support-chats  { userName, userEmail, userRole, id? } -> finds or creates a session
router.post('/', (req, res) => {
  const { userName, userEmail, userRole, id: clientId } = req.body || {};
  const cleanEmail = (userEmail || 'guest@tradeease.ng').trim().toLowerCase();

  const existing = db.prepare('SELECT * FROM support_chats WHERE lower(user_email) = ?').get(cleanEmail) as any;
  if (existing) {
    if (existing.status === 'resolved') {
      db.prepare("UPDATE support_chats SET status = 'active', last_message_at = datetime('now') WHERE id = ?").run(existing.id);
    }
    return res.json(loadChat(existing.id));
  }

  const id = clientId || `chat-${Date.now()}`;
  db.prepare(
    `INSERT INTO support_chats (id, user_name, user_role, user_email, status) VALUES (?, ?, ?, ?, 'active')`
  ).run(id, userName || 'Anonymous Client', userRole || 'buyer', cleanEmail);

  db.prepare(
    `INSERT INTO support_messages (id, chat_id, sender, sender_name, content) VALUES (?, ?, 'admin', 'TradeEase Support', ?)`
  ).run(
    randomUUID(),
    id,
    `Hi ${userName || 'there'}! This is the live TradeEase customer helpdesk managed directly by our administrator backoffice. How can we support your trade operations in Nigeria today?`
  );

  res.status(201).json(loadChat(id));
});

// POST /api/support-chats/:id/messages  { sender, senderName, content }
router.post('/:id/messages', (req, res) => {
  const { sender, senderName, content } = req.body || {};
  if (!sender || !content) return res.status(400).json({ error: 'sender and content are required' });
  const chat = db.prepare('SELECT id FROM support_chats WHERE id = ?').get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  db.prepare(
    `INSERT INTO support_messages (id, chat_id, sender, sender_name, content) VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), req.params.id, sender, senderName || sender, content);
  db.prepare("UPDATE support_chats SET last_message_at = datetime('now') WHERE id = ?").run(req.params.id);

  // Simple automated acknowledgement, mirroring the original prototype's helpdesk bot.
  if (sender === 'user') {
    db.prepare(
      `INSERT INTO support_messages (id, chat_id, sender, sender_name, content) VALUES (?, ?, 'admin', 'Helpdesk Bot', ?)`
    ).run(
      randomUUID(),
      req.params.id,
      'Thank you for your message! Our Regional Support Administrator is inspecting your query in the backoffice and will reply directly in this portal chat shortly.'
    );
    db.prepare("UPDATE support_chats SET last_message_at = datetime('now') WHERE id = ?").run(req.params.id);
  }

  res.status(201).json(loadChat(req.params.id));
});

// PUT /api/support-chats/:id/resolve
router.put('/:id/resolve', (req, res) => {
  const chat = db.prepare('SELECT id FROM support_chats WHERE id = ?').get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  db.prepare("UPDATE support_chats SET status = 'resolved' WHERE id = ?").run(req.params.id);
  res.json(loadChat(req.params.id));
});

export default router;
