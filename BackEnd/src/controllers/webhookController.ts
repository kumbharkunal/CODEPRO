import { Request, Response } from 'express';
import { verifyGitHubSignature } from '../utils/webhookVerification';
import Review from '../models/Review';
import Repository from '../models/Repository';
import { getIO } from '../config/socket';
import { getPullRequestFiles, getFileContent, postReviewComment, formatReviewAsMarkdown } from '../config/github';
import { analyzeMultipleFiles } from '../config/gemini';
import { any } from 'zod';

export const handleGitHubWebhook = async (req: Request, res: Response) => {
  try {
    // Get signature from header
    const signature = req.headers['x-hub-signature-256'] as string;

    if (!signature) {
      console.error('No signature provided');
      return res.status(401).json({ message: 'No signature provided' });
    }

    // Verify signature
    const payloadString = req.body.toString();
    const secret = process.env.GITHUB_WEBHOOK_SECRET as string;

    const isValid = verifyGitHubSignature(payloadString, signature, secret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // Get event type
    const event = req.headers['x-github-event'] as string;

    console.log(`✅ GitHub webhook received: ${event}`);

    const payloadObject = JSON.parse(payloadString);

    // Handle different events
    switch (event) {
      case 'pull_request':
        await handlePullRequestEvent(payloadObject);
        break;

      case 'ping':
        console.log('✅ Ping event received - webhook is active');
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event}`);
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Handle pull request events
const handlePullRequestEvent = async (payload: any) => {
  try {
    const action = payload.action;
    const pullRequest = payload.pull_request;
    const repository = payload.repository;

    console.log(`📋 Pull request ${action}: ${pullRequest.title}`);

    // Only handle opened, reopened, and synchronize events
    if (!['opened', 'reopened', 'synchronize'].includes(action)) {
      console.log(`⏭️ Ignoring action: ${action}`);
      return;
    }

    // Find repository in database - IMPORTANT: Select githubAccessToken
    const dbRepository = await Repository.findOne({
      githubRepoId: repository.id
    })
      .populate('connectedBy')
      .select('+githubAccessToken'); // ✅ FIX: Add this to get the token

    if (!dbRepository) {
      console.log(`⚠️ Repository not found in database: ${repository.full_name}`);
      return;
    }

    console.log(`✅ Found repository in database: ${dbRepository.name}`);

    // ✅ FIX: Extract user ID properly
    const connectedByUser = dbRepository.connectedBy as any;
    const userId = connectedByUser._id || connectedByUser;

    // Create review record
    const newReview = <any>new Review({
      repositoryId: dbRepository._id,
      pullRequestNumber: pullRequest.number,
      pullRequestTitle: pullRequest.title,
      pullRequestUrl: pullRequest.html_url,
      author: pullRequest.user.login,
      reviewedBy: userId, // ✅ FIX: Use extracted userId
      status: 'pending',
    });

    await newReview.save();

    console.log(`✅ Review created: ${newReview._id}`);

    // Send WebSocket notification
    try {
      const io = getIO();
      const roomId = `user_${userId.toString()}`;
      
      // Check if there are any clients in the room
      const room = io.sockets.adapter.rooms.get(roomId);
      const clientCount = room ? room.size : 0;
      console.log(`📊 Sending notification to room "${roomId}" with ${clientCount} client(s)`);

      io.to(roomId).emit('review-created', {
        reviewId: newReview._id,
        pullRequestTitle: pullRequest.title,
        pullRequestNumber: pullRequest.number,
        repository: repository.full_name,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ WebSocket notification sent for new review to ${clientCount} client(s)`);
      
      if (clientCount === 0) {
        console.warn(`⚠️ WARNING: No clients connected in room ${roomId}. User may not receive notification.`);
      }
    } catch (socketError) {
      console.error('❌ Error sending WebSocket notification:', socketError);
    }

    // ✅ FIX: Check if token exists
    if (!dbRepository.githubAccessToken) {
      console.error('❌ No GitHub access token found for repository');
      const review = await Review.findById(newReview._id);
      if (review) {
        review.status = 'failed';
        review.summary = 'No GitHub access token configured for this repository';
        await review.save();
      }
      return;
    }

    // Process review asynchronously (don't block webhook response)
    processPullRequestReview(
      newReview._id.toString(), // ✅ FIX: Use _id instead of id
      repository.owner.login,
      repository.name,
      pullRequest.number,
      pullRequest.head.sha,
      pullRequest.title + '\n\n' + (pullRequest.body || ''),
      dbRepository.githubAccessToken as string
    ).catch(error => {
      console.error('❌ Error processing PR review:', error);
    });

  } catch (error) {
    console.error('❌ Error handling pull request event:', error);
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
  console.log(`\n🔄 Starting review process for Review ID: ${reviewId}`);
  console.log(`📦 Repository: ${owner}/${repo}`);
  console.log(`🔀 PR #${pullNumber}`);

  try {
    // Update status to in_progress
    const review = await Review.findById(reviewId).populate('reviewedBy');

    if (!review) {
      console.error('❌ Review not found');
      return;
    }

    review.status = 'in_progress';
    await review.save();

    console.log(`⏳ Review status: in_progress`);

    // ✅ FIX: Extract user ID properly
    const reviewedByUser = review.reviewedBy as any;
    const userId = reviewedByUser._id || reviewedByUser;

    // Send WebSocket update
    try {
      const io = getIO();
      const roomId = `user_${userId.toString()}`;
      
      const room = io.sockets.adapter.rooms.get(roomId);
      const clientCount = room ? room.size : 0;
      console.log(`📊 Sending in_progress update to room "${roomId}" with ${clientCount} client(s)`);

      io.to(roomId).emit('review-updated', {
        reviewId: review._id,
        status: 'in_progress',
        message: 'AI is analyzing your code...',
        timestamp: new Date().toISOString(),
      });
      
      if (clientCount === 0) {
        console.warn(`⚠️ WARNING: No clients connected in room ${roomId}`);
      }
    } catch (socketError) {
      console.error('❌ Error sending WebSocket update:', socketError);
    }

    // Fetch PR files
    console.log(`📥 Fetching PR files...`);
    const prFiles = await getPullRequestFiles(owner, repo, pullNumber, githubToken);
    console.log(`✅ Found ${prFiles.length} files in PR`);

    if (prFiles.length === 0) {
      console.log('⚠️ No code files to review');

      review.status = 'completed';
      review.summary = 'No code files to review in this PR';
      review.filesAnalyzed = 0;
      review.issuesFound = 0;
      review.qualityScore = 100;
      await review.save();

      // Send completion notification
      const io = getIO();
      io.to(`user_${userId.toString()}`).emit('review-completed', {
        reviewId: review._id,
        pullRequestTitle: review.pullRequestTitle,
        issuesFound: 0,
        qualityScore: 100,
        summary: 'No code files to review',
        timestamp: new Date().toISOString(),
      });

      return;
    }

    // Fetch content of each file (limit to 10 files to avoid timeout)
    const filesToAnalyze = prFiles.slice(0, 10);
    const filesWithContent: { name: string; content: string }[] = [];

    console.log(`📄 Fetching content for ${filesToAnalyze.length} files...`);

    for (const file of filesToAnalyze) {
      try {
        console.log(`  📄 Fetching: ${file.filename}`);

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
          console.log(`    ✅ Fetched (${content.length} chars)`);
        }

        // Delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`    ❌ Error fetching ${file.filename}:`, error.message);
      }
    }

    console.log(`✅ Successfully fetched ${filesWithContent.length} files`);

    if (filesWithContent.length === 0) {
      console.log('⚠️ Could not fetch any file content');

      review.status = 'failed';
      review.summary = 'Failed to fetch PR files';
      await review.save();
      return;
    }

    // Analyze with AI
    console.log(`🤖 Starting AI analysis with Gemini...`);
    const analysis = await analyzeMultipleFiles(filesWithContent, prContext);
    console.log(`✅ AI analysis complete!`);
    console.log(`   Files analyzed: ${analysis.filesAnalyzed}`);
    console.log(`   Issues found: ${analysis.totalIssues}`);
    console.log(`   Quality score: ${analysis.qualityScore}/100`);

    // Update review with findings
    review.status = 'completed';
    review.filesAnalyzed = analysis.filesAnalyzed;
    review.issuesFound = analysis.totalIssues;
    review.qualityScore = analysis.qualityScore;
    review.summary = analysis.summary;

    // Convert findings to match schema
    review.findings = analysis.findings.map((finding: any) => ({
      file: finding.file || filesWithContent[0]?.name || 'unknown',
      line: finding.line || 0,
      severity: finding.severity,
      category: finding.category,
      title: finding.title,
      description: finding.description,
      suggestion: finding.suggestion,
      codeSnippet: finding.codeSnippet,
    }));

    await review.save();

    console.log(`✅ Review saved to database`);

    // Send completion notification
    try {
      const io = getIO();
      const roomId = `user_${userId.toString()}`;
      
      const room = io.sockets.adapter.rooms.get(roomId);
      const clientCount = room ? room.size : 0;
      console.log(`📊 Sending completion notification to room "${roomId}" with ${clientCount} client(s)`);

      io.to(roomId).emit('review-completed', {
        reviewId: review._id,
        pullRequestTitle: review.pullRequestTitle,
        issuesFound: review.issuesFound,
        qualityScore: review.qualityScore,
        summary: review.summary,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Completion notification sent to ${clientCount} client(s)`);
      
      if (clientCount === 0) {
        console.warn(`⚠️ WARNING: No clients connected in room ${roomId}`);
      }
    } catch (socketError) {
      console.error('❌ Error sending completion notification:', socketError);
    }

    // Post review comment to GitHub
    try {
      console.log(`💬 Posting review to GitHub...`);

      const markdown = formatReviewAsMarkdown(review);

      await postReviewComment(owner, repo, pullNumber, markdown, githubToken);

      console.log(`✅ Review posted to GitHub PR #${pullNumber}`);
    } catch (commentError) {
      console.error('❌ Error posting review comment:', commentError);
      // Don't fail the review if comment posting fails
    }

    console.log(`\n🎉 Review process completed successfully!\n`);

  } catch (error: any) {
    console.error('\n❌ Error processing PR review:', error.message);
    console.error(error.stack);

    // Update review status to failed
    try {
      const review = await Review.findById(reviewId).populate('reviewedBy');
      if (review) {
        review.status = 'failed';
        review.summary = `Review failed: ${error.message}`;
        await review.save();

        // ✅ FIX: Extract user ID properly
        const reviewedByUser = review.reviewedBy as any;
        const userId = reviewedByUser._id || reviewedByUser;

        // Notify user of failure
        const io = getIO();
        io.to(`user_${userId.toString()}`).emit('review-updated', {
          reviewId: review._id,
          status: 'failed',
          message: 'AI review failed',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (updateError) {
      console.error('❌ Error updating review status:', updateError);
    }
  }
};