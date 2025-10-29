import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { reviewService } from '@/services/reviewService';
import { Review } from '@/types';
import { ArrowLeft, ExternalLink, AlertTriangle, Info } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading review...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-xl font-medium">Review not found</p>
          <Link to="/reviews">
            <Button className="mt-4">Back to Reviews</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/reviews">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{review.pullRequestTitle}</h1>
          <p className="text-muted-foreground">PR #{review.pullRequestNumber} by {review.author}</p>
        </div>
        <Button variant="outline" asChild>
          <a href={review.pullRequestUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on GitHub
          </a>
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Review Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className="mt-1">{review.status.replace('_', ' ')}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Files Analyzed</div>
              <div className="text-2xl font-bold">{review.filesAnalyzed}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Issues Found</div>
              <div className="text-2xl font-bold">{review.issuesFound}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Quality Score</div>
              <div className="text-2xl font-bold">
                {review.qualityScore || 'N/A'}
                {review.qualityScore && <span className="text-sm text-muted-foreground">/100</span>}
              </div>
            </div>
          </div>

          {review.summary && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2">Summary</div>
                <p className="text-muted-foreground">{review.summary}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Findings */}
      {review.findings && review.findings.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Issues Found ({review.findings.length})</h2>
          {review.findings.map((finding, index) => (
            <FindingCard key={index} finding={finding} index={index + 1} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-green-600">✓ No issues found!</p>
            <p className="text-sm text-muted-foreground mt-2">The code looks great!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FindingCard({ finding, index }: { finding: any; index: number }) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          {getSeverityIcon(finding.severity)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">
                {index}. {finding.title}
              </CardTitle>
              <Badge variant={getSeverityColor(finding.severity)}>
                {finding.severity}
              </Badge>
              <Badge variant="outline">{finding.category}</Badge>
            </div>
            <CardDescription>
              {finding.file} : Line {finding.line}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm font-medium mb-1">Issue:</div>
          <p className="text-sm text-muted-foreground">{finding.description}</p>
        </div>

        {finding.suggestion && (
          <div>
            <div className="text-sm font-medium mb-1">Suggestion:</div>
            <p className="text-sm text-green-600">{finding.suggestion}</p>
          </div>
        )}

        {finding.codeSnippet && (
          <div>
            <div className="text-sm font-medium mb-1">Code:</div>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
              <code>{finding.codeSnippet}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}