-- ============================================
-- ADVANCED SECURITY SCHEMA MIGRATION
-- Multi-Factor Authentication & Passkey Support
-- ============================================

-- MFA Settings Table
CREATE TABLE IF NOT EXISTS user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  totp_secret TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[] DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- WebAuthn/Passkey Authenticators Table
CREATE TABLE IF NOT EXISTS user_authenticators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  transports TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Passkey Challenges (temporary storage)
CREATE TABLE IF NOT EXISTS passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions Table (JWT refresh token management)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Audit Log
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed Login Attempts (for rate limiting & brute force protection)
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  ip_address TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_user_id ON user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_authenticators_user_id ON user_authenticators(user_id);
CREATE INDEX IF NOT EXISTS idx_user_authenticators_credential_id ON user_authenticators(credential_id);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_user_id ON passkey_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires_at ON passkey_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);

-- Row Level Security (RLS) Policies
ALTER TABLE user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_authenticators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only access their own MFA settings
DROP POLICY IF EXISTS "Users can view own MFA settings" ON user_mfa_settings;
CREATE POLICY "Users can view own MFA settings" ON user_mfa_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own MFA settings" ON user_mfa_settings;
CREATE POLICY "Users can update own MFA settings" ON user_mfa_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own authenticators
DROP POLICY IF EXISTS "Users can view own authenticators" ON user_authenticators;
CREATE POLICY "Users can view own authenticators" ON user_authenticators
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own authenticators" ON user_authenticators;
CREATE POLICY "Users can delete own authenticators" ON user_authenticators
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only access their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON security_audit_log;
CREATE POLICY "Users can view own audit logs" ON security_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Function to automatically clean up expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM passkey_challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_success BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_log (user_id, event_type, event_data, ip_address, user_agent, success)
  VALUES (p_user_id, p_event_type, p_event_data, p_ip_address, p_user_agent, p_success)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_failed_login_attempts_updated_at
  BEFORE UPDATE ON failed_login_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust based on your setup)
GRANT SELECT, INSERT, UPDATE ON user_mfa_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_authenticators TO authenticated;
GRANT SELECT, INSERT, DELETE ON passkey_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON security_audit_log TO authenticated;

COMMENT ON TABLE user_mfa_settings IS 'Stores multi-factor authentication settings including TOTP secrets and backup codes';
COMMENT ON TABLE user_authenticators IS 'Stores WebAuthn/Passkey credentials for biometric authentication';
COMMENT ON TABLE passkey_challenges IS 'Temporary storage for WebAuthn challenges during registration and authentication';
COMMENT ON TABLE user_sessions IS 'Manages user sessions with JWT refresh tokens for secure token-based authentication';
COMMENT ON TABLE security_audit_log IS 'Comprehensive audit trail of all security-related events';
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for brute force protection';
