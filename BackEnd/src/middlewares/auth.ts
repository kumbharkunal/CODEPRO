import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User'; // Import your Mongoose User model

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
    const claims = await clerkClient.verifyToken(token);
    
    if (!claims) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // 2. Get the clerkId (called 'sub' in the JWT)
    const clerkId = claims.sub;

    if (!clerkId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // 3. Find the local user in your MongoDB
    const localUser = await User.findOne({ clerkId: clerkId });
    
    if (!localUser) {
      // This case shouldn't happen if frontend sync-on-login works
      return res.status(401).json({ message: 'User not synced. Please log out and log back in.' });
    }

    // 4. Attach the local MongoDB user object to req.user
    req.user = localUser;

    next();
  } catch (error: any) {
    console.error('Clerk authentication error:', error.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// 5. Add the missing logic to your authorize middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check the user's role (from our local DB)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: User role (${req.user.role}) is not authorized.` 
      });
    }
    
    next();
  };
};