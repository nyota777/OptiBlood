import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Heart, Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '../ui/theme-toggle';
import api from '../../services/api';

interface ResetPasswordFormProps {
  token: string;
  onNavigate: (view: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function ResetPasswordForm({ token, onNavigate, isDarkMode, onToggleTheme }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setIsValidToken(false);
    }
  }, [token]);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await api.get(`/auth/verify-reset-token/${tokenToVerify}`);
      setIsValidToken(true);
      setUserEmail(response.data.data.email);
    } catch (error) {
      setIsValidToken(false);
      toast.error('Invalid or expired reset link');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        password
      });

      toast.success('Password reset successful!');
      setResetSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        onNavigate('login');
      }, 3000);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mx-auto mb-4">
              <XCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold">Invalid Reset Link</h1>
            <p className="text-muted-foreground mt-2">This password reset link is invalid or has expired</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Password reset links expire after 1 hour for security reasons.
                </p>
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => onNavigate('password-reset')}
              >
                Request New Reset Link
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate('login')}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success screen
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold">Password Reset!</h1>
            <p className="text-muted-foreground mt-2">Your password has been successfully reset</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-center text-sm text-green-800 dark:text-green-200">
                  ✓ You can now login with your new password
                </p>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to login page in 3 seconds...
              </p>
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => onNavigate('login')}
              >
                Go to Login Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-between items-start">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold">Set New Password</h1>
            <p className="text-muted-foreground mt-2">For {userEmail}</p>
          </div>
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min. 6 characters)"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {password.length < 6 && 'Password must be at least 6 characters'}
                    {password.length >= 6 && password.length < 8 && 'Good password'}
                    {password.length >= 8 && 'Strong password'}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 OptiBlood. Healthcare Technology Solutions.</p>
        </div>
      </div>
    </div>
  );
}