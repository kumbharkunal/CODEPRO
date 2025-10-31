import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const { isSignedIn } = useUser();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Welcome to CodePro</h1>
          <p className="text-muted-foreground">
            AI-powered code reviews for your GitHub repositories
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'signin' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('signin')}
          >
            Sign In
          </Button>
          <Button
            variant={mode === 'signup' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('signup')}
          >
            Sign Up
          </Button>
        </div>

        {mode === 'signin' ? (
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none',
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/login"
          />
        ) : (
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none',
              },
            }}
            routing="path"
            path="/login"
            signInUrl="/login"
          />
        )}
      </Card>
    </div>
  );
}