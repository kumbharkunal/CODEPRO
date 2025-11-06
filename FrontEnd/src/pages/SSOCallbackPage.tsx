import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export default function SSOCallbackPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (!isLoaded) return;

      // Wait for Clerk to fully process the OAuth callback
      // The redirect is handled automatically by Clerk
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds total
      
      const checkSignIn = setInterval(() => {
        attempts++;
        
        if (isSignedIn) {
          clearInterval(checkSignIn);
          console.log('✅ OAuth sign-in successful, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else if (attempts >= maxAttempts) {
          clearInterval(checkSignIn);
          console.error('❌ OAuth callback timeout - user not signed in after 10 seconds');
          setError('Authentication is taking longer than expected. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      }, 500);

      // Cleanup interval on unmount
      return () => clearInterval(checkSignIn);
    };

    handleCallback();
  }, [isLoaded, isSignedIn, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md px-4">
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