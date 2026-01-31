import express from 'express';
import { logger } from '../utils/logger.js';
import { chatMemory } from '../services/chatMemory.js';

const router = express.Router();

// Get recent chats (summary only)
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Use shared memory
    const userChats = chatMemory.get(userId);
    const summaries = userChats.map(chat => ({
      ...chat,
      messages: chat.messages ? chat.messages.length : 0
    })).slice(0, parseInt(limit));

    res.json({ chats: summaries });
  } catch (error) {
    logger.error('Get chat history error', { error: error.message });
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Get specific chat session (full details)
router.get('/:userId/:sessionId', (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    // Use shared memory
    const chat = chatMemory.getSession(userId, sessionId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    logger.error('Get chat session error', { error: error.message });
    res.status(500).json({ error: 'Failed to get chat session' });
  }
});

// Save chat session
router.post('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId, title, messages } = req.body;

    const existing = chatMemory.getSession(userId, sessionId);

    const chatData = {
      id: sessionId,
      sessionId,
      title: title || (existing ? existing.title : 'Untitled Chat'),
      time: getRelativeTime(new Date()),
      messages: messages, // Full messages stored in shared memory
      lastMessage: messages[messages.length - 1]?.text || '',
      color: existing ? existing.color : getRandomColor()
    };

    // Save to shared memory
    const savedChat = chatMemory.saveSession(userId, chatData);

    logger.info('Chat saved', { userId, sessionId, messageCount: messages.length });

    res.json({ message: 'Chat saved', chat: { ...savedChat, messages: messages.length } });
  } catch (error) {
    logger.error('Save chat error', { error: error.message });
    res.status(500).json({ error: 'Failed to save chat' });
  }
});

// Delete chat session
router.delete('/:userId/:sessionId', (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    // Delete from shared memory
    const deleted = chatMemory.deleteSession(userId, sessionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    logger.info('Chat deleted', { userId, sessionId });
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    logger.error('Delete chat error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Rename chat session
router.put('/:userId/:sessionId', (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const chat = chatMemory.getSession(userId, sessionId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.title = title;
    chatMemory.saveSession(userId, chat);

    logger.info('Chat renamed', { userId, sessionId, newTitle: title });

    res.json({ message: 'Chat renamed', chat: { ...chat, messages: chat.messages ? chat.messages.length : 0 } });
  } catch (error) {
    logger.error('Rename chat error', { error: error.message });
    res.status(500).json({ error: 'Failed to rename chat' });
  }
});

function getRandomColor() {
  const colors = [
    'from-blue-400 to-cyan-500',
    'from-green-400 to-emerald-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-red-500',
    'from-yellow-400 to-orange-500',
    'from-indigo-400 to-purple-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default router;
