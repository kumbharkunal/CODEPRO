import express from 'express';
import {
  getMyTeam,
  updateTeam,
  getTeamMembers,
  removeMember,
} from '../controllers/teamController';
import { authenticateClerk, authorize, requireTeamAccess } from '../middlewares/auth';

const router = express.Router();

// GET /api/team - Get current user's team
router.get('/', authenticateClerk, requireTeamAccess, getMyTeam);

// PATCH /api/team - Update team name (admin only)
router.patch('/', authenticateClerk, authorize(['admin']), requireTeamAccess, updateTeam);

// GET /api/team/members - Get team members
router.get('/members', authenticateClerk, authorize(['admin']), requireTeamAccess, getTeamMembers);

// DELETE /api/team/members/:userId - Remove member (admin only)
router.delete('/members/:userId', authenticateClerk, authorize(['admin']), requireTeamAccess, removeMember);

export default router;
