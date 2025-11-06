import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User';

// Sync Clerk user with our database
export const syncClerkUser = async (req: Request, res: Response) => {
  try {
    const { clerkId, email, name, profileImage } = req.body;

    // Validate required fields
    if (!clerkId || !email) {
      return res.status(400).json({ 
        message: 'Missing required fields: clerkId and email are required' 
      });
    }

    // Find or create user in our database
    let user = await User.findOne({ clerkId });

    if (!user) {
      // Create new user
      user = new User({
        clerkId,
        email,
        name: name || email.split('@')[0], // Fallback to email prefix
        profileImage,
        role: 'viewer', // Default role
      });
      await user.save();
      
      console.log(`✅ New user created: ${email}`);
    } else {
      // Update existing user only if data has changed
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
        console.log(`✅ User updated: ${email}`);
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
        subscription: user.subscription, // Include if exists
      },
    });
  } catch (error: any) {
    console.error('Error syncing Clerk user:', error);
    res.status(500).json({ 
      message: 'Failed to sync user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Webhook handler for Clerk events
export const handleClerkWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    // Validate webhook payload
    if (!type || !data) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    console.log(`📥 Clerk webhook received: ${type}`);

    switch (type) {
      case 'user.created':
        // Create user in our database
        try {
          const newUser = await User.create({
            clerkId: data.id,
            email: data.email_addresses[0]?.email_address || '',
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
            profileImage: data.image_url,
            role: 'viewer',
          });
          console.log(`✅ User created via webhook: ${newUser.email}`);
        } catch (err: any) {
          // Ignore duplicate key errors (user might already exist from sync)
          if (err.code !== 11000) {
            throw err;
          }
          console.log(`ℹ️ User already exists: ${data.email_addresses[0]?.email_address}`);
        }
        break;

      case 'user.updated':
        // Update user in our database
        const updatedUser = await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            email: data.email_addresses[0]?.email_address,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
            profileImage: data.image_url,
          },
          { new: true }
        );
        
        if (updatedUser) {
          console.log(`✅ User updated via webhook: ${updatedUser.email}`);
        } else {
          console.log(`⚠️ User not found for update: ${data.id}`);
        }
        break;

      case 'user.deleted':
        // Delete user from our database (or soft delete)
        const deletedUser = await User.findOneAndDelete({ clerkId: data.id });
        
        if (deletedUser) {
          console.log(`✅ User deleted via webhook: ${deletedUser.email}`);
        } else {
          console.log(`⚠️ User not found for deletion: ${data.id}`);
        }
        break;

      case 'session.created':
      case 'session.ended':
      case 'session.removed':
      case 'session.revoked':
        // Handle session events if needed
        console.log(`ℹ️ Session event: ${type} for user ${data.user_id}`);
        break;

      default:
        console.log(`ℹ️ Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('Error handling Clerk webhook:', error);
    res.status(500).json({ 
      message: 'Webhook processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};