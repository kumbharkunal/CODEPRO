import { Request, Response } from 'express';
import Team from '../models/Team';
import User from '../models/User';

// Get current user's team
export const getMyTeam = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(404).json({ message: 'User is not part of any team' });
    }

    const team = await Team.findById(teamId)
      .populate('adminId', 'name email profileImage')
      .populate('members', 'name email profileImage role');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update team name (admin only)
export const updateTeam = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const teamId = req.user.teamId;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verify user is the admin
    if (team.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only team admin can update team details' });
    }

    team.name = name.trim();
    await team.save();

    res.status(200).json({ message: 'Team updated successfully', team });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team members
export const getTeamMembers = async (req: any, res: Response) => {
  try {
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(404).json({ message: 'User is not part of any team' });
    }

    const members = await User.find({ teamId })
      .select('name email profileImage role createdAt')
      .sort({ createdAt: 1 });

    res.status(200).json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove member from team (admin only)
export const removeMember = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const teamId = req.user.teamId;
    const { memberId } = req.params;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verify user is the admin
    if (team.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only team admin can remove members' });
    }

    // Cannot remove admin
    if (memberId === userId.toString()) {
      return res.status(400).json({ message: 'Team admin cannot remove themselves' });
    }

    const member = await User.findById(memberId);

    if (!member || member.teamId?.toString() !== teamId.toString()) {
      return res.status(404).json({ message: 'Member not found in this team' });
    }

    // Remove member from team
    member.teamId = undefined;
    await member.save();

    // Remove from team members array
    team.members = team.members.filter(m => m.toString() !== memberId);
    await team.save();

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
