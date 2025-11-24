import { Request, Response } from 'express';
import crypto from 'crypto';
import Invitation from '../models/Invitation';
import Team from '../models/Team';
import User from '../models/User';

// Create invitation (admin only)
export const createInvitation = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const teamId = req.user.teamId;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can send invitations' });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.teamId?.toString() === teamId.toString()) {
        return res.status(400).json({ message: 'User is already a member of this team' });
      } else if (existingUser.teamId) {
        return res.status(400).json({ message: 'User is already a member of another team' });
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      teamId,
      email: normalizedEmail,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      return res.status(400).json({ 
        message: 'An active invitation already exists for this email',
        invitation: existingInvitation 
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = new Invitation({
      teamId,
      invitedBy: userId,
      email: normalizedEmail,
      role: 'developer',
      token,
      status: 'pending',
      expiresAt,
    });

    await invitation.save();

    // Populate invitation details
    await invitation.populate('invitedBy', 'name email');
    await invitation.populate('teamId', 'name');

    // TODO: Send invitation email here
    // Example: await sendInvitationEmail(normalizedEmail, token, team.name);

    res.status(201).json({
      message: 'Invitation created successfully',
      invitation,
      invitationLink: `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all invitations for user's team (admin only)
export const getTeamInvitations = async (req: any, res: Response) => {
  try {
    const teamId = req.user.teamId;

    const invitations = await Invitation.find({ teamId })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept invitation
export const acceptInvitation = async (req: any, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email;

    if (!token) {
      return res.status(400).json({ message: 'Invitation token is required' });
    }

    const invitation = await Invitation.findOne({ token }).populate('teamId');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        message: 'This invitation has already been used',
        status: invitation.status 
      });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'This invitation has expired' });
    }

    // Verify email matches
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ 
        message: 'This invitation was sent to a different email address' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already in a team (and it's a different team)
    if (user.teamId) {
      // Allow if they're trying to join the same team (edge case)
      if (user.teamId.toString() === invitation.teamId.toString()) {
        return res.status(400).json({ message: 'You are already a member of this team' });
      }
      return res.status(400).json({ message: 'You are already a member of another team' });
    }

    const team = await Team.findById(invitation.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Update user
    user.role = 'developer';
    user.teamId = team._id;
    await user.save();

    // Add user to team members
    if (!team.members.includes(user._id as any)) {
      team.members.push(user._id as any);
      await team.save();
    }

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    res.status(200).json({
      message: 'Invitation accepted successfully',
      team: {
        id: team._id,
        name: team.name,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Revoke invitation (admin only)
export const revokeInvitation = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const teamId = req.user.teamId;
    const { id } = req.params;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Verify invitation belongs to user's team
    if (invitation.teamId.toString() !== teamId.toString()) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Delete the invitation
    await Invitation.findByIdAndDelete(id);

    res.status(200).json({ message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get invitation by token (public - for displaying invitation details before accepting)
export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate('teamId', 'name')
      .populate('invitedBy', 'name email');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      if (invitation.status === 'pending') {
        invitation.status = 'expired';
        await invitation.save();
      }
      return res.status(400).json({ message: 'This invitation has expired' });
    }

    // Don't expose the token in response
    const { token: _, ...invitationData } = invitation.toObject();

    res.status(200).json(invitationData);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
