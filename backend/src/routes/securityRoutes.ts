import { Router } from 'express';
import { mfaService } from '../services/mfaService';
import { passkeyService } from '../services/passkeyService';
import { tokenService } from '../services/tokenService';
import { authenticateJWT, rateLimitByIP, logSecurityEvent, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// ============================================
// MFA (TOTP) Routes
// ============================================

/**
 * Setup MFA - Generate QR code and backup codes
 */
router.post('/mfa/setup', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const userEmail = req.userEmail!;

    const result = await mfaService.setupMFA(userId, userEmail);

    await logSecurityEvent(userId, 'MFA_SETUP_INITIATED', {}, req);

    res.json({
      secret: result.secret,
      qrCode: result.qrCodeDataUrl,
      backupCodes: result.backupCodes,
    });
  } catch (error: any) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: error.message || 'Failed to setup MFA' });
  }
});

/**
 * Verify MFA code and enable MFA
 */
router.post('/mfa/verify', authenticateJWT, rateLimitByIP(5, 5 * 60 * 1000), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const result = await mfaService.verifyAndEnableMFA(userId, code);

    await logSecurityEvent(userId, 'MFA_ENABLED', {}, req);

    res.json({ 
      success: true,
      message: 'MFA enabled successfully',
    });
  } catch (error: any) {
    await logSecurityEvent(req.userId || null, 'MFA_VERIFICATION_FAILED', { error: error.message }, req, false);
    res.status(400).json({ error: error.message || 'Failed to verify MFA code' });
  }
});

/**
 * Disable MFA
 */
router.post('/mfa/disable', authenticateJWT, rateLimitByIP(5, 5 * 60 * 1000), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    await mfaService.disableMFA(userId, code);

    await logSecurityEvent(userId, 'MFA_DISABLED', {}, req);

    res.json({ success: true, message: 'MFA disabled successfully' });
  } catch (error: any) {
    await logSecurityEvent(req.userId || null, 'MFA_DISABLE_FAILED', { error: error.message }, req, false);
    res.status(400).json({ error: error.message || 'Failed to disable MFA' });
  }
});

/**
 * Check MFA status
 */
router.get('/mfa/status', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const enabled = await mfaService.isMFAEnabled(userId);

    res.json({ mfaEnabled: enabled });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check MFA status' });
  }
});

/**
 * Regenerate backup codes
 */
router.post('/mfa/backup-codes', authenticateJWT, rateLimitByIP(3, 60 * 60 * 1000), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const backupCodes = await mfaService.regenerateBackupCodes(userId, code);

    await logSecurityEvent(userId, 'MFA_BACKUP_CODES_REGENERATED', {}, req);

    res.json({ backupCodes });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to regenerate backup codes' });
  }
});

// ============================================
// Passkey (WebAuthn) Routes
// ============================================

/**
 * Generate passkey registration options
 */
router.post('/passkey/register/options', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const userEmail = req.userEmail!;
    const userName = req.body.userName || userEmail;

    const options = await passkeyService.generateRegistrationOptions(userId, userName, userEmail);

    await logSecurityEvent(userId, 'PASSKEY_REGISTRATION_INITIATED', {}, req);

    res.json(options.options);
  } catch (error: any) {
    console.error('Passkey registration options error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate registration options' });
  }
});

/**
 * Verify passkey registration
 */
router.post('/passkey/register/verify', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Registration response is required' });
    }

    const verified = await passkeyService.verifyRegistrationResponse(userId, response);

    if (verified) {
      await logSecurityEvent(userId, 'PASSKEY_REGISTERED', {}, req);
      res.json({ success: true, message: 'Passkey registered successfully' });
    } else {
      await logSecurityEvent(userId, 'PASSKEY_REGISTRATION_FAILED', {}, req, false);
      res.status(400).json({ error: 'Passkey registration verification failed' });
    }
  } catch (error: any) {
    console.error('Passkey registration verification error:', error);
    res.status(400).json({ error: error.message || 'Passkey registration failed' });
  }
});

/**
 * Generate passkey authentication options
 */
router.post('/passkey/auth/options', rateLimitByIP(10, 60 * 1000), async (req, res) => {
  try {
    const { userId } = req.body;

    const options = await passkeyService.generateAuthenticationOptions(userId);

    res.json(options.options);
  } catch (error: any) {
    console.error('Passkey authentication options error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate authentication options' });
  }
});

/**
 * Verify passkey authentication
 */
router.post('/passkey/auth/verify', rateLimitByIP(5, 5 * 60 * 1000), async (req, res) => {
  try {
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Authentication response is required' });
    }

    const result = await passkeyService.verifyAuthenticationResponse(response);

    if (result.verified && result.userId) {
      // Generate JWT tokens
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const tokens = await tokenService.generateTokenPair(
        result.userId,
        '', // Email will be fetched from user record
        userAgent,
        ipAddress
      );

      await logSecurityEvent(result.userId, 'PASSKEY_LOGIN_SUCCESS', {}, req);

      // Set tokens in cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ 
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } else {
      await logSecurityEvent(null, 'PASSKEY_LOGIN_FAILED', {}, req, false);
      res.status(401).json({ error: 'Passkey authentication failed' });
    }
  } catch (error: any) {
    console.error('Passkey authentication verification error:', error);
    res.status(400).json({ error: error.message || 'Passkey authentication failed' });
  }
});

/**
 * Get user's registered passkeys
 */
router.get('/passkey/list', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const passkeys = await passkeyService.getUserPasskeys(userId);

    res.json({ passkeys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch passkeys' });
  }
});

/**
 * Delete a passkey
 */
router.delete('/passkey/:authenticatorId', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { authenticatorId } = req.params;

    await passkeyService.deletePasskey(userId, authenticatorId);

    await logSecurityEvent(userId, 'PASSKEY_DELETED', { authenticatorId }, req);

    res.json({ success: true, message: 'Passkey deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete passkey' });
  }
});

// ============================================
// Session Management Routes
// ============================================

/**
 * Get active sessions
 */
router.get('/sessions', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const sessions = await tokenService.getActiveSessions(userId);

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { sessionId } = req.params;

    await tokenService.revokeSession(sessionId, userId);

    await logSecurityEvent(userId, 'SESSION_REVOKED', { sessionId }, req);

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

/**
 * Revoke all sessions (logout from all devices)
 */
router.post('/sessions/revoke-all', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    await tokenService.revokeAllSessions(userId);

    await logSecurityEvent(userId, 'ALL_SESSIONS_REVOKED', {}, req);

    res.json({ success: true, message: 'All sessions revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

/**
 * Refresh access token
 */
router.post('/token/refresh', rateLimitByIP(10, 60 * 1000), async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const newAccessToken = await tokenService.refreshAccessToken(refreshToken);

    if (!newAccessToken) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Set new access token in cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

/**
 * Get security audit log for current user
 */
router.get('/audit-log', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await require('@supabase/supabase-js').createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
      .from('security_audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;

    res.json({ logs: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

export default router;
