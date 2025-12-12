import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// In-memory storage
const userProfiles = new Map();
const userSettings = new Map();

// Create uploads directory
const uploadsDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

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
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    userProfiles.set(userId, { ...profileData, id: userId });
    logger.info('Profile updated', { userId });
    res.json({ message: 'Profile updated successfully', profile: profileData });
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
router.post('/:userId/picture', upload.single('profilePicture'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId } = req.params;
    
    // Delete old profile picture if exists
    const existingProfile = userProfiles.get(userId);
    if (existingProfile?.profilePicture) {
      const oldImagePath = path.join(__dirname, '../..', existingProfile.profilePicture);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    logger.info('Profile picture uploaded', { userId });
    
    res.json({ 
      message: 'Profile picture uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    logger.error('Upload profile picture error', { error: error.message });
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Get settings
router.get('/:userId/settings', (req, res) => {
  try {
    const { userId } = req.params;
    const settings = userSettings.get(userId) || {
      language: 'en',
      notifications: true,
      autoSave: true
    };
    res.json({ settings });
  } catch (error) {
    logger.error('Get settings error', { error: error.message });
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
router.put('/:userId/settings', (req, res) => {
  try {
    const { userId } = req.params;
    const settingsData = req.body;
    userSettings.set(userId, settingsData);
    logger.info('Settings updated', { userId, settings: settingsData });
    res.json({ message: 'Settings updated successfully', settings: settingsData });
  } catch (error) {
    logger.error('Update settings error', { error: error.message });
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
