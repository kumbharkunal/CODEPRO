import express from 'express';
import {
  createRepository,
  getAllRepositories,
  getUserRepositories,
  getRepositoryById,
  deleteRepository,
} from '../controllers/repositoryController';
import { authenticate, authorize } from '../middlewares/auth';

const router = express.Router();

// POST /api/repositories - Connect new repository
router.post('/', authenticate, createRepository);

// GET /api/repositories - Get all repositories
router.get('/', authenticate, getAllRepositories);

// GET /api/repositories/user/:userId - Get user's repositories
router.get('/user/:userId', authenticate, getUserRepositories);

// GET /api/repositories/:id - Get single repository
router.get('/:id', authenticate, getRepositoryById);

// DELETE /api/repositories/:id - Disconnect repository
router.delete('/:id', authenticate, authorize('admin', 'developer'), deleteRepository);

export default router;