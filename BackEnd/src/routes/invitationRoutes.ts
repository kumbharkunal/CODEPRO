import express from 'express';
import {
  createInvitation,
  getTeamInvitations,
  acceptInvitation,
  revokeInvitation,
  getInvitationByToken,
} from '../controllers/invitationController';
import { authenticateClerk, authorize, requireTeamAccess } from '../middlewares/auth';

const router = express.Router();

// POST /api/invitations - Create in invitation (admin only)
router.post('/', authenticateClerk, authorize(['admin']), requireTeamAccess, createInvitation);

// GET /api/invitations - Get team's invitations (admin only)
router.get('/', authenticateClerk, authorize(['admin']), requireTeamAccess, getTeamInvitations);

// GET /api/invitations/token/:token - Get invitation details by token (public - no auth needed)
router.get('/token/:token', getInvitationByToken);

// POST /api/invitations/:token/accept - Accept invitation (requires auth but not team)
router.post('/:token/accept', authenticateClerk, acceptInvitation);

// DELETE /api/invitations/:id - Revoke invitation (admin only)
router.delete('/:id', authenticateClerk, authorize(['admin']), requireTeamAccess, revokeInvitation);

export default router;
