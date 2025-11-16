import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ChatPage from './components/ChatPage';
import UploadPage from './components/UploadPage';
import DocumentsPage from './components/DocumentsPage';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { getDocuments, getProfile, getStats, incrementStat, unlockAchievement, getRecentChats, saveChatSession, deleteChatSession, renameChatSession } from './utils/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userId] = useState(() => {
    // Get or create persistent user ID with better uniqueness
    let storedUserId = localStorage.getItem('ai-doc-analyzer-user-id');
    if (!storedUserId) {
      // Create a more unique user ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const browserFingerprint = navigator.userAgent.length + screen.width + screen.height;
      storedUserId = `user-${timestamp}-${random}-${browserFingerprint}`;
      localStorage.setItem('ai-doc-analyzer-user-id', storedUserId);
      console.log('🆆 Created new user ID:', storedUserId.substring(0, 20) + '...');
    } else {
      console.log('👤 Using existing user ID:', storedUserId.substring(0, 20) + '...');
    }
    return storedUserId;
  });
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    // Get or create current session ID
    let storedSessionId = localStorage.getItem('ai-doc-analyzer-current-session');
    if (!storedSessionId) {
      storedSessionId = 'session-' + Date.now();
      localStorage.setItem('ai-doc-analyzer-current-session', storedSessionId);
    }
    return storedSessionId;
  });
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load settings with default values
      const localSettings = { language: 'en', notifications: true, autoSave: true, geminiApiKey: '' };
      
      // Load profile from localStorage first (most up-to-date)
      const savedProfile = localStorage.getItem(`profile_${userId}`);
      let profileData;
      
      if (savedProfile) {
        try {
          profileData = JSON.parse(savedProfile);
        } catch (error) {
          console.error('Failed to parse saved profile:', error);
        }
      }
      
      // Fetch all data in parallel
      const [docs, backendProfile, userStats, chats] = await Promise.all([
        getDocuments(userId),
        getProfile(userId).catch(() => null), // Don't fail if backend is down
        getStats(userId),
        getRecentChats(userId, 20)
      ]);
      
      setUploadedDocs(docs || []);
      // Use localStorage profile if available, otherwise backend or default
      setUserProfile(profileData || backendProfile || {
        name: 'AI User',
        email: 'user@example.com',
        bio: 'Exploring the world of AI-powered document analysis',
        avatar: '👨💻',
        joined: new Date().toLocaleDateString()
      });
      setSettings(localSettings);
      
      setStats(userStats);
      setChatSessions(chats || []);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, [userId]);

  const handleDocumentUpload = async (newDoc) => {
    setUploadedDocs(prevDocs => [...prevDocs, newDoc]);
    
    // Increment documents analyzed stat
    try {
      const updatedStats = await incrementStat(userId, 'documentsAnalyzed', 1);
      setStats(updatedStats);
      
      // Check for first upload achievement
      if (updatedStats.documentsAnalyzed === 1) {
        await unlockAchievement(userId, 'first-upload');
      }
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
    
    setCurrentPage('documents');
  };

  const handleDocumentDelete = (docId) => {
    setUploadedDocs(uploadedDocs.filter(doc => doc.id !== docId));
  };

  // Chat session management
  const handleSessionChange = (sessionId) => {
    setCurrentSessionId(sessionId);
    localStorage.setItem('ai-doc-analyzer-current-session', sessionId);
  };

  const handleNewChat = () => {
    const newSessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    setCurrentSessionId(newSessionId);
    localStorage.setItem('ai-doc-analyzer-current-session', newSessionId);
    console.log('🆕 Created new chat session:', newSessionId);
  };

  const handleDeleteChat = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      try {
        // Clear localStorage cache for this session
        const localStorageKey = `chat-messages-${sessionId}`;
        localStorage.removeItem(localStorageKey);
        
        // Delete from backend
        await deleteChatSession(userId, sessionId);
        
        // Update local state
        setChatSessions(prev => prev.filter(chat => chat.id !== sessionId));
        
        // If deleting current session, create new one
        if (sessionId === currentSessionId) {
          handleNewChat();
        }
        
        console.log('✅ Chat deleted successfully');
        
        // Show success notification
        const notification = document.createElement('div');
        notification.textContent = '✅ Chat deleted successfully!';
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
      } catch (error) {
        console.error('Failed to delete chat:', error);
        
        // Still remove locally even if backend fails
        const localStorageKey = `chat-messages-${sessionId}`;
        localStorage.removeItem(localStorageKey);
        setChatSessions(prev => prev.filter(chat => chat.id !== sessionId));
        
        // Show warning notification
        const notification = document.createElement('div');
        notification.textContent = '⚠️ Chat deleted locally (server offline)';
        notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    }
  };

  const handleRenameChat = async (sessionId, newTitle) => {
    if (!newTitle || newTitle.trim().length === 0) {
      alert('Please enter a valid chat title.');
      return;
    }
    
    try {
      await renameChatSession(userId, sessionId, newTitle.trim());
      
      // Update local state
      setChatSessions(prev => 
        prev.map(chat => 
          chat.id === sessionId 
            ? { ...chat, title: newTitle.trim() }
            : chat
        )
      );
      
      console.log('✅ Chat renamed successfully');
      
      // Show success notification
      const notification = document.createElement('div');
      notification.textContent = '✅ Chat renamed successfully!';
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
    } catch (error) {
      console.error('Failed to rename chat:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.textContent = '❌ Failed to rename chat. Please try again.';
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  const handleChatSave = (chatData) => {
    setChatSessions(prev => {
      const existingIndex = prev.findIndex(chat => chat.id === chatData.sessionId);
      if (existingIndex >= 0) {
        // Update existing chat
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...chatData,
          time: getRelativeTime(new Date()) // Update time
        };
        return updated;
      } else {
        // Add new chat to the beginning
        return [{
          ...chatData,
          time: getRelativeTime(new Date())
        }, ...prev];
      }
    });
  };
  
  // Helper function for relative time
  const getRelativeTime = (date) => {
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
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} uploadedDocs={uploadedDocs} userId={userId} stats={stats} />;
      case 'chat':
        return (
          <ChatPage 
            sessionId={currentSessionId} 
            uploadedDocs={uploadedDocs} 
            userId={userId} 
            setStats={setStats} 
            settings={settings}
            onSessionChange={handleSessionChange}
            currentSessionId={currentSessionId}
            chatSessions={chatSessions}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onChatSave={handleChatSave}
          />
        );
      case 'upload':
        return <UploadPage onDocumentUpload={handleDocumentUpload} userId={userId} />;
      case 'documents':
        return <DocumentsPage uploadedDocs={uploadedDocs} onDocumentDelete={handleDocumentDelete} isLoading={false} />;
      case 'settings':
        return <SettingsPage settings={settings} setSettings={setSettings} userId={userId} />;
      case 'profile':
        return (
          <ProfilePage 
            userProfile={userProfile} 
            setUserProfile={setUserProfile} 
            userId={userId} 
            stats={stats}
            key={`profile-${userId}`} // Force re-render when userId changes
          />
        );
      default:
        return <HomePage setCurrentPage={setCurrentPage} uploadedDocs={uploadedDocs} userId={userId} stats={stats} />;
    }
  };

  // Show loading screen while initial data loads
  if (isLoading || !userProfile || !settings || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-500 mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold mb-2">Loading AI Doc Analyzer...</h2>
          <p className="text-gray-400">Initializing your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white font-sans">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} userProfile={userProfile} />
      <main className="p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 pb-20 sm:pb-16 md:pb-4 max-w-full overflow-x-hidden min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto h-full">
          {renderPage()}
        </div>
      </main>
      <PWAInstallPrompt />
    </div>
  );
}

export default App;
