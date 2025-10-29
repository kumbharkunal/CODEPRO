import { Request, Response } from 'express';
import { verifyGitHubSignature } from '../utils/webhookVerification';
import Review from '../models/Review';
import Repository from '../models/Repository';
import { getIO } from '../config/socket';
import { getPullRequestFiles, getFileContent } from '../config/github';
import { triggerAIReview } from '../controllers/reviewController';

export const handleGitHubWebhook = async (req: Request, res: Response) => {
    try {
        // Get signature from header
        const signature = req.headers['x-hub-signature-256'] as string;

        if (!signature) {
            return res.status(401).json({ message: 'No signature provided' });
        }

        // Verify signature
        const payload = JSON.stringify(req.body);
        const secret = process.env.GITHUB_WEBHOOK_SECRET as string;

        const isValid = verifyGitHubSignature(payload, signature, secret);

        if (!isValid) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ message: 'Invalid signature' });
        }

        // Get event type
        const event = req.headers['x-github-event'] as string;

        console.log(`GitHub webhook received: ${event}`);

        // Handle different events
        switch (event) {
            case 'pull_request':
                await handlePullRequestEvent(req.body);
                break;

            case 'ping':
                console.log('Ping event received - webhook is active');
                break;

            default:
                console.log(`Unhandled event type: ${event}`);
        }

        // Always respond 200 to acknowledge receipt
        res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Handle pull request events
const handlePullRequestEvent = async (payload: any) => {
    try {
        const action = payload.action;
        const pullRequest = payload.pull_request;
        const repository = payload.repository;

        console.log(`Pull request ${action}: ${pullRequest.title}`);

        // Only handle opened, reopened, and synchronize events
        if (!['opened', 'reopened', 'synchronize'].includes(action)) {
            console.log(`Ignoring action: ${action}`);
            return;
        }

        // Find repository in database
        const dbRepository = await Repository.findOne({
            githubRepoId: repository.id
        }).populate('connectedBy');

        if (!dbRepository) {
            console.log(`Repository not found in database: ${repository.full_name}`);
            return;
        }

        // Create review record
        const newReview = new Review({
            repositoryId: dbRepository._id,
            pullRequestNumber: pullRequest.number,
            pullRequestTitle: pullRequest.title,
            pullRequestUrl: pullRequest.html_url,
            author: pullRequest.user.login,
            reviewedBy: dbRepository.connectedBy,
            status: 'pending',
        });

        await newReview.save();

        console.log(`Review created for PR #${pullRequest.number}`);

        // Send WebSocket notification
        try {
            const io = getIO();
            const userId = dbRepository.connectedBy

            io.to(`user_${userId}`).emit('review-created', {
                reviewId: newReview._id,
                pullRequestTitle: pullRequest.title,
                pullRequestNumber: pullRequest.number,
                repository: repository.full_name,
                timestamp: new Date().toISOString(),
            });

            console.log(`WebSocket notification sent for new review`);
        } catch (socketError) {
            console.error('Error sending WebSocket notification:', socketError);
        }

        // Fetch PR files and trigger AI review (async, don't wait)
        processPullRequestReview(
            newReview.id,
            repository.owner.login,
            repository.name,
            pullRequest.number,
            pullRequest.head.sha,
            pullRequest.title + '\n\n' + (pullRequest.body || ''),
            process.env.GITHUB_TOKEN as string
        ).catch(error => {
            console.error('Error processing PR review:', error);
        });

    } catch (error) {
        console.error('Error handling pull request event:', error);
    }
};

// Process PR review (fetch files and analyze)
const processPullRequestReview = async (
    reviewId: string,
    owner: string,
    repo: string,
    pullNumber: number,
    commitSha: string,
    prContext: string,
    githubToken: string
) => {
    try {
        console.log(`Processing review ${reviewId}...`);

        // Fetch PR files
        const prFiles = await getPullRequestFiles(owner, repo, pullNumber, githubToken);
        console.log(`Found ${prFiles.length} code files to analyze`);

        if (prFiles.length === 0) {
            // No code files to review
            const review = await Review.findById(reviewId);
            if (review) {
                review.status = 'completed';
                review.summary = 'No code files to review';
                review.filesAnalyzed = 0;
                review.issuesFound = 0;
                review.qualityScore = 100;
                await review.save();
            }
            return;
        }

        // Fetch content of each file
        const filesWithContent: { name: string; content: string }[] = [];

        for (const file of prFiles.slice(0, 10)) { // Limit to 10 files for now
            try {
                const content = await getFileContent(
                    owner,
                    repo,
                    file.filename,
                    commitSha,
                    githubToken
                );

                if (content) {
                    filesWithContent.push({
                        name: file.filename,
                        content: content,
                    });
                }

                // Delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error fetching file ${file.filename}:`, error);
            }
        }

        console.log(`Fetched content for ${filesWithContent.length} files`);

        // Trigger AI review
        if (filesWithContent.length > 0) {
            await triggerAIReview(reviewId, filesWithContent, prContext);

            // Post review comment to GitHub
            try {
                const review = await Review.findById(reviewId);
                if (review && review.status === 'completed') {
                    const { postReviewComment, formatReviewAsMarkdown } = require('../config/github');
                    const markdown = formatReviewAsMarkdown(review);

                    await postReviewComment(owner, repo, pullNumber, markdown, githubToken);
                    console.log(`Posted AI review to GitHub PR #${pullNumber}`);
                }
            } catch (commentError) {
                console.error('Error posting review comment:', commentError);
            }
        }

    } catch (error) {
        console.error('Error processing PR review:', error);

        // Update review status to failed
        try {
            const review = await Review.findById(reviewId);
            if (review) {
                review.status = 'failed';
                review.summary = 'Failed to analyze PR files';
                await review.save();
            }
        } catch (updateError) {
            console.error('Error updating review status:', updateError);
        }
    }
};