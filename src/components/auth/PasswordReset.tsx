import React, { useState, FormEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Heart, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '../ui/theme-toggle';
import api from '../../services/api';

interface PasswordResetProps {
  onNavigate: (view: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function PasswordReset({ onNavigate, isDarkMode, onToggleTheme }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Call backend API
      await api.post('/auth/forgot-password', { email });
      
      setIsSubmitted(true);
      toast.success('Password reset instructions sent to your email!');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset instructions';
      toast.error(errorMessage);
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header with theme toggle */}
          <div className="flex justify-between items-start">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-semibold">Check Your Email</h1>
              <p className="text-muted-foreground mt-2">Reset instructions sent</p>
            </div>
            <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
          </div>

          {/* Success Message */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Email Sent Successfully!</CardTitle>
              <CardDescription>
                We've sent password reset instructions to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  📧 <strong>Check your email inbox</strong> (and spam folder) for the reset link.
                  The link will expire in 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  Try Different Email
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onNavigate('login')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Help */}
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Didn't receive the email?</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you entered the correct email</li>
                  <li>• Wait a few minutes for delivery</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-start">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold">OptiBlood</h1>
            <p className="text-muted-foreground mt-2">Reset your password</p>
          </div>
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </div>

        {/* Password Reset Form */}
        <Card>
          <CardHeader>
            <CardTitle>Forgot Your Password?</CardTitle>
            <CardDescription>
              No worries! Enter your email address and we'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => onNavigate('login')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Need help?</p>
              <p className="text-sm text-muted-foreground">
                Contact support at{' '}
                <a href="mailto:support@optiblood.com" className="text-red-600 hover:text-red-700">
                  support@optiblood.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 OptiBlood. Healthcare Technology Solutions.</p>
        </div>
      </div>
    </div>
  );
}