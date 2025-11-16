import { Request, Response } from 'express';
import Review from '../models/Review';
import { getIO } from '../config/socket';
import { analyzeMultipleFiles } from '../config/gemini';

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
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find()
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
export const getRepositoryReviews = async (req: Request, res: Response) => {
  try {
    const { repositoryId } = req.params;
    const reviews = await Review.find({ repositoryId })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching repository reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single review
export const getReviewById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id)
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

// Update review (for AI to add findings)
export const updateReview = async (req: Request, res: Response) => {
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
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ reviewedBy: userId })
      .populate('repositoryId', 'name fullName')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get review statistics
export const getReviewStats = async (req: Request, res: Response) => {
  try {
    const totalReviews = await Review.countDocuments();
    const completedReviews = await Review.countDocuments({ status: 'completed' });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    const inProgressReviews = await Review.countDocuments({ status: 'in_progress' });

    // Get average quality score
    const reviewsWithScores = await Review.find({ qualityScore: { $exists: true } });
    const avgQualityScore = reviewsWithScores.length > 0
      ? reviewsWithScores.reduce((sum, review) => sum + (review.qualityScore || 0), 0) / reviewsWithScores.length
      : 0;

    // Get total issues found
    const allReviews = await Review.find();
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