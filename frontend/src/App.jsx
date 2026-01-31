import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUser, useAuth, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import HomePage from './components/HomePage';
import ChatPage from './components/ChatPage';
import UploadPage from './components/UploadPage';
import DocumentsPage from './components/DocumentsPage';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import InstallPrompt from './components/InstallPrompt';
import LoginPage from './components/LoginPage';
import { getDocuments, getProfile, getSettings, getStats, incrementStat, unlockAchievement, setClerkTokenGetter } from './utils/api';

function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const [sessionId] = useState(() => 'session-' + Date.now());
  const userId = user?.id;
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel
      const [docs, profile, userSettings, userStats] = await Promise.all([
        getDocuments(),
        getProfile(userId),
        getSettings(userId),
        getStats(userId)
      ]);

      setUploadedDocs(docs || []);
      setUserProfile(profile);
      setSettings(userSettings);
      setStats(userStats);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      // Fallback to allow app to load even if backend is down/broken
      setUploadedDocs([]);
      setUserProfile({
        firstName: user?.firstName || 'User',
        lastName: user?.lastName || '',
        email: user?.primaryEmailAddress?.emailAddress
      });
      setSettings({ language: 'en', theme: 'dark' });
      setStats({ documentsAnalyzed: 0, queriesAsked: 0, storageUsed: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && getToken) {
      setClerkTokenGetter(getToken);
      fetchInitialData();
    }
  }, [isSignedIn, userId, getToken]);

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
  };

  const handleDocumentDelete = (docId) => {
    setUploadedDocs(uploadedDocs.filter(doc => doc.id !== docId));
  };

  // Show loading screen while Clerk loads
  if (!isLoaded) {
    return (
      <div className="h-screen bg-gray-900 text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold mb-2">Loading AI Doc Analyzer...</h2>
        </div>
      </div>
    );
  }

  // Show sign in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="h-screen bg-gray-900 text-white font-sans flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <Routes>
            <Route path="/sign-in" element={<LoginPage />} />
            <Route
              path="/sso-callback"
              element={<AuthenticateWithRedirectCallback />}
            />
            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // Show loading screen while initial data loads
  if (isLoading || !userProfile || !settings || !stats) {
    return (
      <div className="h-screen bg-gray-900 text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto mb-8"></div>
          <p className="text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white font-sans flex overflow-hidden">
      <InstallPrompt />
      <main className="flex-1 h-full w-full relative">
        <Routes>
          <Route path="/" element={<Navigate to={`/chat/${sessionId}`} replace />} />

          {/* Chat Routes */}
          <Route path="/chat" element={<Navigate to={`/chat/${sessionId}`} replace />} />
          <Route
            path="/chat/:sessionId"
            element={
              <ChatPage
                uploadedDocs={uploadedDocs}
                userId={userId}
                setStats={setStats}
                settings={settings}
                onDocumentDelete={handleDocumentDelete}
                onDocumentUpload={handleDocumentUpload}
              />
            }
          />

          <Route path="/upload" element={<UploadPage onDocumentUpload={handleDocumentUpload} />} />
          <Route path="/documents" element={<DocumentsPage uploadedDocs={uploadedDocs} onDocumentDelete={handleDocumentDelete} isLoading={false} />} />
          <Route path="/settings" element={<SettingsPage settings={settings} setSettings={setSettings} userId={userId} />} />
          <Route path="/profile" element={<ProfilePage userProfile={userProfile} setUserProfile={setUserProfile} userId={userId} stats={stats} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
