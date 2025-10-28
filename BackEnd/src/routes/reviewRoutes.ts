import express from 'express';
import {
  createReview,
  getAllReviews,
  getRepositoryReviews,
  getReviewById,
  updateReview,
  getUserReviews,
  getReviewStats,
} from '../controllers/reviewController';
import { createReviewLimiter } from '../config/rateLimiter';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// POST /api/reviews - Create new review
router.post('/', authenticate, createReviewLimiter, createReview);

// GET /api/reviews - Get all reviews
router.get('/', getAllReviews);

// GET /api/reviews/stats - Get review statistics
router.get('/stats', getReviewStats);

// GET /api/reviews/repository/:repositoryId - Get repository reviews
router.get('/repository/:repositoryId', getRepositoryReviews);

// GET /api/reviews/user/:userId - Get user reviews
router.get('/user/:userId', getUserReviews);

// GET /api/reviews/:id - Get single review
router.get('/:id', getReviewById);

// PUT /api/reviews/:id - Update review
router.put('/:id', updateReview);

export default router;