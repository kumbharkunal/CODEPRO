import mongoose, { Schema } from 'mongoose';
import { ITeam } from '../types/team.interface';

const TeamSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        adminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

const Team = mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
