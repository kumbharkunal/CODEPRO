import { Request, Response } from 'express';
import { verifyGitHubSignature } from '../utils/webhookVerification';
import Review from '../models/Review';
import Repository from '../models/Repository';
import { getIO } from '../config/socket';

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
        });

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
            const userId = dbRepository.connectedBy.toString();

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

        // TODO: Trigger AI review process (will implement with Gemini)
        // For now, review stays in 'pending' status

    } catch (error) {
        console.error('Error handling pull request event:', error);
    }
};