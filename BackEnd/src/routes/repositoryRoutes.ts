import express from 'express';
import {
  createRepository,
  getAllRepositories,
  getUserRepositories,
  getRepositoryById,
  deleteRepository,
} from '../controllers/repositoryController';
import { authenticateClerk, authorize } from '../middlewares/auth';

const router = express.Router();

// POST /api/repositories - Connect new repository
router.post('/', authenticateClerk, createRepository);

// GET /api/repositories - Get all repositories
router.get('/', authenticateClerk, getAllRepositories);

// GET /api/repositories/user/:userId - Get user's repositories
router.get('/user/:userId', authenticateClerk, getUserRepositories);

// GET /api/repositories/:id - Get single repository
router.get('/:id', authenticateClerk, getRepositoryById);

// DELETE /api/repositories/:id - Disconnect repository
router.delete('/:id', authenticateClerk, authorize('admin', 'developer'), deleteRepository);

export default router;