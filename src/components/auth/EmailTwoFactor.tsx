import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Heart, Shield, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ThemeToggle } from '../ui/theme-toggle';

interface EmailTwoFactorProps {
  email: string;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  mode?: 'setup' | 'login';
}

export function EmailTwoFactor({ 
  email, 
  onComplete, 
  onCancel, 
  isDarkMode, 
  onToggleTheme,
  mode = 'login'
}: EmailTwoFactorProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sentCode, setSentCode] = useState(''); // Mock: stores the sent code

  // Simulate sending verification code on mount
  useEffect(() => {
    sendVerificationCode();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const sendVerificationCode = () => {
    // Mock: Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    
    // In real app, this would send the code via email
    toast.success(`Verification code sent to ${email}`);
    toast.info(`Demo code: ${code}`, { duration: 10000 });
    
    setCountdown(60);
    setCanResend(false);
  };

  const handleResendCode = () => {
    if (canResend) {
      sendVerificationCode();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      setIsLoading(false);
      return;
    }

    // Simulate verification process
    setTimeout(() => {
      // Mock verification - check against sent code
      if (verificationCode === sentCode) {
        toast.success(mode === 'setup' ? 'Email 2FA enabled successfully!' : '2FA verification successful!');
        onComplete(true);
      } else {
        toast.error('Invalid verification code. Please try again.');
        setVerificationCode('');
      }
      setIsLoading(false);
    }, 1000);
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, start, middle, end) => 
    start + '*'.repeat(Math.min(middle.length, 4)) + end
  );

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
            <p className="text-muted-foreground mt-2">
              {mode === 'setup' ? 'Verify your email' : 'Two-factor authentication'}
            </p>
          </div>
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <CardTitle>Email Verification</CardTitle>
            </div>
            <CardDescription>
              We've sent a verification code to {maskedEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="pl-10 text-center text-lg font-mono tracking-widest"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Check your email inbox (and spam folder) for the code
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Didn't receive the code?
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      onClick={handleResendCode}
                      disabled={!canResend}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${!canResend ? 'opacity-50' : ''}`} />
                      {canResend ? 'Resend code' : `Resend in ${countdown}s`}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
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