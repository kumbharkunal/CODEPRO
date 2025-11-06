import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { githubService } from '@/services/githubService';
import { Github, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function GitHubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to GitHub...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('GitHub authentication was cancelled or failed');
        toast.error('GitHub authentication failed');
        setTimeout(() => navigate('/repositories'), 2000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from GitHub');
        toast.error('No authorization code received');
        setTimeout(() => navigate('/repositories'), 2000);
        return;
      }

      try {
        setMessage('Exchanging authorization code...');
        
        // Exchange code for token
        const data = await githubService.exchangeCode(code);
        
        setMessage('Storing access token...');
        
        // Store token temporarily
        localStorage.setItem('github_token', data.accessToken);
        
        setStatus('success');
        setMessage('GitHub connected successfully!');
        toast.success('GitHub connected successfully!');
        
        setTimeout(() => navigate('/repositories/connect'), 1500);
      } catch (error) {
        console.error('GitHub callback error:', error);
        setStatus('error');
        setMessage('Failed to connect to GitHub. Please try again.');
        toast.error('Failed to connect GitHub');
        setTimeout(() => navigate('/repositories'), 2000);
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-md w-full"
      >
        {/* Icon */}
        <motion.div
          className="relative inline-block"
          animate={
            status === 'loading'
              ? { rotate: 360 }
              : status === 'success'
              ? { scale: [1, 1.2, 1] }
              : { scale: [1, 0.9, 1] }
          }
          transition={
            status === 'loading'
              ? { duration: 2, repeat: Infinity, ease: 'linear' }
              : { duration: 0.5 }
          }
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
          <div className={`relative p-6 rounded-full ${
            status === 'loading' 
              ? 'bg-gradient-to-r from-primary to-blue-600' 
              : status === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : 'bg-gradient-to-r from-red-500 to-rose-600'
          } text-white shadow-2xl`}>
            {status === 'loading' && <Github className="w-16 h-16" />}
            {status === 'success' && <CheckCircle className="w-16 h-16" />}
            {status === 'error' && <XCircle className="w-16 h-16" />}
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-2xl md:text-3xl font-bold">
            {status === 'loading' && 'Connecting to GitHub'}
            {status === 'success' && 'Successfully Connected!'}
            {status === 'error' && 'Connection Failed'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {message}
          </p>
        </motion.div>

        {/* Loading indicator */}
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-primary rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Progress steps */}
        {processing && status === 'loading' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 backdrop-blur-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Authenticating with GitHub</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 backdrop-blur-sm">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Fetching repository access</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 backdrop-blur-sm">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Redirecting to repository selection</span>
            </div>
          </motion.div>
        )}

        {/* Success/Error message */}
        {!processing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-lg ${
              status === 'success' 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}
          >
            <p className="text-sm">
              {status === 'success' 
                ? 'Redirecting you to select repositories...' 
                : 'Redirecting you back...'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}