import { Document } from "mongoose";

export interface IRepository extends Document {
    githubRepoId: number,
    name: string,
    fullName: string,
    owner: string,
    description?: string,
    isPrivate: boolean,
    defaultBranch: string,
    webhookId?: number,
    webhookActive: boolean,
    connectedBy: string,
    createdAt: Date,
    updatedAt: Date,
}