import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { ScrollArea } from '../scroll-area';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Check, 
  X, 
  Copy, 
  RefreshCw,
  Eye,
  EyeOff,
  QrCode,
  Lock,
  AlertTriangle,
  Download,
  Trash2,
  Clock,
  RefreshCw as DeviceRefresh,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable2FA: (code: string) => Promise<boolean>;
  onDisable2FA: (code: string) => Promise<boolean>;
  isEnabled?: boolean;
  secret?: string;
  qrCodeUrl?: string;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  isOpen,
  onOpenChange,
  onEnable2FA,
  onDisable2FA,
  isEnabled = false,
  secret = '',
  qrCodeUrl = '',
}) => {
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backup' | 'disabled'>('intro');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Generate backup codes
  const generateBackupCodes = () => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Array.from({ length: 8 }, () => 
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 28)]
      ).join('-');
      codes.push(code);
    }
    setBackupCodes(codes);
    return codes;
  };

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const success = await onEnable2FA(verificationCode);
      if (success) {
        setBackupCodes(generateBackupCodes());
        setStep('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!verificationCode) {
      setError('Enter your current 2FA code to disable');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await onDisable2FA(verificationCode);
      if (success) {
        setStep('disabled');
      } else {
        setError('Invalid code. Cannot disable 2FA.');
      }
    } catch (err) {
      setError('Failed to disable 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        {step === 'intro' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                isEnabled ? "bg-green-100" : "bg-secondary"
              )}>
                <Smartphone className={cn(
                  "w-10 h-10",
                  isEnabled ? "text-green-600" : "text-muted-foreground"
                )} />
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-semibold mb-2">
                {isEnabled ? '2FA is enabled' : 'Add an extra layer of security'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? 'Your account is protected with two-factor authentication.'
                  : 'Two-factor authentication adds an extra layer of security by requiring a verification code in addition to your password.'
                }
              </p>
            </div>

            {isEnabled && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Protected</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!isEnabled && (
                <Button
                  onClick={() => setStep('setup')}
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              )}
              
              <Button
                variant={isEnabled ? "destructive" : "outline"}
                onClick={() => {
                  if (isEnabled) {
                    setStep('disabled');
                  } else {
                    onOpenChange(false);
                  }
                }}
                className="w-full"
              >
                {isEnabled ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Disable 2FA
                  </>
                ) : (
                  'Maybe later'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Set up authenticator app</h3>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="flex justify-center py-4">
                <div className="p-4 bg-white rounded-lg border border-border">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}

            {/* Secret key */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Or enter this code manually
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-secondary rounded font-mono text-sm break-all">
                  {showSecret ? secret : '••••••••••••••••'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(secret)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Verification input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Enter the 6-digit code from your app
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('intro');
                  setVerificationCode('');
                  setError('');
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSetup}
                disabled={verificationCode.length !== 6 || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2FA is enabled!</h3>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.
              </p>
            </div>

            {/* Backup codes */}
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Backup codes</span>
                <button
                  onClick={copyBackupCodes}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.slice(0, 5).map((code, i) => (
                  <code key={i} className="bg-background px-2 py-1 rounded">
                    {code}
                  </code>
                ))}
                {backupCodes.slice(5).map((code, i) => (
                  <code key={i + 5} className="bg-background px-2 py-1 rounded">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <strong>Important:</strong> Store these codes securely. Each code can only be used once. If you lose both your authenticator and these codes, you may lose access to your account.
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                onOpenChange(false);
                setStep('intro');
                setVerificationCode('');
              }}
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}

        {step === 'disabled' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold mb-2">Disable Two-Factor Authentication?</h3>
              <p className="text-sm text-muted-foreground">
                This will make your account less secure. Enter your current 2FA code to confirm.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Enter 2FA code to disable
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('intro');
                  setVerificationCode('');
                  setError('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={verificationCode.length !== 6 || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Session management component
interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: Date;
  isCurrentSession: boolean;
}

export const SessionManagement: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: Session[];
  onRevokeSession?: (sessionId: string) => void;
  onRevokeAllOther?: () => void;
}> = ({ isOpen, onOpenChange, sessions, onRevokeSession, onRevokeAllOther }) => {
  const currentSession = sessions.find(s => s.isCurrentSession);
  const otherSessions = sessions.filter(s => !s.isCurrentSession);

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DeviceRefresh className="w-5 h-5" />
            Active Sessions
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {/* Current session */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                This device
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  Current
                </span>
              </h3>
              {currentSession && (
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{currentSession.device}</div>
                      <div className="text-sm text-muted-foreground">
                        {currentSession.location}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        IP: {currentSession.ip}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatLastActive(currentSession.lastActive)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other sessions */}
            {otherSessions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">
                    Other sessions ({otherSessions.length})
                  </h3>
                  <button
                    onClick={onRevokeAllOther}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Log out all other sessions
                  </button>
                </div>
                
                <div className="space-y-2">
                  {otherSessions.map(session => (
                    <div
                      key={session.id}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{session.device}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.location}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            IP: {session.ip}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatLastActive(session.lastActive)}
                          </span>
                          <button
                            onClick={() => onRevokeSession?.(session.id)}
                            className="p-1 hover:bg-secondary rounded text-red-500"
                            title="Revoke session"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Privacy settings component
export const PrivacySettings: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    status: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
    onlineStatus: boolean;
    groupInvites: 'everyone' | 'contacts' | 'nobody';
  };
  onUpdateSettings: (settings: any) => void;
}> = ({ isOpen, onOpenChange, settings, onUpdateSettings }) => {
  const privacyOptions = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'contacts', label: 'My contacts' },
    { value: 'nobody', label: 'Nobody' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Privacy Settings
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <div className="space-y-6">
            {/* Last seen */}
            <div>
              <label className="text-sm font-medium mb-2 block">Last seen & online</label>
              <select
                value={settings.lastSeen}
                onChange={(e) => onUpdateSettings({ ...settings, lastSeen: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {privacyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Controls who can see when you were last active
              </p>
            </div>

            {/* Profile photo */}
            <div>
              <label className="text-sm font-medium mb-2 block">Profile photo</label>
              <select
                value={settings.profilePhoto}
                onChange={(e) => onUpdateSettings({ ...settings, profilePhoto: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {privacyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={settings.status}
                onChange={(e) => onUpdateSettings({ ...settings, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {privacyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Group invites */}
            <div>
              <label className="text-sm font-medium mb-2 block">Group invites</label>
              <select
                value={settings.groupInvites}
                onChange={(e) => onUpdateSettings({ ...settings, groupInvites: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {privacyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Who can add you to groups
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Read receipts</div>
                  <div className="text-xs text-muted-foreground">
                    Send read receipts when messages are read
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, readReceipts: !settings.readReceipts })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.readReceipts ? "bg-primary" : "bg-secondary"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                    settings.readReceipts ? "left-6" : "left-0.5"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Show online status</div>
                  <div className="text-xs text-muted-foreground">
                    Let others see when you're online
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, onlineStatus: !settings.onlineStatus })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.onlineStatus ? "bg-primary" : "bg-secondary"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                    settings.onlineStatus ? "left-6" : "left-0.5"
                  )} />
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};