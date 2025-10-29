import express from 'express';
import { handleGitHubWebhook } from '../controllers/webhookController';

const router = express.Router();

// POST /api/webhook/github - Receive GitHub webhooks
router.post('/github', express.raw({ type: 'application/json' }), handleGitHubWebhook);

export default router;