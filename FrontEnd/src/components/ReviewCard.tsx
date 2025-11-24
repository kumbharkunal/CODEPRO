import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Review } from '@/types';
import { ExternalLink, FileCode, AlertCircle, CheckCircle2, Clock, GitPullRequest, User, TrendingUp } from 'lucide-react';
import { formatStatus } from '@/lib/utils';

export default function ReviewCard({ review }: { review: Review }) {
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
