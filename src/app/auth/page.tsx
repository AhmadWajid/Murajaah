'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create account');
        await refreshUser();
        router.push('/');
      } else {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to sign in');
        await refreshUser();
        router.push('/');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      {/* Ornamental top border */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-xl)] bg-accent/10 border border-accent/20 mb-4">
            <BookOpen className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Murajaah</h1>
          <p className="font-arabic text-lg text-accent mt-1" dir="rtl">السلام عليكم</p>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === 'login' ? 'Sign in to sync your memorization progress' : 'Create an account to begin your journey'}
          </p>
        </div>

        {/* Card */}
        <div className="panel-surface rounded-[var(--radius-xl)] p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-[var(--radius-md)] bg-muted/50">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-[var(--radius-sm)] text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-[var(--radius-sm)] text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-[var(--radius)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 rounded-[var(--radius)]"
              />
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 rounded-[var(--radius)]"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-[var(--radius-sm)] px-3 py-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-[var(--radius)] text-sm font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-popover px-3 text-xs text-muted-foreground uppercase tracking-wide">or</span>
            </div>
          </div>

          {/* Guest */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/')}
            className="w-full h-11 rounded-[var(--radius)] text-muted-foreground hover:text-foreground"
          >
            Continue as Guest
          </Button>
          <p className="text-xs text-center text-muted-foreground -mt-2">
            Your progress will be saved locally on this device
          </p>
        </div>

        {/* Switch mode */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="text-accent font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Ornamental bottom border */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
    </div>
  );
}
