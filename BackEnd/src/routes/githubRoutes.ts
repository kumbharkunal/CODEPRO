import express from 'express';
import {
  githubCallback,
  getUserGitHubRepos,
  connectRepository,
  disconnectRepository,
} from '../controllers/githubController';
import { authenticateClerk } from '../middlewares/auth';

const router = express.Router();

// POST /api/github/callback - Exchange code for token
router.post('/callback', githubCallback);

// POST /api/github/repos - Get user's GitHub repositories
router.post('/repos', getUserGitHubRepos);

// POST /api/github/connect - Connect repository
router.post('/connect', authenticateClerk, connectRepository);

// DELETE /api/github/disconnect/:id - Disconnect repository
router.delete('/disconnect/:id', authenticateClerk, disconnectRepository);

export default router;