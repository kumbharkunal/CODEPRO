import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { reviewService } from '@/services/reviewService';
import { Review } from '@/types';
import { ArrowLeft, ExternalLink, AlertTriangle, Info, FileCode, CheckCircle2, TrendingUp, GitPullRequest, User } from 'lucide-react';

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchReview(id);
    }
  }, [id]);

  const fetchReview = async (reviewId: string) => {
    try {
      const data = await reviewService.getReviewById(reviewId);
      setReview(data);
    } catch (error) {
      console.error('Error fetching review:', error);
    } finally {
      setLoading(false);
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
          <p className="text-lg font-medium animate-pulse">Loading review details...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center border-2 shadow-xl">
          <CardContent className="py-12 space-y-4">
            <div className="w-20 h-20 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold">Review Not Found</p>
              <p className="text-sm text-muted-foreground">The review you're looking for doesn't exist</p>
            </div>
            <Link to="/reviews">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Reviews
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qualityScore = review.qualityScore || 0;
  const qualityConfig = qualityScore >= 80 
    ? { color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5', label: 'Excellent' }
    : qualityScore >= 60 
    ? { color: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-500/20 to-amber-500/5', label: 'Good' }
    : { color: 'text-rose-600 dark:text-rose-400', bg: 'from-rose-500/20 to-rose-500/5', label: 'Needs Work' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 sm:p-8 text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <Link to="/reviews">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-white/20 text-primary-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <GitPullRequest className="w-5 h-5" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight line-clamp-2">
                {review.pullRequestTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-1.5">
                  <GitPullRequest className="w-4 h-4" />
                  <span>PR #{review.pullRequestNumber}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{review.author}</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0 backdrop-blur-sm shadow-lg" 
              asChild
            >
              <a href={review.pullRequestUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Review Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox
                label="Status"
                value={review.status.replace('_', ' ')}
                badge
                gradient="from-blue-500/10 to-blue-500/5"
              />
              <StatBox
                label="Files Analyzed"
                value={review.filesAnalyzed}
                gradient="from-purple-500/10 to-purple-500/5"
              />
              <StatBox
                label="Issues Found"
                value={review.issuesFound}
                gradient="from-rose-500/10 to-rose-500/5"
              />
              <StatBox
                label="Quality Score"
                value={review.qualityScore ? `${review.qualityScore}/100` : 'N/A'}
                gradient={`${qualityConfig.bg}`}
                color={qualityConfig.color}
              />
            </div>

            {review.summary && (
              <>
                <Separator className="my-6" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Info className="w-4 h-4 text-primary" />
                    <span>AI Analysis Summary</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-6">{review.summary}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Findings */}
        {review.findings && review.findings.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                Issues Found
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {review.findings.length}
                </Badge>
              </h2>
            </div>
            <div className="space-y-4">
              {review.findings.map((finding, index) => (
                <FindingCard key={index} finding={finding} index={index + 1} />
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent shadow-xl">
            <CardContent className="py-16 sm:py-20 text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  No Issues Found!
                </p>
                <p className="text-muted-foreground">
                  Your code looks great! All quality checks passed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  badge, 
  gradient, 
  color = '' 
}: { 
  label: string; 
  value: string | number; 
  badge?: boolean; 
  gradient: string;
  color?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-4 rounded-xl border border-border/50`}>
      <div className="text-xs text-muted-foreground mb-2 font-medium">{label}</div>
      {badge ? (
        <Badge className="text-sm font-semibold capitalize">
          {value}
        </Badge>
      ) : (
        <div className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</div>
      )}
    </div>
  );
}

function FindingCard({ finding, index }: { finding: any; index: number }) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconBg: 'bg-rose-500/10',
          iconColor: 'text-rose-600 dark:text-rose-400',
          badge: 'destructive' as const,
          gradient: 'from-rose-500/10 to-rose-500/5',
          border: 'border-rose-500/30'
        };
      case 'medium':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconBg: 'bg-amber-500/10',
          iconColor: 'text-amber-600 dark:text-amber-400',
          badge: 'secondary' as const,
          gradient: 'from-amber-500/10 to-amber-500/5',
          border: 'border-amber-500/30'
        };
      case 'low':
      case 'info':
        return {
          icon: <Info className="w-5 h-5" />,
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-600 dark:text-blue-400',
          badge: 'outline' as const,
          gradient: 'from-blue-500/10 to-blue-500/5',
          border: 'border-blue-500/30'
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          iconBg: 'bg-secondary',
          iconColor: 'text-muted-foreground',
          badge: 'outline' as const,
          gradient: 'from-secondary to-secondary/50',
          border: 'border-border'
        };
    }
  };

  const config = getSeverityConfig(finding.severity);

  return (
    <Card className={`relative overflow-hidden border-2 ${config.border} hover:shadow-xl transition-all duration-300 group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
      
      <CardHeader className="relative">
        <div className="flex items-start gap-4">
          <div className={`${config.iconBg} p-3 rounded-xl ${config.iconColor} flex-shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-start gap-2">
              <span className="text-2xl font-bold text-primary/50">#{index}</span>
              <CardTitle className="text-lg sm:text-xl flex-1 min-w-0">
                {finding.title}
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={config.badge} className="capitalize">
                {finding.severity}
              </Badge>
              <Badge variant="outline">{finding.category}</Badge>
            </div>
            <CardDescription className="flex items-center gap-2 text-sm">
              <FileCode className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{finding.file}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="whitespace-nowrap">Line {finding.line}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Issue</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {finding.description}
          </p>
        </div>

        {finding.suggestion && (
          <div className="space-y-2 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Suggestion</span>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed pl-6">
              {finding.suggestion}
            </p>
          </div>
        )}

        {finding.codeSnippet && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileCode className="w-4 h-4 text-primary" />
              <span>Code Snippet</span>
            </div>
            <pre className="bg-muted/50 backdrop-blur-sm p-4 rounded-lg text-xs sm:text-sm overflow-x-auto border border-border/50">
              <code className="text-foreground">{finding.codeSnippet}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}