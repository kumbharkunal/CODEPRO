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
import Repository from '../models/Repository';

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

// POST /api/reviews/test-ai - Test AI review (development only)
// if (process.env.NODE_ENV === 'development') {
  router.post('/test-ai', authenticate, async (req: any, res: any) => {
    try {
      const { code, fileName } = req.body;
      
      const { analyzeCode } = require('../config/gemini');
      const result = await analyzeCode(code, fileName, 'Test PR');
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Test AI error:', error);
      res.status(500).json({ message: 'AI test failed' });
    }
  });
// }

// POST /api/reviews/manual-trigger - Manually trigger review (development)
// if (process.env.NODE_ENV === 'development') {
  router.post('/manual-trigger', authenticate, async (req: any, res: any) => {
    try {
      const { owner, repo, pullNumber } = req.body;
      
      // Simulate webhook payload
      const mockPayload = {
        action: 'opened',
        pull_request: {
          number: pullNumber,
          title: 'Test PR',
          html_url: `https://github.com/${owner}/${repo}/pull/${pullNumber}`,
          user: { login: 'test-user' },
          head: { sha: 'main' },
          body: 'Test PR for AI review',
        },
        repository: {
          id: 999999,
          name: repo,
          full_name: `${owner}/${repo}`,
          owner: { login: owner },
        },
      };

      // Create test repository if doesn't exist
      let dbRepo = await Repository.findOne({ githubRepoId: 999999 });
      if (!dbRepo) {
        dbRepo = new Repository({
          githubRepoId: 999999,
          name: repo,
          fullName: `${owner}/${repo}`,
          owner: owner,
          defaultBranch: 'main',
          connectedBy: req.user.userId,
          isPrivate: false,
        });
        await dbRepo.save();
      }

      // Import webhook handler
      const { handleGitHubWebhook } = require('../controllers/webhookController');
      
      // Create mock request
      const mockReq = {
        body: mockPayload,
        headers: {
          'x-github-event': 'pull_request',
          'x-hub-signature-256': 'sha256=test',
        },
      };

      res.status(200).json({ 
        message: 'Manual review triggered',
        note: 'Check logs for progress'
      });

      // Process in background (webhook simulation won't verify signature)
      // You'll need to call processPullRequestReview directly in real test

    } catch (error) {
      console.error('Manual trigger error:', error);
      res.status(500).json({ message: 'Failed to trigger review' });
    }
  });
// }

export default router;