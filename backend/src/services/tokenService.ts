import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access tokens
const REFRESH_TOKEN_EXPIRY = '7d'; // Longer-lived refresh tokens

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  sessionId: string;
}

class TokenService {
  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(userId: string, email: string, userAgent?: string, ipAddress?: string): Promise<TokenPair> {
    const sessionId = crypto.randomUUID();

    // Create access token
    const accessToken = jwt.sign(
      { 
        userId, 
        email, 
        sessionId,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      { 
        userId, 
        email, 
        sessionId,
        type: 'refresh',
      },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Store refresh token hash in database
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        refresh_token_hash: refreshTokenHash,
        user_agent: userAgent,
        ip_address: ipAddress,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.type !== 'access') {
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        sessionId: decoded.sessionId,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        return null;
      }

      // Check if session exists and is valid
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', decoded.sessionId)
        .eq('refresh_token_hash', tokenHash)
        .eq('revoked', false)
        .single();

      if (error || !session) {
        return null;
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        sessionId: decoded.sessionId,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    const payload = await this.verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return null;
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        userId: payload.userId, 
        email: payload.email, 
        sessionId: payload.sessionId,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return accessToken;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId);
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(userId: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('id, user_agent, ip_address, created_at, expires_at')
      .eq('user_id', userId)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch sessions');
    }

    return data || [];
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
  }

  /**
   * Generate secure random token for email verification, password reset, etc.
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token for storage
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const tokenService = new TokenService();

// Run cleanup every hour
setInterval(() => {
  tokenService.cleanupExpiredSessions();
}, 60 * 60 * 1000);
