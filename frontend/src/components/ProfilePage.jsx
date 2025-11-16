import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit, Save, Award, BarChart3, TrendingUp, Target, Clock, FileText, MessageSquare, Check } from 'lucide-react';
import { updateProfile, getAchievements, getActivity } from '../utils/api';

const ProfilePage = ({ userProfile, setUserProfile, userId, stats }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastStatsUpdate, setLastStatsUpdate] = useState(null);
  
  // Load profile dynamically on mount and when userId changes
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // Try to load from localStorage first
        const savedProfile = localStorage.getItem(`profile_${userId}`);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setLocalProfile(parsed);
          setUserProfile(parsed);
        } else if (userProfile) {
          // Use passed userProfile as fallback
          setLocalProfile(userProfile);
        } else {
          // Create default profile if none exists
          const defaultProfile = {
            name: 'AI User',
            email: 'user@example.com',
            bio: 'Exploring the world of AI-powered document analysis',
            avatar: '👨💻',
            joined: new Date().toLocaleDateString()
          };
          setLocalProfile(defaultProfile);
          setUserProfile(defaultProfile);
          localStorage.setItem(`profile_${userId}`, JSON.stringify(defaultProfile));
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, userProfile, setUserProfile]);
  const [saving, setSaving] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load achievements and activity dynamically when stats change
  useEffect(() => {
    const loadProfileData = async () => {
      setLoadingData(true);
      try {
        // Load achievements with real-time stats
        const defaultAchievements = [
          { icon: '🎯', title: 'First Question', desc: 'Asked your first question', earned: (stats?.questionsAnswered || 0) > 0 },
          { icon: '📄', title: 'Document Master', desc: 'Uploaded your first document', earned: (stats?.documentsAnalyzed || 0) > 0 },
          { icon: '💬', title: 'Conversationalist', desc: 'Had 10 conversations', earned: (stats?.conversations || 0) >= 10 },
          { icon: '⏰', title: 'Time Saver', desc: 'Saved 5+ hours of study time', earned: (stats?.studyHours || 0) >= 5 },
          { icon: '🏆', title: 'Power User', desc: 'Analyzed 50+ documents', earned: (stats?.documentsAnalyzed || 0) >= 50 },
          { icon: '🌟', title: 'Expert', desc: 'Asked 100+ questions', earned: (stats?.questionsAnswered || 0) >= 100 }
        ];
        
        setAchievements(defaultAchievements);
        
        // Generate activity data based on current stats
        const generateActivity = () => {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const totalActivity = (stats?.questionsAnswered || 0) + (stats?.documentsAnalyzed || 0);
          
          return days.map(day => ({
            day,
            value: Math.max(1, Math.floor(Math.random() * Math.min(10, totalActivity + 1)))
          }));
        };
        
        setActivity(generateActivity());
        
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (stats && JSON.stringify(stats) !== lastStatsUpdate) {
      loadProfileData();
      setLastStatsUpdate(JSON.stringify(stats));
    }
  }, [userId, stats, lastStatsUpdate]);

  const handleChange = (field, value) => {
    setLocalProfile({ ...localProfile, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`profile_${userId}`, JSON.stringify(localProfile));
      
      // Update parent component state immediately
      setUserProfile(localProfile);
      
      // Try to save to backend but don't fail if it doesn't work
      try {
        await updateProfile(userId, localProfile);
      } catch (backendError) {
        console.log('Backend save failed, but localStorage saved:', backendError);
      }
      
      setIsEditing(false);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.textContent = '✅ Profile updated successfully!';
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-bold';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('❌ Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Dynamic profile stats that update with real stats
  const profileStats = [
    { icon: FileText, label: 'Documents', value: (stats?.documentsAnalyzed || 0).toString(), color: 'from-blue-400 to-cyan-500' },
    { icon: MessageSquare, label: 'Questions', value: (stats?.questionsAnswered || 0).toString(), color: 'from-green-400 to-emerald-500' },
    { icon: Clock, label: 'Hours Saved', value: (stats?.studyHours || 0).toString(), color: 'from-orange-400 to-red-500' },
    { icon: Award, label: 'Conversations', value: (stats?.conversations || 0).toString(), color: 'from-purple-400 to-pink-500' }
  ];

  const avatarOptions = ['👨‍💻', '👩‍💻', '🧑‍🎓', '👨‍🔬', '👩‍🔬', '🧑‍💼', '👨‍🎨', '👩‍🎨'];

  // Show loading state while profile loads
  if (isLoading || !localProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
          <h2 className="text-2xl font-bold text-white">Loading Profile...</h2>
          <p className="text-gray-400">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              {/* Avatar Section */}
              <div className="text-center">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="text-8xl bg-white/20 backdrop-blur-sm p-6 rounded-3xl">
                      {localProfile.avatar}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {avatarOptions.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => handleChange('avatar', avatar)}
                          className={`text-4xl p-3 rounded-xl transform hover:scale-125 transition-all duration-300 ${
                            localProfile.avatar === avatar
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-8xl bg-white/20 backdrop-blur-sm p-6 rounded-3xl">
                    {localProfile.avatar}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-white space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Name</label>
                      <input
                        type="text"
                        value={localProfile.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-3 border-gray-300 rounded-xl px-6 py-3 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-purple-300 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Email</label>
                      <input
                        type="email"
                        value={localProfile.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-3 border-gray-300 rounded-xl px-6 py-3 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-purple-300 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Bio</label>
                      <textarea
                        value={localProfile.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        rows="3"
                        className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-3 border-gray-300 rounded-xl px-6 py-3 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-purple-300 text-gray-800"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black">{localProfile.name}</h1>
                    <div className="flex flex-col gap-2 text-white/80">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        <span>{localProfile.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span>Joined {localProfile.joined}</span>
                      </div>
                    </div>
                    <p className="text-lg text-white/90">{localProfile.bio}</p>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        {saving ? (
                          <>
                            <Save className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setLocalProfile(localProfile);
                          setIsEditing(false);
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-bold transform hover:scale-105 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Edit />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {profileStats.map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300`}>
              <stat.icon className="w-10 h-10 mb-3" />
              <div className="text-4xl font-black">{stat.value}</div>
              <div className="text-sm font-bold opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Achievements Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">Achievements</h2>
              <p className="text-gray-400">Your learning milestones</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingData ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading achievements...</p>
              </div>
            ) : (
              achievements.map((achievement, idx) => (
              <div key={`${achievement.title}-${achievement.earned}`} className={`p-6 rounded-2xl border-2 ${achievement.earned ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500 transform hover:scale-105' : 'bg-white/5 border-white/10 hover:border-white/20'} transition-all duration-300 cursor-pointer`}>
                <div className="text-5xl mb-3">{achievement.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{achievement.title}</h3>
                <p className="text-gray-400 text-sm">{achievement.desc}</p>
                {achievement.earned ? (
                  <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm font-bold animate-pulse">
                    <Check className="w-4 h-4" />
                    <span>Earned!</span>
                  </div>
                ) : (
                  <div className="mt-4 inline-flex items-center gap-2 bg-gray-500/20 text-gray-400 px-3 py-1 rounded-lg text-sm font-bold">
                    <span>Not yet earned</span>
                  </div>
                )}
              </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">Activity Overview</h2>
              <p className="text-gray-400">Your learning progress</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-8 overflow-x-auto pb-4">
            {loadingData ? (
              <div className="col-span-full text-center py-8 w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : (
              activity.map((dayData, idx) => {
                const height = Math.max((dayData.value / 10) * 100, 20);
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`w-16 rounded-t-xl bg-gradient-to-t from-purple-600 to-pink-500 transition-all duration-300 hover:scale-110`} style={{ height: `${height}px` }}></div>
                    <div className="text-sm font-bold text-gray-300 mt-2">{dayData.day}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;