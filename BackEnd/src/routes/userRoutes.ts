import express, { Response } from 'express';
import { createUser, getAllUsers, getUserById, updateUserRole, updateUserProfile } from '../controllers/userController';
import { validate } from '../middlewares/validate';
import { updateUserSchema, updateRoleSchema } from '../utils/validators';
import { createUserSchema } from '../utils/validators';
import { authenticateClerk, authorize, requireTeamAccess, AuthRequest } from '../middlewares/auth';
import User from '../models/User';

const router = express.Router();

// POST /api/users - Create new user (public - for initial signup)
router.post('/', validate(createUserSchema), createUser);

// GET /api/users/me - Get current authenticated user
router.get('/me', authenticateClerk, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id).select('-__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/users - Get all users (ADMIN ONLY, TEAM-SCOPED)
router.get('/', authenticateClerk, authorize(['admin']), requireTeamAccess, getAllUsers);

// PUT /api/users/:id - Update user profile (ALL AUTHENTICATED USERS - own profile only)
router.put('/:id', authenticateClerk, validate(updateUserSchema), updateUserProfile);

// PATCH /api/users/:id/role - Update user role (ADMIN ONLY, TEAM-SCOPED)
router.put('/:id/role', authenticateClerk, authorize(['admin']), validate(updateRoleSchema), updateUserRole);

// GET /api/users/:id - Get user by ID (authenticated)
router.get('/:id', authenticateClerk, getUserById);

export default router;
