import express from 'express';

const router = express.Router();

// In-memory storage for chat history and messages
const chatHistories = new Map();
const chatMessages = new Map(); // Store actual chat messages

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

export default router;