import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, Rocket, FolderGit2, ArrowRight, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user: clerkUser, getToken } = useUser();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [showConfetti, setShowConfetti] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/pricing');
      return;
    }
    
    // Refresh user data after successful subscription
    const refreshUserData = async () => {
      if (!clerkUser) return;
      
      setRefreshing(true);
      try {
        const token = await getToken({ skipCache: true });
        if (!token) return;

        // Sync user data from backend (includes latest subscription info)
        const response = await authService.syncClerkUser({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.username || 'User',
          profileImage: clerkUser.imageUrl,
        }, token);

        // Update Redux store with latest user data (including subscription)
        dispatch(setCredentials({
          user: response.user,
          token: token,
        }));

        console.log('✅ User data refreshed after subscription:', response.user);
      } catch (error) {
        console.error('Error refreshing user data:', error);
        toast.error('Failed to refresh subscription status. Please refresh the page.');
      } finally {
        setRefreshing(false);
      }
    };

    // Wait a moment for webhook to process, then refresh
    const refreshTimer = setTimeout(() => {
      refreshUserData();
    }, 2000); // 2 second delay to allow webhook to complete
    
    // Hide confetti after animation
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);
    
    return () => {
      clearTimeout(refreshTimer);
      clearTimeout(confettiTimer);
    };
  }, [sessionId, navigate, clerkUser, getToken, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
                left: `${Math.random() * 100}%`,
                top: -20,
              }}
              animate={{
                y: [0, window.innerHeight + 50],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-green-500/20 shadow-2xl">
          <CardContent className="pt-12 pb-8 px-6 md:px-12 text-center space-y-8">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 200,
                damping: 10,
                delay: 0.2 
              }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl"></div>
              <div className="relative p-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl">
                <CheckCircle className="w-20 h-20" strokeWidth={2.5} />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.5,
                }}
                className="absolute -top-2 -right-2"
              >
                <div className="p-2 rounded-full bg-yellow-500 text-white shadow-lg">
                  <PartyPopper className="w-6 h-6" />
                </div>
              </motion.div>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Subscription Successful!
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Welcome to CodePro Pro! Your subscription has been activated and you're ready to go.
              </p>
            </motion.div>

            {/* Features unlocked */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">All Pro features unlocked</span>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/10">
                  <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary mb-2">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold mb-1">Unlimited Reviews</div>
                  <div className="text-xs text-muted-foreground">Review as much code as you need</div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                  <div className="inline-flex p-2 rounded-lg bg-purple-500/10 text-purple-600 mb-2">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold mb-1">Advanced AI</div>
                  <div className="text-xs text-muted-foreground">Powered by Gemini Pro 2.0</div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10">
                  <div className="inline-flex p-2 rounded-lg bg-green-500/10 text-green-600 mb-2">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold mb-1">Unlimited Repos</div>
                  <div className="text-xs text-muted-foreground">Connect all your repositories</div>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Button 
                onClick={() => navigate('/dashboard')} 
                size="lg"
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                onClick={() => navigate('/repositories')} 
                variant="outline" 
                size="lg"
                className="flex-1 rounded-full group"
              >
                <FolderGit2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Connect Repositories
              </Button>
            </motion.div>

            {/* Additional info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="pt-4 space-y-3"
            >
              <div className="h-px bg-border"></div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Confirmation email sent</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Access granted immediately</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Questions? Contact us at{' '}
                <a href="mailto:support@codepro.dev" className="text-primary hover:underline">
                  support@codepro.dev
                </a>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}