import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reviewService } from '@/services/reviewService';
import { useSocket } from '@/hooks/useSocket';
import { ReviewStats } from '@/types';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useSocket(); // Connect to WebSocket

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your code reviews</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reviews"
          value={stats?.totalReviews || 0}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          title="Completed"
          value={stats?.completedReviews || 0}
          icon={<CheckCircle className="w-4 h-4" />}
          className="text-green-600"
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressReviews || 0}
          icon={<Clock className="w-4 h-4" />}
          className="text-yellow-600"
        />
        <StatCard
          title="Issues Found"
          value={stats?.totalIssues || 0}
          icon={<AlertCircle className="w-4 h-4" />}
          className="text-red-600"
        />
      </div>

      {/* Quality Score */}
      <Card>
        <CardHeader>
          <CardTitle>Average Quality Score</CardTitle>
          <CardDescription>Based on all completed reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-primary">
            {stats?.avgQualityScore || 0}
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>Your latest code review activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Recent reviews will appear here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  className 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  className?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={className}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}