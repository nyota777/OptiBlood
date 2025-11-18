import React, { useState, FormEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Heart, Mail, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '../ui/theme-toggle';
import { authAPI } from '../../services/api';
import api from '../../services/api';

interface LoginProps {
  onLogin: (email: string, password: string, role?: any) => void;
  onNavigate: (view: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function Login({ onLogin, onNavigate, isDarkMode, onToggleTheme }: LoginProps) {
  const [step, setStep] = useState<'login' | 'twoFactor'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call actual backend API
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });

      // Check if 2FA is required
      if (response.data.requires2FA) {
        setTempToken(response.data.tempToken);
        setStep('twoFactor');
        toast.info('Please enter your 2FA code');
        setIsLoading(false);
        return;
      }

      // No 2FA required - complete login
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(`Welcome back, ${user.name}!`);
      onLogin(formData.email, formData.password, user.role);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (twoFactorCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/2fa/validate', {
        tempToken,
        token: twoFactorCode
      });

      // 2FA verification successful
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Login successful!');
      onLogin(formData.email, formData.password, user.role);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid 2FA code';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'hospital' | 'blood_bank' | 'admin') => {
    setIsLoading(true);
    
    const demoCredentials: Record<string, { email: string; password: string }> = {
      hospital: { email: '', password: '' },
      blood_bank: { email: '', password: '' },
      admin: { email: '', password: '' }
    };

    const credentials = demoCredentials[role];

    try {
      const response = await authAPI.login(credentials);
      
      // Check if 2FA required
      if (response.data.requires2FA) {
        setFormData(credentials);
        setTempToken(response.data.tempToken);
        setStep('twoFactor');
        toast.info('This demo account has 2FA enabled. Please enter code.');
        setIsLoading(false);
        return;
      }

      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success(`Logged in as ${role.replace('_', ' ')} demo user`);
      onLogin(credentials.email, credentials.password, user.role);
    } catch (error: any) {
      toast.error('Demo login failed. Make sure backend is running and seeded.');
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:5001/api/auth/google';
  };

  // 2FA Verification Screen
  if (step === 'twoFactor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-between items-start">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-semibold">Two-Factor Authentication</h1>
              <p className="text-muted-foreground mt-2">Enter your 6-digit code</p>
            </div>
            <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Verify Your Identity</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setTwoFactorCode(value);
                    }}
                    autoFocus
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={isLoading || twoFactorCode.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify and Sign In'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep('login');
                    setTwoFactorCode('');
                    setTempToken('');
                  }}
                >
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Login Screen
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
            <p className="text-muted-foreground mt-2">AI-Powered Blood Management System</p>
          </div>
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                className="text-red-600 hover:text-red-700"
                onClick={() => onNavigate('password-reset')}
              >
                Forgot your password?
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Google Sign In */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Demo Login Options */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Quick Demo Access:</p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin('hospital')}
                  disabled={isLoading}
                  className="justify-start"
                >
                  <Heart className="h-4 w-4 mr-2 text-blue-600" />
                  Hospital Demo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin('blood_bank')}
                  disabled={isLoading}
                  className="justify-start"
                >
                  <Heart className="h-4 w-4 mr-2 text-green-600" />
                  Blood Bank Demo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isLoading}
                  className="justify-start"
                >
                  <Heart className="h-4 w-4 mr-2 text-purple-600" />
                  Admin Demo
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-muted-foreground">Don't have an account?</p>
              <Button
                variant="link"
                className="text-red-600 hover:text-red-700"
                onClick={() => onNavigate('register')}
              >
                Create Account
              </Button>
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