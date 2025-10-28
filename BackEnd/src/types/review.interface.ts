import { Document } from "mongoose";

export interface IReview extends Document {
    respositoryId: string;
    pullRequestNumber: number;
    pullRequestTitle: string;
    pullRequestUrl: string;
    author: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    filesAnalyzed: number;
    issuesFound: number;
    findings: IFinding[];
    summary: string;
    qualityScore?: number;
    reviewedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFinding {
    file: string;
    line: number;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: 'bug' | 'security' | 'performance' | 'style' | 'best-practice';
    title: string;
    description: string;
    suggestion?: string;
    codeSnippet?: string;
}