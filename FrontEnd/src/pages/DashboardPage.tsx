import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reviewService } from '@/services/reviewService';
import { useSocket } from '@/hooks/useSocket';
import { ReviewStats } from '@/types';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Activity, GitPullRequest, FileCode, Zap } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useSocket();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await reviewService.getReviewStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
          <p className="text-lg font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const qualityScore = stats?.avgQualityScore || 0;
  const qualityColor = qualityScore >= 80 ? 'text-emerald-500' : qualityScore >= 60 ? 'text-amber-500' : 'text-rose-500';
  const qualityGradient = qualityScore >= 80 ? 'from-emerald-500/20 to-emerald-500/5' : qualityScore >= 60 ? 'from-amber-500/20 to-amber-500/5' : 'from-rose-500/20 to-rose-500/5';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header Section with Animated Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 sm:p-8 lg:p-10 text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Dashboard</h1>
              </div>
              <p className="text-primary-foreground/80 text-sm sm:text-base">Real-time insights into your code quality</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={isConnected ? 'default' : 'secondary'} 
                className={`${isConnected ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'} text-white border-0 px-4 py-2 shadow-lg`}
              >
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white' : 'bg-white/80'} mr-2 animate-pulse`}></span>
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid with Hover Effects */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Reviews"
            value={stats?.totalReviews || 0}
            icon={<TrendingUp className="w-5 h-5" />}
            gradient="from-blue-500/20 to-blue-500/5"
            iconBg="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Completed"
            value={stats?.completedReviews || 0}
            icon={<CheckCircle className="w-5 h-5" />}
            gradient="from-emerald-500/20 to-emerald-500/5"
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="In Progress"
            value={stats?.inProgressReviews || 0}
            icon={<Clock className="w-5 h-5" />}
            gradient="from-amber-500/20 to-amber-500/5"
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Issues Found"
            value={stats?.totalIssues || 0}
            icon={<AlertCircle className="w-5 h-5" />}
            gradient="from-rose-500/20 to-rose-500/5"
            iconBg="bg-rose-500/10"
            iconColor="text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* Quality Score - Large Feature Card */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-2xl group">
          <div className={`absolute inset-0 bg-gradient-to-br ${qualityGradient} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl">Code Quality Score</CardTitle>
                <CardDescription className="text-base">Average across all completed reviews</CardDescription>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="relative">
                <div className={`text-6xl sm:text-7xl lg:text-8xl font-bold ${qualityColor} drop-shadow-lg`}>
                  {qualityScore}
                  <span className="text-3xl sm:text-4xl text-muted-foreground">/100</span>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-2xl -z-10"></div>
              </div>
              
              <div className="w-full sm:w-auto sm:flex-1 max-w-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quality Level</span>
                    <span className={`font-bold ${qualityColor}`}>
                      {qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Work'}
                    </span>
                  </div>
                  <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${
                        qualityScore >= 80 ? 'from-emerald-500 to-emerald-400' : 
                        qualityScore >= 60 ? 'from-amber-500 to-amber-400' : 
                        'from-rose-500 to-rose-400'
                      } rounded-full transition-all duration-1000 ease-out shadow-lg`}
                      style={{ width: `${qualityScore}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <GitPullRequest className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest code review activity</CardDescription>
              </div>
              <FileCode className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardHeader>
          <CardContent className="p-8 sm:p-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                <Activity className="w-10 h-10 text-primary/50" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground/60">Your latest reviews will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient,
  iconBg,
  iconColor
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  gradient: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`${iconBg} p-2.5 rounded-lg ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl sm:text-4xl font-bold tracking-tight">{value}</div>
        <div className="absolute bottom-2 right-4 text-6xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}