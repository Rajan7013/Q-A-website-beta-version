import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Chat API
export const sendMessage = async (message, sessionId, documents = [], context = null, language = 'en', userApiKey = null, userId = null) => {
  try {
    // Input validation
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid session ID');
    }
    
    const response = await api.post('/chat/message', {
      message: message.trim(),
      sessionId,
      documents,
      context,
      language,
      userApiKey,
      userId
    });
    return response.data;
  } catch (error) {
    console.error('Send message error:', error.message);
    throw error;
  }
};

export const clearChat = async (sessionId) => {
  try {
    const response = await api.post('/chat/clear', { sessionId });
    return response.data;
  } catch (error) {
    console.error('Clear chat error:', error);
    throw error;
  }
};

// Document API
export const uploadDocument = async (file, onProgress, userId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (userId) {
      formData.append('userId', userId);
    }

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const getDocuments = async (userId) => {
  try {
    const url = userId ? `/documents/list?userId=${encodeURIComponent(userId)}` : '/documents/list';
    const response = await api.get(url);
    return response.data.documents || [];
  } catch (error) {
    console.error('Get documents error:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
};

// Profile API - NOW REAL!
export const getProfile = async (userId) => {
  try {
    const response = await api.get(`/profile/${userId}`);
    return response.data.profile;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

export const updateProfile = async (userId, profileData) => {
  try {
    const response = await api.put(`/profile/${userId}`, profileData);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Settings API - NOW REAL!
export const getSettings = async (userId) => {
  try {
    const response = await api.get(`/profile/${userId}/settings`);
    return response.data.settings;
  } catch (error) {
    console.error('Get settings error:', error);
    throw error;
  }
};

export const updateSettings = async (userId, settings) => {
  try {
    const response = await api.put(`/profile/${userId}/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Update settings error:', error);
    throw error;
  }
};

// Stats API - NOW REAL!
export const getStats = async (userId) => {
  try {
    const response = await api.get(`/stats/${userId}`);
    return response.data.stats;
  } catch (error) {
    console.error('Get stats error:', error);
    throw error;
  }
};

export const incrementStat = async (userId, field, value = 1) => {
  try {
    const response = await api.post(`/stats/${userId}/increment`, { field, value });
    return response.data.stats;
  } catch (error) {
    console.error('Increment stats error:', error);
    throw error;
  }
};

// Activity API - NOW REAL!
export const getActivity = async (userId) => {
  try {
    const response = await api.get(`/stats/${userId}/activity`);
    return response.data.activity;
  } catch (error) {
    console.error('Get activity error:', error);
    throw error;
  }
};

export const logActivity = async (userId, day, value) => {
  try {
    const response = await api.post(`/stats/${userId}/activity`, { day, value });
    return response.data.activity;
  } catch (error) {
    console.error('Log activity error:', error);
    throw error;
  }
};

// Achievements API - NOW REAL!
export const getAchievements = async (userId) => {
  try {
    const response = await api.get(`/stats/${userId}/achievements`);
    return response.data.achievements;
  } catch (error) {
    console.error('Get achievements error:', error);
    throw error;
  }
};

export const unlockAchievement = async (userId, achievementId) => {
  try {
    const response = await api.post(`/stats/${userId}/achievements/${achievementId}`);
    return response.data.achievements;
  } catch (error) {
    console.error('Unlock achievement error:', error);
    throw error;
  }
};

// Chat History API - NOW REAL!
export const getRecentChats = async (userId, limit = 10) => {
  try {
    const response = await api.get(`/history/${userId}?limit=${limit}`);
    return response.data.chats;
  } catch (error) {
    console.error('Get recent chats error:', error);
    throw error;
  }
};

export const saveChatSession = async (userId, sessionId, title, messages) => {
  try {
    const response = await api.post(`/history/${userId}`, { sessionId, title, messages });
    return response.data;
  } catch (error) {
    console.error('Save chat session error:', error);
    throw error;
  }
};

// Get chat messages for a session
export const getChatMessages = async (userId, sessionId) => {
  try {
    const response = await api.get(`/history/${userId}/${sessionId}`);
    return response.data.messages;
  } catch (error) {
    console.error('Get chat messages error:', error);
    throw error;
  }
};

// Delete chat session
export const deleteChatSession = async (userId, sessionId) => {
  try {
    const response = await api.delete(`/history/${userId}/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Delete chat session error:', error);
    throw error;
  }
};

// Rename chat session
export const renameChatSession = async (userId, sessionId, title) => {
  try {
    const response = await api.put(`/history/${userId}/${sessionId}`, { title });
    return response.data;
  } catch (error) {
    console.error('Rename chat session error:', error);
    throw error;
  }
};

// Validate Gemini API Key
export const validateGeminiKey = async (apiKey) => {
  try {
    // Input validation
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
      throw new Error('Invalid API key format');
    }
    
    const response = await api.post('/chat/validate-key', { apiKey: apiKey.trim() });
    return response.data;
  } catch (error) {
    console.error('Validate Gemini key error:', error.message);
    throw error;
  }
};

export default api;