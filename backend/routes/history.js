import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// File paths for persistent storage
const CHAT_HISTORIES_FILE = './chat-histories.json';
const CHAT_MESSAGES_FILE = './chat-messages.json';

// In-memory cache for performance
let chatHistories = new Map();
let chatMessages = new Map();

// Load data from files on startup
const loadChatData = async () => {
  try {
    // Load chat histories
    try {
      const historiesData = await fs.readFile(CHAT_HISTORIES_FILE, 'utf-8');
      const historiesObj = JSON.parse(historiesData);
      chatHistories = new Map(Object.entries(historiesObj));
      console.log(`📚 Loaded ${chatHistories.size} chat histories`);
    } catch (error) {
      console.log('📚 Starting fresh');
      chatHistories = new Map();
    }
    
    // Load chat messages
    try {
      const messagesData = await fs.readFile(CHAT_MESSAGES_FILE, 'utf-8');
      const messagesObj = JSON.parse(messagesData);
      chatMessages = new Map(Object.entries(messagesObj));
      console.log(`💬 Loaded ${chatMessages.size} sessions`);
    } catch (error) {
      console.log('💬 Starting fresh');
      chatMessages = new Map();
    }
  } catch (error) {
    console.error('Failed to load chat data:', error);
  }
};

// Save data to files with debouncing
let saveTimeout = null;
const saveChatData = async (immediate = false) => {
  if (!immediate && saveTimeout) {
    return; // Already scheduled
  }
  
  if (!immediate) {
    // Debounce saves - wait 2 seconds before saving
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveChatData(true);
      saveTimeout = null;
    }, 2000);
    return;
  }
  
  try {
    // Save chat histories
    const historiesObj = Object.fromEntries(chatHistories);
    await fs.writeFile(CHAT_HISTORIES_FILE, JSON.stringify(historiesObj, null, 2));
    
    // Save chat messages
    const messagesObj = Object.fromEntries(chatMessages);
    await fs.writeFile(CHAT_MESSAGES_FILE, JSON.stringify(messagesObj, null, 2));
    
    console.log('💾 Chat data saved');
  } catch (error) {
    console.error('Failed to save chat data:', error);
  }
};

// Initialize data on startup
loadChatData();

// Auto-save every 30 seconds (immediate)
setInterval(() => saveChatData(true), 30000);

// Get recent chats for a user
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const userChats = chatHistories.get(userId) || [];
    const recentChats = userChats.slice(0, parseInt(limit));
    
    res.json({ chats: recentChats });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Save chat session
router.post('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId, title, messages } = req.body;
    
    let userChats = chatHistories.get(userId) || [];
    
    const existingIndex = userChats.findIndex(chat => chat.sessionId === sessionId);
    
    const chatData = {
      id: sessionId,
      sessionId,
      title: title || 'Untitled Chat',
      time: getRelativeTime(new Date()),
      messages: messages.length,
      lastMessage: messages[messages.length - 1]?.text || '',
      color: getRandomColor()
    };
    
    if (existingIndex >= 0) {
      userChats[existingIndex] = chatData;
    } else {
      userChats.unshift(chatData);
    }
    
    // Keep only last 50 chats
    userChats = userChats.slice(0, 50);
    
    chatHistories.set(userId, userChats);
    
    // Store actual messages
    chatMessages.set(sessionId, messages);
    
    // Schedule save (debounced)
    saveChatData();
    
    res.json({ message: 'Chat saved', chat: chatData });
  } catch (error) {
    console.error('Save chat error:', error);
    res.status(500).json({ error: 'Failed to save chat' });
  }
});

// Get chat messages for a session
router.get('/:userId/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = chatMessages.get(sessionId) || [];
    res.json({ messages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Failed to get chat messages' });
  }
});

// Delete chat session
router.delete('/:userId/:sessionId', (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    
    // Remove from chat histories
    let userChats = chatHistories.get(userId) || [];
    userChats = userChats.filter(chat => chat.sessionId !== sessionId);
    chatHistories.set(userId, userChats);
    
    // Remove messages
    chatMessages.delete(sessionId);
    
    // Schedule save (debounced)
    saveChatData();
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Rename chat session
router.put('/:userId/:sessionId', (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { title } = req.body;
    
    let userChats = chatHistories.get(userId) || [];
    const chatIndex = userChats.findIndex(chat => chat.sessionId === sessionId);
    
    if (chatIndex >= 0) {
      userChats[chatIndex].title = title;
      chatHistories.set(userId, userChats);
      
      // Schedule save (debounced)
      saveChatData();
      
      res.json({ message: 'Chat renamed successfully', chat: userChats[chatIndex] });
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  } catch (error) {
    console.error('Rename chat error:', error);
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

// Graceful shutdown - save data before exit
process.on('SIGINT', async () => {
  console.log('\n🔄 Saving chat data before shutdown...');
  await saveChatData(true);
  console.log('✅ Chat data saved. Shutting down gracefully.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Saving chat data before shutdown...');
  await saveChatData(true);
  console.log('✅ Chat data saved. Shutting down gracefully.');
  process.exit(0);
});

export default router;