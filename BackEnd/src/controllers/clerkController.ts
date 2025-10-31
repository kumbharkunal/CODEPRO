import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User';

// Sync Clerk user with our database
export const syncClerkUser = async (req: Request, res: Response) => {
  try {
    const { clerkId, email, name, profileImage } = req.body;

    // Find or create user in our database
    let user = await User.findOne({ clerkId });

    if (!user) {
      // Create new user
      user = new User({
        clerkId,
        email,
        name,
        profileImage,
        role: 'viewer', // Default role
      });
      await user.save();
    } else {
      // Update existing user
      user.email = email;
      user.name = name;
      user.profileImage = profileImage;
      await user.save();
    }

    res.status(200).json({
      message: 'User synced successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Error syncing Clerk user:', error);
    res.status(500).json({ message: 'Failed to sync user' });
  }
};

// Webhook handler for Clerk events
export const handleClerkWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    switch (type) {
      case 'user.created':
        // Create user in our database
        await User.create({
          clerkId: data.id,
          email: data.email_addresses[0]?.email_address,
          name: data.first_name + ' ' + data.last_name,
          profileImage: data.image_url,
          role: 'viewer',
        });
        break;

      case 'user.updated':
        // Update user in our database
        await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            email: data.email_addresses[0]?.email_address,
            name: data.first_name + ' ' + data.last_name,
            profileImage: data.image_url,
          }
        );
        break;

      case 'user.deleted':
        // Delete user from our database
        await User.findOneAndDelete({ clerkId: data.id });
        break;
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Error handling Clerk webhook:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};