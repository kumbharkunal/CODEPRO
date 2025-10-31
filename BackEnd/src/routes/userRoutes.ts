import express from 'express';
import { createUser, getAllUsers, getUserById } from '../controllers/userController';
import { validate } from '../middlewares/validate';
import { createUserSchema } from '../utils/validators';
import { authenticateClerk, authorize } from '../middlewares/auth';

const router = express.Router();

// POST /api/users - Create new user
router.post('/', validate(createUserSchema), createUser);

// GET /api/users - Get all users
router.get('/', authenticateClerk, authorize('admin'), getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateClerk, getUserById);

export default router;