import express from 'express';
import { syncClerkUser, handleClerkWebhook } from '../controllers/clerkController';
import { authenticateClerk } from '../middlewares/auth';

const router = express.Router();

router.post('/sync', syncClerkUser);
router.post('/webhook', handleClerkWebhook);

export default router;
