import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User';
import Team from '../models/Team';
import Invitation from '../models/Invitation';
import { Webhook } from 'svix';

export const syncClerkUser = async (req: Request, res: Response) => {
  try {
    const { clerkId, email, name, profileImage } = req.body;
    const authHeader = req.headers.authorization;

    // Enhanced validation
    if (!clerkId || !email) {
      console.error('[Clerk Sync] Missing required fields:', { clerkId: !!clerkId, email: !!email });
      return res.status(400).json({
        message: 'Missing required fields: clerkId and email are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[Clerk Sync] Invalid email format:', email);
      return res.status(400).json({
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate Clerk token if provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const claims = await clerkClient.verifyToken(token);
        if (!claims || claims.sub !== clerkId) {
          console.error('[Clerk Sync] Token mismatch:', { tokenSub: claims?.sub, clerkId });
          return res.status(401).json({
            message: 'Invalid token',
            code: 'TOKEN_MISMATCH'
          });
        }
      } catch (verifyError: any) {
        console.error('[Clerk Sync] Token verification failed:', verifyError.message);
        return res.status(401).json({
          message: 'Token verification failed',
          code: 'INVALID_TOKEN'
        });
      }
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
      console.log('[Clerk Sync] Creating new user:', { clerkId, email });

      // Check if user has a pending invitation
      const pendingInvitation = await Invitation.findOne({
        email: email.toLowerCase(),
        status: 'pending',
        expiresAt: { $gt: new Date() },
      });

      // Create user without team if they have a pending invitation
      user = new User({
        clerkId,
        email,
        name: name || email.split('@')[0],
        profileImage,
        role: 'admin', // Will be changed to 'developer' when accepting invitation
      });

      try {
        await user.save();
        console.log('[Clerk Sync] User created successfully:', user._id);
      } catch (saveError: any) {
        // Handle duplicate key errors
        if (saveError.code === 11000) {
          console.error('[Clerk Sync] Duplicate user detected:', saveError.message);
          // Try to find existing user by email
          user = await User.findOne({ email });
          if (user && user.clerkId !== clerkId) {
            // Email exists with different Clerk ID
            return res.status(409).json({
              message: 'Email already registered with different authentication method',
              code: 'EMAIL_EXISTS'
            });
          }
        } else {
          throw saveError;
        }
      }

      // Only create team if user doesn't have a pending invitation
      if (!pendingInvitation && user) {
        console.log('[Clerk Sync] Creating team for new user');
        const team = new Team({
          name: `${user.name}'s Team`,
          adminId: user._id,
          members: [user._id],
        });
        await team.save();

        // Link user to team
        user.teamId = team._id;
        await user.save();
        console.log('[Clerk Sync] Team created and linked:', team._id);
      }
    } else {
      console.log('[Clerk Sync] Updating existing user:', { clerkId, userId: user._id });
      let hasChanges = false;

      if (user.email !== email) {
        user.email = email;
        hasChanges = true;
      }

      // We DO NOT update profileImage OR name from sync as we want MongoDB to be the source of truth
      // for custom uploaded images and display names. This prevents overwriting custom data with stale Clerk data.

      if (hasChanges) {
        await user.save();
        console.log('[Clerk Sync] User updated');
      } else {
        console.log('[Clerk Sync] No changes needed');
      }
    }

    console.log(`🔄 Syncing user: ${clerkId}`);
    console.log(`   📊 Current subscription: plan=${user?.subscription?.plan || 'none'}, status=${user?.subscription?.status || 'none'}`);

    // Ensure user exists before responding
    if (!user) {
      console.error('[Clerk Sync] User became null unexpectedly');
      return res.status(500).json({
        message: 'User creation failed',
        code: 'USER_NOT_CREATED'
      });
    }

    // Clear any auth failure counters on successful sync
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
    console.error('[Clerk Sync] Error:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });

    res.status(500).json({
      message: 'Failed to sync user',
      code: 'SYNC_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



export const handleClerkWebhook = async (req: Request, res: Response) => {
  try {
    // Check if the request has the raw body captured
    if (!(req as any).rawBody) {
      return res.status(400).json({ message: 'Webhook Error: No raw body' });
    }

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
    }

    // Get the headers
    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ message: 'Error occured -- no svix headers' });
    }

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;

    // Attempt to verify the incoming webhook
    // If successful, the payload will be available from 'evt'
    // If the verification fails, throw an error
    try {
      evt = wh.verify((req as any).rawBody, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err: any) {
      console.log('Webhook failed to verify. Error:', err.message);
      return res.status(400).json({ message: 'Webhook verification failed' });
    }

    // Do something with the payload
    const { id } = evt.data;
    const eventType = evt.type;
    const data = evt.data;

    console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
    console.log('Webhook body:', data);

    switch (eventType) {
      case 'user.created':
        try {
          const userEmail = data.email_addresses[0]?.email_address || '';

          // Check if user has a pending invitation
          const pendingInvitation = await Invitation.findOne({
            email: userEmail.toLowerCase(),
            status: 'pending',
            expiresAt: { $gt: new Date() },
          });

          const newUser = await User.create({
            clerkId: data.id,
            email: userEmail,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
            profileImage: data.image_url,
            role: 'admin', // Will be changed to 'developer' when accepting invitation
          });

          // Only create team if user doesn't have a pending invitation
          if (!pendingInvitation) {
            const team = new Team({
              name: `${newUser.name}'s Team`,
              adminId: newUser._id,
              members: [newUser._id],
            });
            await team.save();

            // Link user to team
            newUser.teamId = team._id;
            await newUser.save();
          }
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
