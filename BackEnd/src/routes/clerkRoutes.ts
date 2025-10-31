import express from 'express';
import { syncClerkUser, handleClerkWebhook } from '../controllers/clerkController';

const router = express.Router();

// POST /api/clerk/sync - Sync Clerk user with database
router.post('/sync', syncClerkUser);

// POST /api/clerk/webhook - Clerk webhook events
router.post('/webhook', handleClerkWebhook);

export default router;