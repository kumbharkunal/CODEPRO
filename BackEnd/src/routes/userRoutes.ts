import express from 'express';
import { createUser, getAllUsers, getUserById, updateUserRole, deleteUser } from '../controllers/userController';
import { validate } from '../middlewares/validate';
import { createUserSchema } from '../utils/validators';
import { authenticateClerk, authorize } from '../middlewares/auth';

const router = express.Router();

// POST /api/users - Create new user (Admin only - or via Clerk webhook)
// Note: User creation should primarily happen via Clerk webhooks
// This endpoint is kept for admin manual user creation if needed
router.post('/', authenticateClerk, authorize('admin'), validate(createUserSchema), createUser);

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateClerk, authorize('admin'), getAllUsers);

// GET /api/users/:id - Get user by ID (Admin only, or own profile)
router.get('/:id', authenticateClerk, getUserById);

// PUT /api/users/:id/role - Update user role (Admin only)
router.put('/:id/role', authenticateClerk, authorize('admin'), updateUserRole);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticateClerk, authorize('admin'), deleteUser);

export default router;