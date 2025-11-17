import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User';
import mongoose from 'mongoose';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateClerk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const claims = await clerkClient.verifyToken(token);
      
      if (!claims || !claims.sub) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      const clerkId = claims.sub;
      const localUser = await User.findOne({ clerkId: clerkId });
      
      if (!localUser) {
        return res.status(401).json({ 
          message: 'User not found. Please log out and log back in.',
          code: 'USER_NOT_SYNCED'
        });
      }

      req.user = localUser;
      next();
    } catch (verifyError: any) {
      if (verifyError.message?.includes('expired')) {
        return res.status(401).json({ 
          message: 'Token expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error: any) {
    return res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Role-based authorization middleware
 * Only allows users with specified roles to access the route
 */
export const authorize = (...roles: string[]) => {
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

/**
 * Check if user is admin
 */
export const isAdmin = (req: AuthRequest): boolean => {
  return req.user?.role === 'admin';
};

/**
 * Check if user is admin or developer
 */
export const isAdminOrDeveloper = (req: AuthRequest): boolean => {
  return req.user?.role === 'admin' || req.user?.role === 'developer';
};

/**
 * Verify resource ownership or admin access
 * For repositories: checks if user connected the repo OR is admin
 * For reviews: checks if user is the reviewer OR is admin
 */
export const requireOwnershipOrAdmin = (resourceType: 'repository' | 'review') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Admins can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const { id } = req.params;
      
      if (resourceType === 'repository') {
        const Repository = mongoose.model('Repository');
        const resource = await Repository.findById(id);
        
        if (!resource) {
          return res.status(404).json({ message: 'Repository not found' });
        }

        // Check if user owns the repository
        if (resource.connectedBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ 
            message: 'Access denied. You can only access repositories you connected.',
            code: 'ACCESS_DENIED'
          });
        }
      } else if (resourceType === 'review') {
        const Review = mongoose.model('Review');
        const resource = await Review.findById(id);
        
        if (!resource) {
          return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user is the reviewer or if review is for their PR
        if (resource.reviewedBy.toString() !== req.user._id.toString() && 
            resource.author !== req.user.email) {
          return res.status(403).json({ 
            message: 'Access denied. You can only access your own reviews.',
            code: 'ACCESS_DENIED'
          });
        }
      }

      next();
    } catch (error: any) {
      console.error('Error in requireOwnershipOrAdmin:', error);
      return res.status(500).json({ 
        message: 'Error verifying resource access',
        code: 'VERIFICATION_ERROR'
      });
    }
  };
};
