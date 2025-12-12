import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Edit, Save, Award, BarChart3, TrendingUp, Target, Clock, FileText, MessageSquare, Check, Camera, X, Upload as UploadIcon, Eye, MapPin, Briefcase, Link as LinkIcon, Globe, Phone, Sparkles, Zap, Star, TrendingUp as TrendUp, BookOpen, GraduationCap } from 'lucide-react';
import { updateProfile, getAchievements, getActivity, uploadProfilePicture } from '../utils/api';

const ProfilePage = ({ userProfile, setUserProfile, userId, stats }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState(userProfile);
  const [saving, setSaving] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoadingData(true);
        const [achievementsData, activityData] = await Promise.all([
          getAchievements(userId),
          getActivity(userId)
        ]);
        setAchievements(achievementsData);
        setActivity(activityData);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleChange = (field, value) => {
    setLocalProfile({ ...localProfile, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(userId, localProfile);
      setUserProfile(localProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const profileStats = [
    { icon: FileText, label: 'Documents', value: (stats?.documentsAnalyzed || 0).toString(), color: 'from-blue-400 to-cyan-500' },
    { icon: MessageSquare, label: 'Conversations', value: (stats?.conversations || 0).toString(), color: 'from-green-400 to-emerald-500' },
    { icon: Clock, label: 'Hours Saved', value: (stats?.studyHours || 0).toString(), color: 'from-orange-400 to-red-500' },
    { icon: Award, label: 'Achievements', value: (stats?.achievements || 0).toString(), color: 'from-purple-400 to-pink-500' }
  ];

  const avatarOptions = ['👨‍💻', '👩‍💻', '🧑‍🎓', '👨‍🔬', '👩‍🔬', '🧑‍💼', '👨‍🎨', '👩‍🎨'];

  // Handle profile picture upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const imageUrl = await uploadProfilePicture(userId, file, (progress) => {
        setUploadProgress(progress);
      });

      // Update profile
      const updatedProfile = { ...localProfile, profilePicture: imageUrl };
      setLocalProfile(updatedProfile);
      setUserProfile(updatedProfile);
      await updateProfile(userId, updatedProfile);

      // Show success notification
      const notification = document.createElement('div');
      notification.textContent = '✅ Profile picture updated!';
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  // Remove profile picture
  const handleRemoveImage = async () => {
    if (!confirm('Remove profile picture?')) return;

    try {
      const updatedProfile = { ...localProfile, profilePicture: null };
      setLocalProfile(updatedProfile);
      setUserProfile(updatedProfile);
      setImagePreview(null);
      await updateProfile(userId, updatedProfile);

      const notification = document.createElement('div');
      notification.textContent = '✅ Profile picture removed!';
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove image. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              {/* Profile Picture Section */}
              <div className="relative group">
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-8 border-white/30 shadow-2xl backdrop-blur-sm bg-gradient-to-br from-purple-500 to-pink-500">
                  {userProfile.profilePicture || imagePreview ? (
                    <img 
                      src={imagePreview || userProfile.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                      <User className="w-24 h-24 text-white" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  {(userProfile.profilePicture || imagePreview) && !isEditing && (
                    <div 
                      onClick={() => setShowImageModal(true)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Eye className="w-12 h-12 text-white" />
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                      <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-white text-sm font-bold">{uploadProgress}%</p>
                    </div>
                  )}
                </div>
                
                {/* Camera Button */}
                {isEditing && (
                  <div className="absolute bottom-2 right-2">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full text-white shadow-xl hover:scale-110 transform transition-all duration-300 disabled:opacity-50"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                )}
                
                {/* Remove Button */}
                {isEditing && (userProfile.profilePicture || imagePreview) && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 p-2 rounded-full text-white shadow-xl hover:scale-110 transform transition-all duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">Job Title</label>
                        <input
                          type="text"
                          value={localProfile.jobTitle || ''}
                          onChange={(e) => handleChange('jobTitle', e.target.value)}
                          placeholder="e.g., Student, Developer"
                          className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-3 border-gray-300 rounded-xl px-6 py-3 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-purple-300 text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Location</label>
                        <input
                          type="text"
                          value={localProfile.location || ''}
                          onChange={(e) => handleChange('location', e.target.value)}
                          placeholder="e.g., Mumbai, India"
                          className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-3 border-gray-300 rounded-xl px-6 py-3 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-purple-300 text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Website</label>
                        <input
                          type="url"
                          value={localProfile.website || ''}
                          onChange={(e) => handleChange('website', e.target.value)}
                          placeholder="https://your-website.com"
                          className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-3 border-gray-300 rounded-xl px-6 py-3 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-purple-300 text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Phone</label>
                        <input
                          type="tel"
                          value={localProfile.phone || ''}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+91 1234567890"
                          className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-3 border-gray-300 rounded-xl px-6 py-3 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-purple-300 text-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black">{userProfile.name}</h1>
                    {userProfile.jobTitle && (
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <Briefcase className="w-5 h-5" />
                        <span className="font-bold">{userProfile.jobTitle}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-white/80">
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                        <Mail className="w-4 h-4" />
                        <span>{userProfile.email}</span>
                      </div>
                      {userProfile.location && (
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                          <MapPin className="w-4 h-4" />
                          <span>{userProfile.location}</span>
                        </div>
                      )}
                      {userProfile.phone && (
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                          <Phone className="w-4 h-4" />
                          <span>{userProfile.phone}</span>
                        </div>
                      )}
                      {userProfile.website && (
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                          <LinkIcon className="w-4 h-4" />
                          <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-300 transition-colors">
                            {userProfile.website.replace('https://', '').replace('http://', '')}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {userProfile.joined}</span>
                      </div>
                    </div>
                    <p className="text-lg text-white/90 leading-relaxed">{userProfile.bio}</p>
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
                          setLocalProfile(userProfile);
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
              <div key={idx} className={`p-6 rounded-2xl border-2 ${achievement.earned ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500' : 'bg-white/5 border-white/10'} transition-all duration-300`}>
                <div className="text-5xl mb-3">{achievement.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{achievement.title}</h3>
                <p className="text-gray-400 text-sm">{achievement.desc}</p>
                {achievement.earned && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm font-bold">
                    <Check className="w-4 h-4" />
                    <span>Earned!</span>
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

      {/* Full-Screen Image Modal */}
      {showImageModal && (userProfile.profilePicture || imagePreview) && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full text-white transition-all duration-300 hover:scale-110"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative max-w-4xl max-h-[90vh] animate-scale-in">
            <img 
              src={imagePreview || userProfile.profilePicture} 
              alt="Profile Full View" 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full">
              <p className="text-white font-bold">{userProfile.name}'s Profile Picture</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;