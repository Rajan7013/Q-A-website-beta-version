import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ensureUser, getUserDocuments, getUserChats } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await ensureUser(
      req.userId,
      req.user.email,
      req.user.firstName,
      req.user.lastName
    );

    const documents = await getUserDocuments(req.userId);
    const chats = await getUserChats(req.userId, 100);

    const totalStorageUsed = documents.reduce((sum, doc) => sum + doc.file_size, 0);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      },
      stats: {
        documentsCount: documents.length,
        chatsCount: chats.length,
        storageUsed: totalStorageUsed,
        storageQuota: user.storage_quota,
        storageUsedPercentage: (totalStorageUsed / user.storage_quota) * 100
      }
    });

  } catch (error) {
    logger.error('Failed to get user info', { error: error.message, userId: req.userId });
    res.status(500).json({
      error: 'Failed to retrieve user information',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
