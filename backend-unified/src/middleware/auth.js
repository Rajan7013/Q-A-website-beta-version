import { clerkClient } from '@clerk/clerk-sdk-node';
import { logger } from '../utils/logger.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No valid session token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify the JWT token directly
      const sessionClaims = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      
      if (!sessionClaims || !sessionClaims.sub) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid token claims' 
        });
      }

      const userId = sessionClaims.sub;
      
      // Get user details
      const user = await clerkClient.users.getUser(userId);
      
      req.userId = userId;
      req.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      logger.info('User authenticated', { userId });
      next();
    } catch (clerkError) {
      logger.error('Clerk verification failed', { error: clerkError.message });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token verification failed: ' + clerkError.message
      });
    }
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication check failed' 
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const sessionClaims = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      
      if (sessionClaims && sessionClaims.sub) {
        const user = await clerkClient.users.getUser(sessionClaims.sub);
        req.userId = sessionClaims.sub;
        req.user = {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName
        };
      }
    } catch (clerkError) {
      logger.warn('Optional auth verification failed', { error: clerkError.message });
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error: error.message });
    next();
  }
}
