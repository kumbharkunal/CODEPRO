import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { reviewService } from '@/services/reviewService';
import { Review } from '@/types';
import { ExternalLink, FileCode, AlertCircle, CheckCircle2, Clock, GitPullRequest, User, TrendingUp, RefreshCw } from 'lucide-react';
import { formatStatus } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReviews();
    
    // Listen for socket connection to refresh reviews (catches missed notifications)
    const handleSocketConnected = () => {
      console.log('Socket connected - refreshing reviews to catch any missed notifications');
      fetchReviews();
    };
    
    // Listen for review events to refresh the list
    const handleReviewEvent = () => {
      fetchReviews();
    };
    
    window.addEventListener('socket-connected', handleSocketConnected);
    window.addEventListener('review-created', handleReviewEvent);
    window.addEventListener('review-updated', handleReviewEvent);
    window.addEventListener('review-completed', handleReviewEvent);
    
    return () => {
      window.removeEventListener('socket-connected', handleSocketConnected);
      window.removeEventListener('review-created', handleReviewEvent);
      window.removeEventListener('review-updated', handleReviewEvent);
      window.removeEventListener('review-completed', handleReviewEvent);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await reviewService.getAllReviews();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await reviewService.getAllReviews();
      setReviews(data);
      toast.success('Reviews refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing reviews:', error);
      toast.error('Failed to refresh reviews');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium animate-pulse">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 sm:p-8 lg:p-10 text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          
          <div className="relative flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <GitPullRequest className="w-6 h-6" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Code Reviews</h1>
              </div>
              <p className="text-primary-foreground/80 text-sm sm:text-base">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} • AI-powered analysis
              </p>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="secondary"
              size="lg"
              className="bg-white text-primary font-semibold border-2 border-white/30 hover:bg-white/95 hover:border-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-lg px-6"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="border-2 border-dashed hover:border-primary/30 transition-all duration-300">
            <CardContent className="py-16 sm:py-24 text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center">
                <FileCode className="w-12 h-12 text-primary/50" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold">No reviews yet</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Connect a repository and open a pull request to get started with AI-powered code reviews
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          variant: 'default' as const,
          icon: <CheckCircle2 className="w-4 h-4" />,
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/20'
        };
      case 'in_progress':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="w-4 h-4" />,
          bg: 'bg-amber-500/10 hover:bg-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/20'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className="w-4 h-4" />,
          bg: 'bg-rose-500/10 hover:bg-rose-500/20',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/20'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: <Clock className="w-4 h-4" />,
          bg: 'bg-secondary',
          text: 'text-muted-foreground',
          border: 'border-border'
        };
    }
  };

  const getQualityConfig = (score?: number) => {
    if (!score) return { color: 'text-muted-foreground', bg: 'bg-secondary', label: 'N/A' };
    if (score >= 80) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', label: 'Excellent' };
    if (score >= 60) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', label: 'Good' };
    return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', label: 'Needs Work' };
  };

  const statusConfig = getStatusConfig(review.status);
  const qualityConfig = getQualityConfig(review.qualityScore);

  return (
    <Card className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <CardHeader className="relative pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-start gap-3">
              <div className={`p-2 ${statusConfig.bg} rounded-lg mt-1`}>
                {statusConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {review.pullRequestTitle}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-md">
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span className="font-medium">#{review.pullRequestNumber}</span>
                  </div>
                  <span className="text-muted-foreground/50">•</span>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{review.author}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex sm:flex-col gap-2">
            <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} whitespace-nowrap`}>
              {formatStatus(review.status)}
            </Badge>
            {review.qualityScore !== undefined && (
              <Badge variant="outline" className={`${qualityConfig.bg} ${qualityConfig.color} border-0 whitespace-nowrap`}>
                {qualityConfig.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-3 sm:p-4 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <FileCode className="w-3.5 h-3.5" />
              <span>Files</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold">{review.filesAnalyzed}</div>
          </div>
          
          <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-3 sm:p-4 rounded-xl border border-rose-500/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Issues</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold">{review.issuesFound}</div>
          </div>
          
          {review.qualityScore !== undefined ? (
            <div className={`bg-gradient-to-br ${qualityConfig.bg} p-3 sm:p-4 rounded-xl border ${statusConfig.border}`}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Score</span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${qualityConfig.color}`}>
                {review.qualityScore}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-secondary to-secondary/50 p-3 sm:p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Score</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-muted-foreground">N/A</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all" 
            asChild
          >
            <a href={review.pullRequestUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View PR
            </a>
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all" 
            asChild
          >
            <Link to={`/reviews/${review._id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}