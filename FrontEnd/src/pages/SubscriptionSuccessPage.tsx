import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/pricing');
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Subscription Successful!</h1>
          <p className="text-muted-foreground">
            Your subscription has been activated. Welcome to CodePro Pro!
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/dashboard')} className="flex-1">
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate('/repositories')} variant="outline" className="flex-1">
              Connect Repos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}