import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { githubService } from '@/services/githubService';
import toast from 'react-hot-toast';

export default function GitHubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error('GitHub authentication failed');
        navigate('/repositories');
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate('/repositories');
        return;
      }

      try {
        // Exchange code for token
        const data = await githubService.exchangeCode(code);
        
        // Store token temporarily (you might want to use localStorage)
        localStorage.setItem('github_token', data.accessToken);
        
        toast.success('GitHub connected successfully!');
        navigate('/repositories/connect');
      } catch (error) {
        console.error('GitHub callback error:', error);
        toast.error('Failed to connect GitHub');
        navigate('/repositories');
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">
          {processing ? 'Connecting to GitHub...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}