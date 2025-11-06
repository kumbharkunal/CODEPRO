import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export default function SSOCallbackPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { handleRedirectCallback } = useClerk();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the OAuth callback
        await handleRedirectCallback();
        
        // Wait a bit for Clerk to fully process the sign-in
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if signed in after callback
        if (isLoaded && isSignedIn) {
          console.log('✅ OAuth sign-in successful, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else if (isLoaded && !isSignedIn) {
          console.error('❌ OAuth callback completed but user not signed in');
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    };

    if (isLoaded) {
      handleCallback();
    }
  }, [isLoaded, isSignedIn, navigate, handleRedirectCallback]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-lg text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
        <p className="text-lg text-gray-900 mb-2">Completing sign in...</p>
        <p className="text-sm text-gray-600">Please wait while we verify your account</p>
      </div>
    </div>
  );
}