import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Clerk token will be injected by interceptor
let clerkGetToken = null;

export const setClerkTokenGetter = (getTokenFn) => {
  clerkGetToken = getTokenFn;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add Clerk token to all requests
api.interceptors.request.use(async (config) => {
  if (clerkGetToken) {
    try {
      const token = await clerkGetToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Clerk token added to request');
      } else {
        console.warn('⚠️ No Clerk token available');
      }
    } catch (error) {
      console.error('❌ Failed to get Clerk token:', error);
    }
  } else {
    console.warn('⚠️ Clerk token getter not set');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Chat API - Production endpoint
export const sendMessage = async (message, sessionId, documents = [], context = null, language = 'en') => {
  try {
    console.log('🌍 API: Sending message with language:', language);
    const response = await api.post('/query', {
      query: message,
      documentIds: documents.map(d => d.id),
      generatePdf: false,
      language: language  // Pass language to backend
    });
    return {
      message: response.data.answer || response.data.message,  // Pure markdown from backend
      sources: response.data.sources,
      confidence: response.data.confidence,
      metadata: response.data.metadata || {}  // NEW: Include metadata for hybrid search info
    };
  } catch (error) {
    console.error('Send message error:', error);
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

// Document API - Production endpoint with R2 storage
export const uploadDocument = async (file, onProgress) => {
  try {
    console.log('📤 Starting upload:', file.name, file.size, 'bytes');
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
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
    console.log('✅ Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Upload error:', error.response?.data || error.message);
    throw error;
  }
};

export const getDocuments = async () => {
  try {
    const response = await api.get('/doc');
    return response.data.documents || [];
  } catch (error) {
    console.error('Get documents error:', error);
    return [];
  }
};

export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/doc/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
};

// User Profile API - Production endpoint
export const getProfile = async (userId) => {
  try {
    const response = await api.get('/me');
    return {
      id: response.data.user.id,
      email: response.data.user.email,
      name: `${response.data.user.firstName || ''} ${response.data.user.lastName || ''}`.trim(),
      avatar: '👤'
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return { id: userId, name: 'User', email: '', avatar: '👤' };
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

export const uploadProfilePicture = async (userId, file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await api.post(`/profile/${userId}/picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
    
    return response.data.imageUrl;
  } catch (error) {
    console.error('Upload profile picture error:', error);
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

export default api;