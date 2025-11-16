import express from 'express';

const router = express.Router();

// In-memory storage (replace with database in production)
const userProfiles = new Map();
const userSettings = new Map();

// Get profile
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const profile = userProfiles.get(userId) || {
      id: userId,
      name: 'Guest User',
      email: 'guest@example.com',
      avatar: '👨‍💻',
      bio: 'New user exploring AI Document Analyzer',
      joined: new Date().toISOString().split('T')[0]
    };
    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    userProfiles.set(userId, { ...profileData, id: userId });
    res.json({ message: 'Profile updated successfully', profile: profileData });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get settings
router.get('/:userId/settings', (req, res) => {
  try {
    const { userId } = req.params;
    const settings = userSettings.get(userId) || {
      language: 'en',
      notifications: true,
      autoSave: true,
      geminiApiKey: ''
    };
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
router.put('/:userId/settings', (req, res) => {
  try {
    const { userId } = req.params;
    const settingsData = req.body;
    userSettings.set(userId, settingsData);
    res.json({ message: 'Settings updated successfully', settings: settingsData });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;