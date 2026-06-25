import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card';
import { Button } from '../button';
import { Badge } from '../badge';
import { Separator } from '../separator';
import { Shield, Fingerprint, Key, Smartphone, Monitor, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MFASetup } from './mfa-setup';
import { PasskeySetup } from './passkey-setup';

export function SecuritySettings() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    setLoading(true);
    try {
      const [mfaRes, passkeysRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/security/mfa/status`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/security/passkey/list`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/security/sessions`, { credentials: 'include' }),
      ]);

      if (mfaRes.ok) {
        const mfaData = await mfaRes.json();
        setMfaEnabled(mfaData.mfaEnabled);
      }

      if (passkeysRes.ok) {
        const passkeysData = await passkeysRes.json();
        setPasskeys(passkeysData.passkeys || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch security status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    const code = prompt('Enter your 6-digit authentication code to disable MFA:');
    if (!code) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/security/mfa/disable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        setMfaEnabled(false);
        alert('MFA disabled successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to disable MFA');
      }
    } catch (error) {
      alert('Failed to disable MFA');
    }
  };

  const handleDeletePasskey = async (authenticatorId: string) => {
    if (!confirm('Are you sure you want to delete this passkey?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/security/passkey/${authenticatorId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setPasskeys(passkeys.filter(p => p.id !== authenticatorId));
      } else {
        alert('Failed to delete passkey');
      }
    } catch (error) {
      alert('Failed to delete passkey');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/security/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
      } else {
        alert('Failed to revoke session');
      }
    } catch (error) {
      alert('Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('This will sign you out from all devices. Continue?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/security/sessions/revoke-all`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        alert('All sessions revoked. You will be signed out.');
        window.location.reload();
      } else {
        alert('Failed to revoke sessions');
      }
    } catch (error) {
      alert('Failed to revoke sessions');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Security Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your account security and authentication methods
        </p>
      </div>

      <Separator />

      {/* Multi-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security with time-based codes from your authenticator app
              </CardDescription>
            </div>
            {mfaEnabled ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {mfaEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication using a TOTP authenticator app.
              </p>
              <Button variant="destructive" onClick={handleDisableMFA}>
                Disable MFA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your account by requiring a second factor during sign-in.
              </p>
              <Button onClick={() => setShowMFASetup(true)}>
                <Key className="h-4 w-4 mr-2" />
                Setup MFA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Biometric Passkeys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Biometric Passkeys
              </CardTitle>
              <CardDescription>
                Sign in quickly and securely using your fingerprint, face, or device PIN
              </CardDescription>
            </div>
            {passkeys.length > 0 && (
              <Badge variant="default">
                {passkeys.length} {passkeys.length === 1 ? 'Passkey' : 'Passkeys'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {passkeys.length > 0 ? (
            <>
              <div className="space-y-2">
                {passkeys.map((passkey) => (
                  <div key={passkey.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Passkey • Added {new Date(passkey.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {passkey.transports?.join(', ') || 'Platform authenticator'}
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeletePasskey(passkey.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button onClick={() => setShowPasskeySetup(true)} variant="outline">
                <Fingerprint className="h-4 w-4 mr-2" />
                Add Another Passkey
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Passkeys provide passwordless authentication using your device's biometric sensors.
                More secure and convenient than traditional passwords.
              </p>
              <Button onClick={() => setShowPasskeySetup(true)}>
                <Fingerprint className="h-4 w-4 mr-2" />
                Register Passkey
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage devices and locations where you're currently signed in
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button variant="destructive" size="sm" onClick={handleRevokeAllSessions}>
                Sign Out All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sessions found</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {session.user_agent || 'Unknown Device'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.ip_address} • Active since {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <MFASetup 
        isOpen={showMFASetup} 
        onClose={() => setShowMFASetup(false)}
        onComplete={() => {
          setMfaEnabled(true);
          fetchSecurityStatus();
        }}
      />

      <PasskeySetup 
        isOpen={showPasskeySetup} 
        onClose={() => setShowPasskeySetup(false)}
        onComplete={fetchSecurityStatus}
      />
    </div>
  );
}
