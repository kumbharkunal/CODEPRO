import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateClerk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('[Auth] 🔐 Authenticating request to:', req.method, req.path);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] ❌ No authorization header provided');
      console.log('[Auth] Headers received:', Object.keys(req.headers));
      return res.status(401).json({
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('[Auth] ✅ Token received, length:', token.length);

    try {
      console.log('[Auth] 🔍 Verifying token with Clerk...');
      const claims = await clerkClient.verifyToken(token);
      console.log('[Auth] ✅ Token verified successfully');

      if (!claims || !claims.sub) {
        console.warn('[Auth] ❌ Invalid token claims');
        return res.status(401).json({
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }

      const clerkId = claims.sub;
      console.log('[Auth] 🔍 Looking up user with clerkId:', clerkId);
      const localUser = await User.findOne({ clerkId: clerkId });

      if (!localUser) {
        console.warn(`[Auth] ❌ User not found in database for clerkId: ${clerkId}`);
        console.log('[Auth] Available users in DB:', await User.countDocuments());
        return res.status(401).json({
          message: 'User not found. Please log out and log back in.',
          code: 'USER_NOT_SYNCED'
        });
      }

      console.log('[Auth] ✅ User found:', localUser.email, '| Role:', localUser.role);
      req.user = localUser;
      next();
    } catch (verifyError: any) {
      const errorMsg = verifyError.message || 'Unknown error';
      console.error('[Auth] ❌ Token verification error:', errorMsg);
      console.error('[Auth] Error details:', verifyError);

      if (errorMsg.includes('expired')) {
        return res.status(401).json({
          message: 'Token expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        return res.status(429).json({
          message: 'Too many requests. Please try again in a moment.',
          code: 'RATE_LIMITED'
        });
      }

      return res.status(401).json({
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
      });
    }
  } catch (error: any) {
    console.error('[Auth] ❌ Unexpected authentication error:', error);
    return res.status(500).json({
      message: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }

    next();
  };
};

// Ensure user has team access
export const requireTeamAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (!req.user.teamId) {
    return res.status(403).json({
      message: 'User is not part of any team',
      code: 'NO_TEAM_ACCESS'
    });
  }

  next();
};

// Verify resource belongs to user's team
export const requireTeamOwnership = (resourceType: 'repository' | 'review') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.teamId) {
        return res.status(401).json({
          message: 'Not authenticated or no team access',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const resourceId = req.params.id || req.params.repositoryId;
      if (!resourceId) {
        return res.status(400).json({
          message: 'Resource ID is required',
          code: 'INVALID_REQUEST'
        });
      }

      let resource;
      if (resourceType === 'repository') {
        const Repository = require('../models/Repository').default;
        resource = await Repository.findById(resourceId);
      } else if (resourceType === 'review') {
        const Review = require('../models/Review').default;
        resource = await Review.findById(resourceId);
      }

      if (!resource) {
        return res.status(404).json({
          message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`,
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Check if resource belongs to user's team
      if (!resource.teamId || resource.teamId.toString() !== req.user.teamId.toString()) {
        return res.status(404).json({
          message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`,
          code: 'RESOURCE_NOT_FOUND' // Don't reveal it exists but belongs to another team
        });
      }

      next();
    } catch (error) {
      console.error('Team ownership check error:', error);
      return res.status(500).json({
        message: 'Server error during authorization',
        code: 'AUTH_ERROR'
      });
    }
  };
};
