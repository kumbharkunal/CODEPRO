import express from 'express';
import { createUser, getAllUsers, getUserById } from '../controllers/userController';
import { validate } from '../middlewares/validate';
import { createUserSchema } from '../utils/validators';

const router = express.Router();

// POST /api/users - Create new user
router.post('/', validate(createUserSchema), createUser);

// GET /api/users - Get all users
router.get('/', getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

export default router;