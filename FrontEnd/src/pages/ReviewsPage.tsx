import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReviews } from '@/hooks/useReviews';
import { useSocketContext } from '@/contexts/SocketContext';
import { Review } from '@/types';
import { GitPullRequest, FileCode, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import ReviewCard from '@/components/ReviewCard';

export default function ReviewsPage() {
  const { data: reviews = [], isLoading, refetch, isRefetching } = useReviews();
  const { subscribe, unsubscribe } = useSocketContext();

  useEffect(() => {
    const handleReviewUpdate = () => {
      console.log('Review update received, refreshing...');
      refetch();
    };

    subscribe('review-created', handleReviewUpdate);
    subscribe('review-updated', handleReviewUpdate);
    subscribe('review-completed', handleReviewUpdate);

    return () => {
      unsubscribe('review-created', handleReviewUpdate);
      unsubscribe('review-updated', handleReviewUpdate);
      unsubscribe('review-completed', handleReviewUpdate);
    };
  }, [subscribe, unsubscribe, refetch]);

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshed reviews');
  };

  if (isLoading) {
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
              disabled={isRefetching}
              variant="secondary"
              size="lg"
              className="bg-white text-primary font-semibold border-2 border-white/30 hover:bg-white/95 hover:border-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-lg px-6"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? 'Refreshing...' : 'Refresh'}
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
            {reviews.map((review: Review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}