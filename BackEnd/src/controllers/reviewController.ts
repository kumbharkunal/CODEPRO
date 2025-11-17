import { Request, Response } from 'express';
import Review from '../models/Review';
import { getIO } from '../config/socket';
import { analyzeMultipleFiles } from '../config/gemini';
import { AuthRequest } from '../middlewares/auth';

// Create review
export const createReview = async (req: Request, res: Response) => {
  try {
    const {
      repositoryId,
      pullRequestNumber,
      pullRequestTitle,
      pullRequestUrl,
      author,
      reviewedBy,
    } = req.body;

    const newReview = new Review({
      repositoryId,
      pullRequestNumber,
      pullRequestTitle,
      pullRequestUrl,
      author,
      reviewedBy,
      status: 'pending',
    });

    await newReview.save();

    // 🔥 FIX 1: Send WebSocket notification when review is created
    try {
      const io = getIO();
      const userId = reviewedBy.toString(); // Ensure it's a string
      
      io.to(`user_${userId}`).emit('review-created', {
        reviewId: newReview._id,
        pullRequestNumber: newReview.pullRequestNumber,
        pullRequestTitle: newReview.pullRequestTitle,
        status: 'pending',
        timestamp: new Date().toISOString(),
      });

      console.log(`WebSocket: review-created sent to user_${userId}`);
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

// Get all reviews
// - Admins: See all reviews
// - Developers: See reviews for PRs they created (author field matches their email)
export const getAllReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const userEmail = req.user.email;

    let query: any = {};

    // Admins see all reviews
    if (userRole !== 'admin') {
      // Developers see reviews for PRs they created (where author matches their email)
      query = { author: userEmail };
    }

    const reviews = await Review.find(query)
      .populate('repositoryId', 'name fullName')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews by repository
// - Admins: Can see all reviews for any repository
// - Developers: Can see reviews for PRs they created
export const getRepositoryReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { repositoryId } = req.params;
    const userRole = req.user.role;
    const userEmail = req.user.email;
    
    // Verify repository exists
    const Repository = require('../models/Repository').default;
    const repository = await Repository.findById(repositoryId);
    
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    
    // Build query based on role
    let query: any = { repositoryId };
    
    // Developers only see reviews for PRs they created
    if (userRole !== 'admin') {
      query.author = userEmail;
    }
    
    const reviews = await Review.find(query)
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching repository reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single review
// - Admins: Can see any review
// - Developers: Can see reviews for PRs they created
export const getReviewById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userEmail = req.user.email;
    
    const review = await Review.findById(id)
      .populate('repositoryId', 'name fullName owner')
      .populate('reviewedBy', 'name email');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check access: Admins can see all, developers can see their own PR reviews
    if (userRole !== 'admin' && review.author !== userEmail) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view reviews for your own PRs.',
        code: 'ACCESS_DENIED'
      });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update review (for AI to add findings or admin updates)
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, filesAnalyzed, issuesFound, findings, summary, qualityScore } = req.body;

    const review = await Review.findById(id);

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

// Get user's reviews
// - Admins: Can view any user's reviews
// - Developers: Can only view their own reviews
export const getUserReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const userRole = req.user.role;
    const currentUserId = req.user._id.toString();

    // Admins can view any user's reviews, others can only view their own
    if (userRole !== 'admin' && userId !== currentUserId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own reviews.',
        code: 'ACCESS_DENIED'
      });
    }

    // Get user email for filtering by author
    const User = require('../models/User').default;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For developers, show reviews for PRs they created
    let query: any = {};
    if (userRole !== 'admin') {
      query.author = user.email;
    } else {
      // For admins viewing a user's reviews, show all reviews for PRs created by that user
      query.author = user.email;
    }

    const reviews = await Review.find(query)
      .populate('repositoryId', 'name fullName')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get review statistics
// - Admins: See stats for all reviews
// - Developers: See stats for their own PR reviews
export const getReviewStats = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user.role;
    const userEmail = req.user.email;

    // Build query based on role
    let query: any = {};
    if (userRole !== 'admin') {
      query.author = userEmail; // Developers see stats for their PRs
    }

    const totalReviews = await Review.countDocuments(query);
    const completedReviews = await Review.countDocuments({ ...query, status: 'completed' });
    const pendingReviews = await Review.countDocuments({ ...query, status: 'pending' });
    const inProgressReviews = await Review.countDocuments({ ...query, status: 'in_progress' });

    // Get average quality score
    const reviewsWithScores = await Review.find({ 
      ...query,
      qualityScore: { $exists: true } 
    });
    const avgQualityScore = reviewsWithScores.length > 0
      ? reviewsWithScores.reduce((sum, review) => sum + (review.qualityScore || 0), 0) / reviewsWithScores.length
      : 0;

    // Get total issues found
    const allReviews = await Review.find(query);
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

// Delete review (Admin only)
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ 
      message: 'Review deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting review:', error);
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