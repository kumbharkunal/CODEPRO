import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  name: string;
  profileImage?: string;
  role: 'admin' | 'developer';
  teamId?: Types.ObjectId;
  repositories: string[];
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
