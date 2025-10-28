import express from 'express';
import {
  createRepository,
  getAllRepositories,
  getUserRepositories,
  getRepositoryById,
  deleteRepository,
} from '../controllers/repositoryController';

const router = express.Router();

// POST /api/repositories - Connect new repository
router.post('/', createRepository);

// GET /api/repositories - Get all repositories
router.get('/', getAllRepositories);

// GET /api/repositories/user/:userId - Get user's repositories
router.get('/user/:userId', getUserRepositories);

// GET /api/repositories/:id - Get single repository
router.get('/:id', getRepositoryById);

// DELETE /api/repositories/:id - Disconnect repository
router.delete('/:id', deleteRepository);

export default router;