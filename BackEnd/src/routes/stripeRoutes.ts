import express from 'express';
import {
  createSubscriptionCheckout,
  createCustomerPortal,
  getSubscriptionStatus,
  handleStripeWebhook,
} from '../controllers/stripeController';
import { authenticateClerk } from '../middlewares/auth';

const router = express.Router();

// POST /api/stripe/create-checkout - Create checkout session
router.post('/create-checkout', authenticateClerk, createSubscriptionCheckout);

// POST /api/stripe/create-portal - Create customer portal
router.post('/create-portal', authenticateClerk, createCustomerPortal);

// GET /api/stripe/subscription/:userId - Get subscription status
router.get('/subscription/:userId', authenticateClerk, getSubscriptionStatus);

// POST /api/stripe/webhook - Stripe webhook (raw body!)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;