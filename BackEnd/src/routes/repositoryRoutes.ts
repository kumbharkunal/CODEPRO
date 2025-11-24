import express from 'express';
import {
  createRepository,
  getAllRepositories,
  getUserRepositories,
  getRepositoryById,
  deleteRepository,
} from '../controllers/repositoryController';
import { authenticateClerk, authorize, requireTeamAccess, requireTeamOwnership } from '../middlewares/auth';

import { validate } from '../middlewares/validate';
import { createRepositorySchema } from '../utils/validators';

const router = express.Router();

// POST /api/repositories - Connect new repository (ADMIN ONLY, TEAM-SCOPED)
router.post('/', authenticateClerk, authorize(['admin']), requireTeamAccess, validate(createRepositorySchema), createRepository);

// GET /api/repositories - Get all repositories (TEAM-SCOPED)
router.get('/', authenticateClerk, requireTeamAccess, getAllRepositories);

// GET /api/repositories/user/:userId - Get user's repositories (TEAM-SCOPED)
router.get('/user/:userId', authenticateClerk, requireTeamAccess, getUserRepositories);

// GET /api/repositories/:id - Get single repository (TEAM-SCOPED)
router.get('/:id', authenticateClerk, requireTeamAccess, getRepositoryById);

// DELETE /api/repositories/:id - Disconnect repository (ADMIN ONLY, TEAM-SCOPED)
router.delete('/:id', authenticateClerk, authorize(['admin']), requireTeamOwnership('repository'), deleteRepository);

export default router;
