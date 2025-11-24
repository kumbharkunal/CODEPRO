import mongoose, { Schema } from 'mongoose';
import { IReview } from '../types/review.interface';

const FindingSchema: Schema = new Schema({
    file: {
        type: String,
        required: true,
    },
    line: {
        type: Number,
        required: true,
    },
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low', 'info'],
        required: true,
    },
    category: {
        type: String,
        enum: ['bug', 'security', 'performance', 'style', 'best-practice', 'code-quality', 'logic', 'maintainability'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    suggestion: {
        type: String,
    },
    codeSnippet: {
        type: String,
    },
});

const ReviewSchema: Schema = new Schema(
    {
        repositoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Repository',
            required: true,
        },
        pullRequestNumber: {
            type: Number,
            required: true,
        },
        pullRequestTitle: {
            type: String,
            required: true,
        },
        pullRequestUrl: {
            type: String,
            required: true,
        },
        author: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'failed'],
            default: 'pending',
        },
        filesAnalyzed: {
            type: Number,
            default: 0,
        },
        issuesFound: {
            type: Number,
            default: 0,
        },
        findings: {
            type: [FindingSchema],
            default: [],
        },
        summary: {
            type: String,
            default: '',
        },
        qualityScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        teamId: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
            required: false, // For migration; will be required for new reviews
        },
    },
    {
        timestamps: true,
    }
);

const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;