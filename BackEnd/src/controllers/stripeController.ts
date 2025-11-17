import { Request, Response } from 'express';
import { stripe, createStripeCustomer, createCheckoutSession, createPortalSession } from '../config/stripe';
import User from '../models/User';
import mongoose from 'mongoose';
import { IUser } from '../types/user.interface';

// Helper function to find user by ID or Clerk ID
const findUserByIdOrClerkId = async (userId: string): Promise<IUser | null> => {
  // Check if userId is a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(userId)) {
    const user = await User.findById(userId);
    if (user) return user;
  }
  
  // If not found by _id, try finding by clerkId
  return await User.findOne({ clerkId: userId });
};

// Create checkout session for subscription
export const createSubscriptionCheckout = async (req: Request, res: Response) => {
  try {
    const { userId, priceId, plan } = req.body;

    // Get user (by MongoDB _id or Clerk ID)
    const user = await findUserByIdOrClerkId(userId);
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
        userId: (user._id as mongoose.Types.ObjectId).toString(),
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

    const user = await findUserByIdOrClerkId(userId);
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

    const user = await findUserByIdOrClerkId(userId);
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

  const user = await findUserByIdOrClerkId(userId);
  if (!user) {
    console.error(`❌ User not found: ${userId}`);
    return;
  }

  try {
    // If subscription was created, fetch full subscription details
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Map plan to valid enum values
      const validPlan = (plan === 'pro' || plan === 'enterprise') ? plan : 'free';
      user.subscription.plan = validPlan;
      user.subscription.stripeSubscriptionId = subscription.id;
      user.subscription.stripePriceId = subscription.items.data[0]?.price.id;
      
      // Map Stripe status to our enum values
      const stripeStatus = subscription.status;
      if (stripeStatus === 'active' || stripeStatus === 'trialing') {
        user.subscription.status = 'active';
      } else if (stripeStatus === 'canceled') {
        user.subscription.status = 'canceled';
      } else if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
        user.subscription.status = 'past_due';
      } else {
        // Default to active for other statuses like incomplete_expired, paused, etc.
        user.subscription.status = 'active';
      }
      
      user.subscription.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
      
      // Ensure customer ID is set
      if (!user.subscription.stripeCustomerId && subscription.customer) {
        user.subscription.stripeCustomerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;
      }
    } else {
      // Fallback if no subscription ID (shouldn't happen but handle gracefully)
      const validPlan = (plan === 'pro' || plan === 'enterprise') ? plan : 'free';
      user.subscription.plan = validPlan;
      user.subscription.status = 'active';
    }

    await user.save();

    console.log(`✅ Subscription activated for user ${userId}: ${plan}`);
    console.log(`   - Subscription ID: ${user.subscription.stripeSubscriptionId}`);
    console.log(`   - Status: ${user.subscription.status}`);
    console.log(`   - Period End: ${user.subscription.currentPeriodEnd}`);
  } catch (error: any) {
    console.error(`❌ Error handling checkout complete: ${error.message}`);
    // Still save basic info even if Stripe fetch fails
    user.subscription.plan = plan;
    user.subscription.stripeSubscriptionId = session.subscription;
    user.subscription.status = 'active';
    await user.save();
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: any) {
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (!user) {
    console.error(`❌ User not found for subscription: ${subscription.id}`);
    return;
  }

  try {
    // Map Stripe status to our enum values
    const stripeStatus = subscription.status;
    if (stripeStatus === 'active' || stripeStatus === 'trialing') {
      user.subscription.status = 'active';
    } else if (stripeStatus === 'canceled') {
      user.subscription.status = 'canceled';
    } else if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
      user.subscription.status = 'past_due';
    } else {
      // Default to active for other statuses
      user.subscription.status = 'active';
    }
    
    user.subscription.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
    
    // Update price ID if changed
    if (subscription.items?.data?.[0]?.price?.id) {
      user.subscription.stripePriceId = subscription.items.data[0].price.id;
    }
    
    // Update plan based on price ID if available
    const priceId = user.subscription.stripePriceId || subscription.items?.data?.[0]?.price?.id;
    if (priceId) {
      // Map price IDs to plans (adjust based on your Stripe price IDs)
      const priceIdToPlan: { [key: string]: 'pro' | 'enterprise' } = {
        [process.env.STRIPE_PRICE_ID_PRO || '']: 'pro',
        [process.env.STRIPE_PRICE_ID_ENTERPRISE || '']: 'enterprise',
      };
      
      const mappedPlan = priceIdToPlan[priceId];
      if (mappedPlan === 'pro' || mappedPlan === 'enterprise') {
        user.subscription.plan = mappedPlan;
      }
    }

    await user.save();

    console.log(`✅ Subscription updated for user ${user._id}`);
    console.log(`   - Status: ${user.subscription.status}`);
    console.log(`   - Plan: ${user.subscription.plan}`);
  } catch (error: any) {
    console.error(`❌ Error updating subscription: ${error.message}`);
  }
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