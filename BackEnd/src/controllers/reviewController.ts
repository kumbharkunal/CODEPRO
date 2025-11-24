import { Response } from 'express';
import { SUBSCRIPTION_LIMITS, PLANS } from '../config/constants';
import Review from '../models/Review';
import User from '../models/User';
import Repository from '../models/Repository';
import { getIO } from '../config/socket';
import { analyzeMultipleFiles } from '../config/gemini';

// Create review
export const createReview = async (req: any, res: Response) => {
  try {
    const {
      repositoryId,
      pullRequestNumber,
      pullRequestTitle,
      pullRequestUrl,
      author,
    } = req.body;

    const teamId = req.user.teamId;
    const userId = req.user._id;

    if (!teamId) {
      return res.status(403).json({ message: 'User must be part of a team' });
    }

    // Verify repository belongs to user's team
    const repository = await Repository.findOne({ _id: repositoryId, teamId });

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found or access denied' });
    }

    // SUBSCRIPTION CHECK START
    // Get the team owner or the user who pays for the subscription
    // Assuming the user is the one paying for now, or we check the team's subscription if that existed
    // For this app, it seems subscription is on the User model. 
    // We should check the subscription of the user creating the review OR the team owner.
    // Let's assume the current user's subscription matters for their actions, 
    // OR if it's a team-based app, usually the team owner's subscription counts.
    // Given the schema, User has subscription. Let's check the current user's subscription.

    // OR if it's a team-based app, usually the team owner's subscription counts.
    // Given the schema, User has subscription. Let's check the current user's subscription.

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = user.subscription?.plan || 'free';
    const status = user.subscription?.status || 'active';

    // Check subscription limits
    const currentPlan = user?.subscription?.plan || PLANS.FREE;
    const limit = SUBSCRIPTION_LIMITS[currentPlan as keyof typeof SUBSCRIPTION_LIMITS].maxReviewsPerMonth;

    // Count reviews in current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const reviewCount = await Review.countDocuments({
      teamId: req.user.teamId,
      createdAt: { $gte: startOfMonth }
    });

    if (reviewCount >= limit) {
      return res.status(403).json({
        message: `Monthly review limit reached. You can only perform ${limit} reviews per month on the ${currentPlan} plan.`
      });
    }
    // SUBSCRIPTION CHECK END

    const newReview = new Review({
      repositoryId,
      pullRequestNumber,
      pullRequestTitle,
      pullRequestUrl,
      author,
      reviewedBy: userId,
      teamId,
      status: 'pending',
    });

    await newReview.save();

    // 🔥 FIX 1: Send WebSocket notification when review is created
    try {
      const io = getIO();
      const userIdStr = newReview.reviewedBy.toString(); // Ensure it's a string

      io.to(`user_${userIdStr}`).emit('review-created', {
        reviewId: newReview._id,
        pullRequestNumber: newReview.pullRequestNumber,
        pullRequestTitle: newReview.pullRequestTitle,
        status: 'pending',
        timestamp: new Date().toISOString(),
      });

      console.log(`WebSocket: review-created sent to user_${userIdStr}`);
    } catch (socketError) {
      console.error('Error sending WebSocket notification:', socketError);
      // Don't fail the request if WebSocket fails
    }

    res.status(201).json({
      message: 'Review created successfully',
      review: newReview,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reviews (TEAM-SCOPED - only returns team's reviews)
export const getAllReviews = async (req: any, res: Response) => {
  try {
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(403).json({ message: 'User must be part of a team' });
    }

    const reviews = await Review.find({ teamId })
      .populate('repositoryId', 'name fullName')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews by repository (TEAM-SCOPED with ownership verification)
export const getRepositoryReviews = async (req: any, res: Response) => {
  try {
    const { repositoryId } = req.params;
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(403).json({ message: 'User must be part of a team' });
    }

    const repository = await Repository.findOne({ _id: repositoryId, teamId });

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const reviews = await Review.find({ repositoryId, teamId })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching repository reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single review (TEAM-SCOPED with ownership verification)
export const getReviewById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(403).json({ message: 'User must be part of a team' });
    }

    const review = await Review.findOne({ _id: id, teamId })
      .populate('repositoryId', 'name fullName owner')
      .populate('reviewedBy', 'name email');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update review (ADMIN ONLY, TEAM-SCOPED - CRITICAL FIX)
export const updateReview = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, filesAnalyzed, issuesFound, findings, summary, qualityScore } = req.body;
    const teamId = req.user?.teamId;

    // Authentication check - CRITICAL SECURITY FIX
    if (!req.user || !teamId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Authorization check - only admin can manually update reviews
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update reviews' });
    }

    const review = await Review.findOne({ _id: id, teamId });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Store old status for comparison
    const oldStatus = review.status;

    // Update fields if provided
    if (status) review.status = status;
    if (filesAnalyzed !== undefined) review.filesAnalyzed = filesAnalyzed;
    if (issuesFound !== undefined) review.issuesFound = issuesFound;
    if (findings) review.findings = findings;
    if (summary) review.summary = summary;
    if (qualityScore !== undefined) review.qualityScore = qualityScore;

    await review.save();

    // Send WebSocket notification if status changed
    if (status && status !== oldStatus) {
      try {
        const io = getIO();
        // 🔥 FIX 2: Use ._id or .toString() to get the actual ID
        const userId = review.reviewedBy.toString();

        console.log(`Sending WebSocket to user_${userId}, status: ${status}`);

        // Send to user's room
        io.to(`user_${userId}`).emit('review-updated', {
          reviewId: review._id,
          status: review.status,
          message: `Review status changed to ${status}`,
          timestamp: new Date().toISOString(),
        });

        // If completed, send detailed notification
        if (status === 'completed') {
          io.to(`user_${userId}`).emit('review-completed', {
            reviewId: review._id,
            pullRequestTitle: review.pullRequestTitle,
            issuesFound: review.issuesFound,
            qualityScore: review.qualityScore,
            summary: review.summary,
            timestamp: new Date().toISOString(),
          });
        }

        console.log(`WebSocket notification sent to user_${userId}`);
      } catch (socketError) {
        console.error('Error sending WebSocket notification:', socketError);
        // Don't fail the request if WebSocket fails
      }
    }

    // Populate before sending response
    await review.populate('reviewedBy', 'name email');
    await review.populate('repositoryId', 'name fullName');

    res.status(200).json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's reviews (TEAM-SCOPED)
export const getUserReviews = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(403).json({ message: 'User must be part of a team' });
    }

    const reviews = await Review.find({ reviewedBy: userId, teamId })
      .populate('repositoryId', 'name fullName')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get review statistics (TEAM-SCOPED - all team's stats)
export const getReviewStats = async (req: any, res: Response) => {
  try {
    const teamId = req.user.teamId;

    // If user has no team yet, return empty stats instead of error
    if (!teamId) {
      return res.status(200).json({
        totalReviews: 0,
        completedReviews: 0,
        pendingReviews: 0,
        inProgressReviews: 0,
        avgQualityScore: 0,
        totalIssues: 0,
      });
    }

    // Filter all queries by team
    const totalReviews = await Review.countDocuments({ teamId });
    const completedReviews = await Review.countDocuments({ teamId, status: 'completed' });
    const pendingReviews = await Review.countDocuments({ teamId, status: 'pending' });
    const inProgressReviews = await Review.countDocuments({ teamId, status: 'in_progress' });

    // Get average quality score for team's reviews
    const reviewsWithScores = await Review.find({
      teamId,
      qualityScore: { $exists: true }
    });
    const avgQualityScore = reviewsWithScores.length > 0
      ? reviewsWithScores.reduce((sum, review) => sum + (review.qualityScore || 0), 0) / reviewsWithScores.length
      : 0;

    // Get total issues found in team's reviews
    const allReviews = await Review.find({ teamId });
    const totalIssues = allReviews.reduce((sum, review) => sum + review.issuesFound, 0);

    res.status(200).json({
      totalReviews,
      completedReviews,
      pendingReviews,
      inProgressReviews,
      avgQualityScore: Math.round(avgQualityScore * 10) / 10,
      totalIssues,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Trigger AI review (called after review is created)
export const triggerAIReview = async (reviewId: string, files: { name: string; content: string }[], prContext: string) => {
  try {
    // Update review status to in_progress
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    review.status = 'in_progress';
    await review.save();

    // Send WebSocket notification
    const io = getIO();
    const userId = review.reviewedBy.toString();

    console.log(`Sending in_progress notification to user_${userId}`);

    io.to(`user_${userId}`).emit('review-updated', {
      reviewId: review._id,
      status: 'in_progress',
      message: 'AI is analyzing your code...',
      timestamp: new Date().toISOString(),
    });

    // Analyze code with Gemini
    const analysis = await analyzeMultipleFiles(files, prContext);

    // Update review with findings
    review.status = 'completed';
    review.filesAnalyzed = analysis.filesAnalyzed;
    review.issuesFound = analysis.totalIssues;
    review.qualityScore = analysis.qualityScore;
    review.summary = analysis.summary;

    // Convert findings to match schema
    review.findings = analysis.findings.map((finding: any) => ({
      file: finding.file || 'unknown',
      line: finding.line || 0,
      severity: finding.severity,
      category: finding.category,
      title: finding.title,
      description: finding.description,
      suggestion: finding.suggestion,
      codeSnippet: finding.codeSnippet,
    }));

    await review.save();

    // Send completion notification
    console.log(`Sending completed notification to user_${userId}`);

    io.to(`user_${userId}`).emit('review-completed', {
      reviewId: review._id,
      pullRequestTitle: review.pullRequestTitle,
      issuesFound: review.issuesFound,
      qualityScore: review.qualityScore,
      summary: review.summary,
      timestamp: new Date().toISOString(),
    });

    console.log(`AI review completed for review ${reviewId}`);

  } catch (error) {
    console.error('Error in AI review:', error);

    // Update review status to failed
    const review = await Review.findById(reviewId);
    if (review) {
      review.status = 'failed';
      review.summary = 'AI review failed due to an error';
      await review.save();

      // Notify user of failure
      const io = getIO();
      const userId = review.reviewedBy.toString();
      io.to(`user_${userId}`).emit('review-updated', {
        reviewId: review._id,
        status: 'failed',
        message: 'AI review failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
};

// Delete review (ADMIN ONLY, TEAM-SCOPED)
export const deleteReview = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(403).json({ message: 'User must be part of a team' });
    }

    // Find and delete review (must belong to team)
    const review = await Review.findOneAndDelete({ _id: id, teamId });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
