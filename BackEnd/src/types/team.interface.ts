import { Document, Types } from 'mongoose';

export interface ITeam extends Document {
    _id: Types.ObjectId;
    name: string;
    adminId: Types.ObjectId;
    members: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
