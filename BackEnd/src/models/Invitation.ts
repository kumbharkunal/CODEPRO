import mongoose, { Schema } from 'mongoose';
import { IInvitation } from '../types/invitation.interface';

const InvitationSchema: Schema = new Schema(
    {
        teamId: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
            required: true,
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
        },
        role: {
            type: String,
            enum: ['developer'],
            default: 'developer',
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'expired'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster lookups
InvitationSchema.index({ token: 1 });
InvitationSchema.index({ teamId: 1, email: 1 });
InvitationSchema.index({ status: 1, expiresAt: 1 });

const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);

export default Invitation;
