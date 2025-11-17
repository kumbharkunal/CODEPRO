import { useSignIn, useSignUp, useUser, useAuth } from '@clerk/clerk-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Code2, Mail, Eye, EyeOff, Loader2, Github } from 'lucide-react';

export default function LoginPage() {
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useAuth();
  const { signIn, setActive } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  useEffect(() => {
    if (userLoaded && authLoaded && isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSignedIn, userLoaded, authLoaded, navigate]);

  if (!userLoaded || !authLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isSignUp) {
        if (!signIn) throw new Error('Sign-in service not available');
        
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === 'complete') {
          await setActive!({ session: result.createdSessionId });
          setTimeout(() => navigate('/dashboard', { replace: true }), 500);
        } else {
          setError('Sign-in incomplete. Please try again.');
        }
      } else {
        if (!signUp) throw new Error('Sign-up service not available');
        
        const result = await signUp.create({
          emailAddress: email,
          password,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || undefined,
        });

        if (result.status === 'complete') {
          await setActiveSignUp!({ session: result.createdSessionId });
          setTimeout(() => navigate('/dashboard', { replace: true }), 500);
        } else if (result.status === 'missing_requirements') {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setPendingVerification(true);
          setError('');
        } else {
          setError('Sign-up incomplete. Please check your information.');
        }
      }
    } catch (err) {
      const error = err as { errors?: Array<{ message?: string }>; message?: string };
      const errorMessage = error?.errors?.[0]?.message || error?.message || 'Authentication failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!signUp) throw new Error('Sign-up service not available');
      
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });

      if (result.status === 'complete') {
        await setActiveSignUp!({ session: result.createdSessionId });
        setTimeout(() => navigate('/dashboard', { replace: true }), 500);
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err) {
      const error = err as { errors?: Array<{ message?: string }>; message?: string };
      const errorMessage = error?.errors?.[0]?.message || error?.message || 'Invalid verification code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthAuth = async (strategy: 'oauth_google' | 'oauth_github') => {
    setLoading(true);
    setError('');
    
    try {
      if (!signUp) throw new Error('Sign-up service not available');

      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: window.location.origin + '/dashboard',
        redirectUrlComplete: window.location.origin + '/dashboard',
      });
    } catch (err) {
      const error = err as { errors?: Array<{ message?: string }>; message?: string };
      const errorMessage = error?.errors?.[0]?.message || error?.message || 'OAuth authentication failed';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-500/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-indigo-500/30">
              <Code2 className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">CodePro</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-white">
              AI-Powered<br /><span className="text-indigo-400">PR Reviews</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-md">
              Automated code reviews for your GitHub pull requests. Get intelligent feedback instantly.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-400 text-sm">
            Join developers using AI to improve their code quality and ship faster.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white relative">
        <div className="absolute top-6 left-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">CodePro</h1>
          </div>
        </div>

        <div className="w-full max-w-md pt-20 lg:pt-0">
          {!pendingVerification && (
            <div className="flex justify-center mb-2">
              <div className="relative bg-gray-100 rounded-full p-1 inline-flex">
                <div
                  className="absolute top-1 bottom-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg transition-all duration-300"
                  style={{
                    left: isSignUp ? '50%' : '4px',
                    right: isSignUp ? '4px' : '50%',
                  }}
                />
                <button
                  onClick={() => !isSignUp && setIsSignUp(false)}
                  className={`relative z-10 px-8 py-2.5 rounded-full font-medium transition-colors duration-200 ${
                    !isSignUp ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => isSignUp || setIsSignUp(true)}
                  className={`relative z-10 px-8 py-2.5 rounded-full font-medium transition-colors duration-200 ${
                    isSignUp ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {pendingVerification ? 'Verify Your Email' : isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {pendingVerification
                ? 'We sent a verification code to your email'
                : isSignUp
                ? 'Start reviewing your GitHub PRs with AI'
                : 'Sign in to access your AI-powered PR reviews'}
            </p>
          </div>

          {pendingVerification ? (
            <form onSubmit={handleVerifyEmail} className="space-y-4 mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-600">
                  We sent a verification code to <span className="font-medium">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-gray-900 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Verifying...</> : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={() => { setPendingVerification(false); setVerificationCode(''); setError(''); }}
                className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Back to sign up
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-gray-900"
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-gray-900"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-gray-900"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleOAuthAuth('oauth_github')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  <Github className="w-5 h-5" />
                  Continue with GitHub
                </button>
                <button
                  onClick={() => handleOAuthAuth('oauth_google')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
