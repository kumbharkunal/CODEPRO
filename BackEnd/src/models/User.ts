import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/user.interface';

const UserSchema: Schema = new Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        profileImage: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            enum: ['admin', 'developer'],
            default: 'admin',
        },
        teamId: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
            required: false, // Will be set after team creation
        },
        repositories: {
            type: [String],
            default: [],
        },
        subscription: {
            plan: {
                type: String,
                enum: ['free', 'pro', 'enterprise'],
                default: 'free',
            },
            stripeCustomerId: {
                type: String,
            },
            stripeSubscriptionId: {
                type: String,
            },
            stripePriceId: {
                type: String,
            },
            status: {
                type: String,
                enum: ['active', 'canceled', 'past_due', 'trialing'],
                default: 'active',
            },
            currentPeriodEnd: {
                type: Date,
            },
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<IUser>('User', UserSchema);

export default User;