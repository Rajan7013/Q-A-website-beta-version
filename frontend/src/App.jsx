import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ChatPage from './components/ChatPage';
import UploadPage from './components/UploadPage';
import DocumentsPage from './components/DocumentsPage';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import { getDocuments, getProfile, getSettings, getStats, incrementStat, unlockAchievement, getRecentChats, saveChatSession, deleteChatSession, renameChatSession } from './utils/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userId] = useState(() => {
    // Get or create persistent user ID
    let storedUserId = localStorage.getItem('ai-doc-analyzer-user-id');
    if (!storedUserId) {
      storedUserId = 'user-' + Date.now();
      localStorage.setItem('ai-doc-analyzer-user-id', storedUserId);
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
      
      // Fetch all data in parallel
      const [docs, profile, userSettings, userStats, chats] = await Promise.all([
        getDocuments(),
        getProfile(userId),
        getSettings(userId),
        getStats(userId),
        getRecentChats(userId, 20)
      ]);
      
      setUploadedDocs(docs || []);
      setUserProfile(profile);
      setSettings(userSettings);
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
    const newSessionId = 'session-' + Date.now();
    setCurrentSessionId(newSessionId);
    localStorage.setItem('ai-doc-analyzer-current-session', newSessionId);
  };

  const handleDeleteChat = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteChatSession(userId, sessionId);
        setChatSessions(prev => prev.filter(chat => chat.id !== sessionId));
        
        // If deleting current session, create new one
        if (sessionId === currentSessionId) {
          handleNewChat();
        }
        
        console.log('✅ Chat deleted successfully');
      } catch (error) {
        console.error('Failed to delete chat:', error);
        alert('Failed to delete chat. Please try again.');
      }
    }
  };

  const handleRenameChat = async (sessionId, newTitle) => {
    try {
      await renameChatSession(userId, sessionId, newTitle);
      setChatSessions(prev => 
        prev.map(chat => 
          chat.id === sessionId 
            ? { ...chat, title: newTitle }
            : chat
        )
      );
      console.log('✅ Chat renamed successfully');
    } catch (error) {
      console.error('Failed to rename chat:', error);
      alert('Failed to rename chat. Please try again.');
    }
  };

  const handleChatSave = (chatData) => {
    setChatSessions(prev => {
      const existingIndex = prev.findIndex(chat => chat.id === chatData.sessionId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = chatData;
        return updated;
      } else {
        return [chatData, ...prev];
      }
    });
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
        return <UploadPage onDocumentUpload={handleDocumentUpload} />;
      case 'documents':
        return <DocumentsPage uploadedDocs={uploadedDocs} onDocumentDelete={handleDocumentDelete} isLoading={false} />;
      case 'settings':
        return <SettingsPage settings={settings} setSettings={setSettings} userId={userId} />;
      case 'profile':
        return <ProfilePage userProfile={userProfile} setUserProfile={setUserProfile} userId={userId} stats={stats} />;
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
      <main className="p-2 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-4">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
