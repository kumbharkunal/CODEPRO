import mongoose, { Schema } from "mongoose";
import { IRepository } from "../types/repository.interface";
import { required } from "zod/v4/core/util.cjs";

const RepositorySchema: Schema = new Schema(
    {
        githubRepoId: {
            type: Number,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
            unique: true,
        },
        owner: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        defaultBranch: {
            type: String,
            default: 'main',
        },
        webhookId: {
            type: Number,
            default: false,
        },
        webhookActive: {
            type: Boolean,
            default: false,
        },
        connectedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        githubAccessToken: {
            type: String,
            required: true,
            select: false,
        }
    },
    {
        timestamps: true,
    }
);

const Repository = mongoose.model<IRepository>('Repository', RepositorySchema);

export default Repository;