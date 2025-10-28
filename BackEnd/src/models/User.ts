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
            enum: ['admin', 'developer', 'viewer'],
            default: 'viewer',
        },
        repositories: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<IUser>('User', UserSchema);

export default User;