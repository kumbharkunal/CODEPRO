import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User';

export const syncClerkUser = async (req: Request, res: Response) => {
  try {
    const { clerkId, email, name, profileImage } = req.body;
    const authHeader = req.headers.authorization;

    if (!clerkId || !email) {
      return res.status(400).json({ 
        message: 'Missing required fields: clerkId and email are required' 
      });
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const claims = await clerkClient.verifyToken(token);
        if (!claims || claims.sub !== clerkId) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (verifyError) {
        return res.status(401).json({ message: 'Token verification failed' });
      }
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = new User({
        clerkId,
        email,
        name: name || email.split('@')[0],
        profileImage,
        role: 'viewer',
      });
      await user.save();
    } else {
      let hasChanges = false;
      
      if (user.email !== email) {
        user.email = email;
        hasChanges = true;
      }
      if (user.name !== name && name) {
        user.name = name;
        hasChanges = true;
      }
      if (user.profileImage !== profileImage && profileImage) {
        user.profileImage = profileImage;
        hasChanges = true;
      }
      
      if (hasChanges) {
        await user.save();
      }
    }

    res.status(200).json({
      message: 'User synced successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        subscription: user.subscription,
      },
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Failed to sync user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const handleClerkWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    switch (type) {
      case 'user.created':
        try {
          await User.create({
            clerkId: data.id,
            email: data.email_addresses[0]?.email_address || '',
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
            profileImage: data.image_url,
            role: 'viewer',
          });
        } catch (err: any) {
          if (err.code !== 11000) throw err;
        }
        break;

      case 'user.updated':
        await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            email: data.email_addresses[0]?.email_address,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
            profileImage: data.image_url,
          },
          { new: true }
        );
        break;

      case 'user.deleted':
        await User.findOneAndDelete({ clerkId: data.id });
        break;

      default:
        break;
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Webhook processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
