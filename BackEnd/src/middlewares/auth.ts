import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

interface AuthRequest extends Request {
  userId?: string;
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
    const sessionId = req.headers['x-clerk-session-id'] as string;

    // Verify Clerk session token
    const session = await clerkClient.sessions.verifySession(sessionId,token);
    
    if (!session) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(session.userId);
    
    req.userId = clerkUser.id;
    req.user = clerkUser;

    next();
  } catch (error) {
    console.error('Clerk authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Keep existing authorize middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check role in our database
    // (You'll need to fetch user from DB and check role)
    
    next();
  };
};