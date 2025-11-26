import React, { useState, FormEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Heart, User, Mail, Lock, Building } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../../App';
import { ThemeToggle } from '../ui/theme-toggle';
import { TwoFactorSetup } from './TwoFactorSetup';
import { authAPI } from '../../services/api';

interface RegisterProps {
  onRegister: (userData: any) => void;
  onNavigate: (view: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function Register({ onRegister, onNavigate, isDarkMode, onToggleTheme }: RegisterProps) {
  const [step, setStep] = useState<'register' | 'twoFactor'>('register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '' as UserRole | '',
    hospitalName: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.role || !formData.hospitalName || !formData.password) {
      toast.error('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Call backend API
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        hospital_name: formData.hospitalName,
        role: formData.role
      });

      // Store token and user info
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Success notification
      toast.success(`Welcome to OptiBlood, ${user.name}!`);

      // Ask if user wants to set up 2FA
      const setup2FA = window.confirm('Would you like to set up Two-Factor Authentication for extra security? (Recommended)');
      
      if (setup2FA) {
        setStep('twoFactor');
      } else {
        // Complete registration without 2FA
        onRegister({
          ...formData,
          twoFactorEnabled: false
        });
      }

    } catch (error: any) {
      // Handle errors from backend
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:5001/api/auth/google';
  };

  const handleTwoFactorComplete = (enabled: boolean) => {
    // Update user object
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.two_factor_enabled = enabled;
    localStorage.setItem('user', JSON.stringify(user));

    // Complete registration
    onRegister({
      ...formData,
      twoFactorEnabled: enabled
    });
  };

  const handleSkipTwoFactor = () => {
    onRegister({
      ...formData,
      twoFactorEnabled: false
    });
  };

  const getRolePlaceholder = () => {
    switch (formData.role) {
      case 'staff':
        return 'e.g., City General Hospital';
      case 'admin':
        return 'e.g., Regional Health Authority';
      default:
        return 'Enter hospital name';
    }
  };

  // Show 2FA setup after successful registration
  if (step === 'twoFactor') {
    return (
      <TwoFactorSetup
        email={formData.email}
        onComplete={handleTwoFactorComplete}
        onSkip={handleSkipTwoFactor}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
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
            <p className="text-muted-foreground mt-2">Create your account</p>
          </div>
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Join the OptiBlood network to optimize blood management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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
                <Label htmlFor="role">Account Type</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Hospital Staff</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="hospital"
                    type="text"
                    placeholder={getRolePlaceholder()}
                    className="pl-10"
                    value={formData.hospitalName}
                    onChange={(e) => setFormData(prev => ({ ...prev, hospitalName: e.target.value }))}
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
                    placeholder="Create a password (min. 6 characters)"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
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

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">Already have an account?</p>
              <Button
                variant="link"
                className="text-red-600 hover:text-red-700"
                onClick={() => onNavigate('login')}
              >
                Sign In
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