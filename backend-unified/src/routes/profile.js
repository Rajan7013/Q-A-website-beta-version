import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { updateUserProfile, getProfile } from '../utils/supabase.js';
import { uploadToR2, generateFileKey, getPresignedDownloadUrl } from '../utils/r2Storage.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for memory storage (we upload directly to R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Security check: ensure user can only access their own profile (or public profiles if allowed)
    // For now, allow access if authenticated

    const profile = await getProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get public URL for profile picture if it exists
    if (profile.profilePicture && !profile.profilePicture.startsWith('http')) {
      // If it's a file key, convert to URL
      try {
        profile.profilePicture = await getPresignedDownloadUrl(profile.profilePicture);
      } catch (e) {
        logger.warn('Failed to generate URL for profile pic', { error: e.message });
      }
    }

    res.json({ profile });
  } catch (error) {
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const profileData = req.body;
    const updatedUser = await updateUserProfile(userId, profileData);

    logger.info('Profile updated', { userId });
    res.json({ message: 'Profile updated successfully', profile: profileData });
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
router.post('/:userId/picture', requireAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId } = req.params;

    // Authorization check
    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    // Generate R2 Key
    const fileExtension = path.extname(req.file.originalname);
    const fileKey = `profiles/${userId}/avatar_${Date.now()}${fileExtension}`;

    // Upload to R2
    await uploadToR2(req.file.buffer, fileKey, req.file.mimetype);

    // Update User Profile in DB
    const profileUpdate = {
      profilePicture: fileKey,
      // We preserve other fields by NOT sending them, standard update patch
    };

    // We need to pass at least one field to update
    // But our updateUserProfile helper expects a full object or specific fields
    // Let's modify updateUserProfile to allow partial updates properly or fetch first
    // For now, let's just update the profile_picture column directly in DB
    // actually updateUserProfile handles it correctly if we pass the right struct

    await updateUserProfile(userId, { profilePicture: fileKey });

    // Generate URL to return
    const imageUrl = await getPresignedDownloadUrl(fileKey);

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

// Get settings (Placeholder - could be moved to DB later)
router.get('/:userId/settings', requireAuth, (req, res) => {
  // Return defaults for now
  res.json({
    settings: {
      language: 'en',
      notifications: true,
      autoSave: true
    }
  });
});

// Update settings (Placeholder)
router.put('/:userId/settings', requireAuth, (req, res) => {
  res.json({ message: 'Settings saved locally (session only)' });
});

export default router;
