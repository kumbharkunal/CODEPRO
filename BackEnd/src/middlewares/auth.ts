import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User';

// Define a custom request type that includes your local user
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

    // 1. Verify the token using Clerk's JWT verification
    try {
      const claims = await clerkClient.verifyToken(token);
      
      if (!claims || !claims.sub) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // 2. Get the clerkId (called 'sub' in the JWT)
      const clerkId = claims.sub;

      // 3. Find the local user in your MongoDB
      const localUser = await User.findOne({ clerkId: clerkId });
      
      if (!localUser) {
        // User not synced - this shouldn't happen with proper frontend flow
        return res.status(401).json({ 
          message: 'User not found. Please log out and log back in.',
          code: 'USER_NOT_SYNCED'
        });
      }

      // 4. Attach the local MongoDB user object to req.user
      req.user = localUser;

      next();
    } catch (verifyError: any) {
      console.error('Token verification error:', verifyError.message);
      
      // Handle specific token errors
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
    console.error('Authentication error:', error.message);
    return res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Authorize middleware - Check user roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Check the user's role (from our local DB)
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