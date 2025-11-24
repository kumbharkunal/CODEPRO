import express from 'express';
import {
  createReview,
  getAllReviews,
  getRepositoryReviews,
  getReviewById,
  updateReview,
  getUserReviews,
  getReviewStats,
  deleteReview,
} from '../controllers/reviewController';
import { createReviewLimiter } from '../config/rateLimiter';
import { authenticateClerk, authorize, requireTeamAccess, requireTeamOwnership } from '../middlewares/auth';
import Repository from '../models/Repository';
import { getIO } from '../config/socket';

import { validate } from '../middlewares/validate';
import { createReviewSchema } from '../utils/validators';

const router = express.Router();

// POST /api/reviews - Create new review (ADMIN ONLY, TEAM-SCOPED)
router.post('/', authenticateClerk, authorize(['admin']), requireTeamAccess, validate(createReviewSchema), createReviewLimiter, createReview);

// GET /api/reviews - Get all reviews (TEAM-SCOPED)
router.get('/', authenticateClerk, requireTeamAccess, getAllReviews);

// GET /api/reviews/stats - Get review statistics (TEAM-SCOPED)
router.get('/stats', authenticateClerk, requireTeamAccess, getReviewStats);

// GET /api/reviews/repository/:repositoryId - Get repository reviews (TEAM-SCOPED)
router.get('/repository/:repositoryId', authenticateClerk, requireTeamAccess, getRepositoryReviews);

// GET /api/reviews/user/:userId - Get user reviews (TEAM-SCOPED)
router.get('/user/:userId', authenticateClerk, requireTeamAccess, getUserReviews);

// GET /api/reviews/:id - Get single review (TEAM-SCOPED)
router.get('/:id', authenticateClerk, requireTeamAccess, getReviewById);

// PUT /api/reviews/:id - Update review (ADMIN ONLY, TEAM-SCOPED) - CRITICAL SECURITY FIX
router.put('/:id', authenticateClerk, authorize(['admin']), requireTeamAccess, updateReview);

// DELETE /api/reviews/:id - Delete review (ADMIN ONLY, TEAM-SCOPED)
router.delete('/:id', authenticateClerk, authorize(['admin']), requireTeamOwnership('review'), deleteReview);

// POST /api/reviews/test-ai - Test AI review (development only)
// if (process.env.NODE_ENV === 'development') {
router.post('/test-ai', authenticateClerk, async (req: any, res: any) => {
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
router.post('/manual-trigger', authenticateClerk, async (req: any, res: any) => {
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
        connectedBy: req.user._id,
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

// POST /api/reviews/test-notification - Test WebSocket notification
// router.post('/test-notification', authenticateClerk, async (req: any, res: any) => {
//   try {
//     const io = getIO();
//     const userId = req.user._id.toString();
//     const roomName = `user_${userId}`;

//     console.log(`\n🧪 ===== WEBSOCKET TEST =====`);
//     console.log(`User ID: ${userId}`);
//     console.log(`Room Name: ${roomName}`);
//     console.log(`Emitting to room...`);

//     // Check if room exists
//     const room = io.sockets.adapter.rooms.get(roomName);
//     console.log(`Room exists: ${!!room}`);
//     console.log(`Clients in room: ${room ? room.size : 0}`);

//     // Emit test event
//     io.to(roomName).emit('review-created', {
//       reviewId: 'test-123',
//       pullRequestNumber: 999,
//       pullRequestTitle: 'Test PR from Backend',
//       status: 'pending',
//       timestamp: new Date().toISOString(),
//     });

//     console.log(`✅ Event emitted to ${roomName}`);
//     console.log(`🧪 ===== END TEST =====\n`);

//     res.json({
//       success: true,
//       message: 'WebSocket event emitted',
//       userId,
//       roomName,
//       clientsInRoom: room ? room.size : 0
//     });
//   } catch (error: any) {
//     console.error('❌ Test error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

export default router;