import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { AlertCircle, CheckCircle2, Shield, Key } from 'lucide-react';

interface MFASetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function MFASetup({ isOpen, onClose, onComplete }: MFASetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

  const handleSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/security/mfa/setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to setup MFA');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/security/mfa/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      setStep('backup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Setup Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication (2FA) adds an additional layer of security to your account.
              You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
            </p>
            
            <Button 
              onClick={handleSetup} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Begin Setup'}
            </Button>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-center text-muted-foreground">
                Scan this QR code with your authenticator app
              </p>
              
              {qrCode && (
                <img 
                  src={qrCode} 
                  alt="MFA QR Code" 
                  className="w-48 h-48 border-2 border-border rounded-lg"
                />
              )}

              <div className="w-full space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Or enter this code manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded text-center font-mono">
                    {secret}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(secret)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Enter 6-digit code</label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>

            <Button 
              onClick={handleVerify} 
              disabled={loading || verificationCode.length !== 6}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </Button>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">MFA Enabled Successfully!</span>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Key className="h-4 w-4" />
                <span className="font-medium text-sm">Save Your Backup Codes</span>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded-lg">
              {backupCodes.map((code, index) => (
                <code key={index} className="text-xs font-mono bg-background p-2 rounded text-center">
                  {code}
                </code>
              ))}
            </div>

            <Button 
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              variant="outline"
              className="w-full"
            >
              Copy All Codes
            </Button>

            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
