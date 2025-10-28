import { Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  name: string;
  profileImage?: string;
  role: 'admin' | 'developer' | 'viewer';
  repositories: string[];
  createdAt: Date;
  updatedAt: Date;
}