import express from 'express';
import { login, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../config/rateLimiter';

const router = express.Router();

// POST /api/auth/login - Login user
router.post('/login', authLimiter, login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticate, getCurrentUser);

export default router;