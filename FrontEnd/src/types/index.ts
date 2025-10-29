export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  profileImage?: string;
  role: 'admin' | 'developer' | 'viewer';
  repositories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Repository {
  _id: string;
  githubRepoId: number;
  name: string;
  fullName: string;
  owner: string;
  description?: string;
  isPrivate: boolean;
  defaultBranch: string;
  webhookId?: number;
  webhookActive: boolean;
  connectedBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'bug' | 'security' | 'performance' | 'style' | 'best-practice';
  title: string;
  description: string;
  suggestion?: string;
  codeSnippet?: string;
}

export interface Review {
  _id: string;
  repositoryId: Repository | string;
  pullRequestNumber: number;
  pullRequestTitle: string;
  pullRequestUrl: string;
  author: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  filesAnalyzed: number;
  issuesFound: number;
  findings: Finding[];
  summary: string;
  qualityScore?: number;
  reviewedBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  inProgressReviews: number;
  avgQualityScore: number;
  totalIssues: number;
}