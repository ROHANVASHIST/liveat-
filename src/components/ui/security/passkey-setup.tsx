import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../dialog';
import { Button } from '../button';
import { AlertCircle, CheckCircle2, Fingerprint } from 'lucide-react';

interface PasskeySetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function PasskeySetup({ isOpen, onClose, onComplete }: PasskeySetupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

  const handleRegisterPasskey = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Get registration options from server
      const optionsResponse = await fetch(`${API_BASE_URL}/api/security/passkey/register/options`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!optionsResponse.ok) {
        const data = await optionsResponse.json();
        throw new Error(data.error || 'Failed to initiate passkey registration');
      }

      const options = await optionsResponse.json();

      // Start WebAuthn registration flow
      const credential = await startRegistration(options);

      // Send credential to server for verification
      const verifyResponse = await fetch(`${API_BASE_URL}/api/security/passkey/register/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: credential }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Passkey verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Passkey registration error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Passkey registration was cancelled or not allowed');
      } else if (err.name === 'NotSupportedError') {
        setError('Passkeys are not supported on this device or browser');
      } else {
        setError(err.message || 'Failed to register passkey');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            Setup Biometric Passkey
          </DialogTitle>
          <DialogDescription>
            Use your fingerprint, face, or device PIN to sign in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!success ? (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">What are Passkeys?</h4>
                <p className="text-xs text-muted-foreground">
                  Passkeys are a secure, passwordless way to sign in using your device's biometric sensors
                  (fingerprint, face recognition) or PIN. They're more secure than passwords and can't be
                  phished or stolen.
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Works with fingerprint scanners, Face ID, Touch ID, or Windows Hello</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>More secure than passwords - can't be guessed or stolen</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Sign in faster without typing passwords</span>
                </p>
              </div>

              <Button 
                onClick={handleRegisterPasskey} 
                disabled={loading}
                className="w-full"
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                {loading ? 'Registering...' : 'Register Passkey'}
              </Button>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Your passkey is stored securely on this device and never shared with our servers.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium">Passkey Registered!</h3>
                <p className="text-sm text-muted-foreground">
                  You can now use biometric authentication to sign in
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
