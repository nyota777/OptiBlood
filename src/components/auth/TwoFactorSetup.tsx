import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Heart, Smartphone, Mail, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '../ui/theme-toggle';
import api from '../../services/api';


interface TwoFactorSetupProps {
  onComplete: (enabled: boolean) => void;
  onSkip: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  email: string;
}

export function TwoFactorSetup({ 
  onComplete, 
  onSkip, 
  isDarkMode, 
  onToggleTheme,
  email 
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'choose' | 'setup' | 'verify'>('choose');
  const [method, setMethod] = useState<'app' | 'email'>('app');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Setup 2FA and get QR code
  const handleSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/2fa/setup');
      
      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.secret);
      setStep('setup');
      
      toast.success('2FA setup initiated!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to setup 2FA';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 2FA code
  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/2fa/verify', {
        token: verificationCode
      });

      toast.success('2FA enabled successfully! 🎉');
      onComplete(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Invalid verification code';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Choose method step
  if (step === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-between items-start">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-semibold">Secure Your Account</h1>
              <p className="text-muted-foreground mt-2">Enable Two-Factor Authentication</p>
            </div>
            <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Choose 2FA Method</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Authenticator App Option */}
              <button
                onClick={() => {
                  setMethod('app');
                  handleSetup();
                }}
                className="w-full p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                disabled={isLoading}
              >
                <div className="flex items-start gap-4">
                  <Smartphone className="h-6 w-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Authenticator App</h3>
                    <p className="text-sm text-muted-foreground">
                      Use Google Authenticator, Authy, or similar apps
                    </p>
                    <span className="text-xs text-blue-600 font-medium">Recommended</span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </button>

              {/* Email Option (Coming Soon) */}
              <div className="w-full p-4 border rounded-lg opacity-50 cursor-not-allowed">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Email Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive codes via email to {email}
                    </p>
                    <span className="text-xs text-gray-500">Coming Soon</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onSkip}
                >
                  Skip for Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Setup step - Show QR code
  if (step === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold">Scan QR Code</h1>
            <p className="text-muted-foreground mt-2">Use your authenticator app</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Step 1: Scan QR Code</CardTitle>
              <CardDescription>
                Open your authenticator app and scan this QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {qrCode ? (
                  <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 bg-gray-200 rounded animate-pulse" />
                )}
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label>Or enter this key manually:</Label>
                <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                  {secret}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Recommended Apps:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Google Authenticator</li>
                  <li>Microsoft Authenticator</li>
                  <li>Authy</li>
                  <li>1Password</li>
                </ul>
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => setStep('verify')}
              >
                Continue to Verification
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={onSkip}
              >
                Skip for Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Verify step - Enter code
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold">Verify Setup</h1>
            <p className="text-muted-foreground mt-2">Enter the 6-digit code</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Verify Code</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setVerificationCode(value);
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify and Enable 2FA'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep('setup')}
                disabled={isLoading}
              >
                Back to QR Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}