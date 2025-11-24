import { Document, Types } from 'mongoose';

export interface IInvitation extends Document {
    _id: Types.ObjectId;
    teamId: Types.ObjectId;
    invitedBy: Types.ObjectId;
    email: string;
    role: 'developer';
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
