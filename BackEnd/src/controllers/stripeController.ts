import { Request, Response } from 'express';
import { stripe, createStripeCustomer, createCheckoutSession, createPortalSession } from '../config/stripe';
import User from '../models/User';

// Create checkout session for subscription
export const createSubscriptionCheckout = async (req: Request, res: Response) => {
  try {
    const { userId, priceId, plan } = req.body;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create Stripe customer if doesn't exist
    let customerId = user.subscription.stripeCustomerId;

    if (!customerId) {
      const customer = await createStripeCustomer(user.email, user.name);
      customerId = customer.id;

      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      priceId,
      `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.FRONTEND_URL}/pricing`,
      {
        userId: user.id.toString(),
        plan,
      }
    );

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
};

// Create portal session for managing subscription
export const createCustomerPortal = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.subscription.stripeCustomerId) {
      return res.status(400).json({ message: 'No subscription found' });
    }

    const session = await createPortalSession(
      user.subscription.stripeCustomerId,
      `${process.env.FRONTEND_URL}/settings`
    );

    res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ message: 'Failed to create portal session' });
  }
};

// Get subscription status
export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      plan: user.subscription.plan,
      status: user.subscription.status,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
};

// Webhook handler for Stripe events
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).json({ message: 'No signature' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    console.log(`✅ Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as any);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as any);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as any);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as any);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error.message);
    res.status(400).json({ message: `Webhook Error: ${error.message}` });
  }
};

// Handle checkout completed
async function handleCheckoutComplete(session: any) {
  const userId = session.metadata.userId;
  const plan = session.metadata.plan;

  const user = await User.findById(userId);
  if (!user) return;

  user.subscription.plan = plan;
  user.subscription.stripeSubscriptionId = session.subscription;
  user.subscription.status = 'active';

  await user.save();

  console.log(`✅ Subscription activated for user ${userId}: ${plan}`);
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: any) {
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (!user) return;

  user.subscription.status = subscription.status;
  user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await user.save();

  console.log(`✅ Subscription updated for user ${user._id}`);
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: any) {
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (!user) return;

  user.subscription.plan = 'free';
  user.subscription.status = 'canceled';
  user.subscription.stripeSubscriptionId = undefined;

  await user.save();

  console.log(`✅ Subscription canceled for user ${user._id}`);
}

// Handle payment failed
async function handlePaymentFailed(invoice: any) {
  const user = await User.findOne({
    'subscription.stripeCustomerId': invoice.customer,
  });

  if (!user) return;

  user.subscription.status = 'past_due';
  await user.save();

  console.log(`⚠️ Payment failed for user ${user._id}`);
}