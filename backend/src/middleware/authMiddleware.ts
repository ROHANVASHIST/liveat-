import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/tokenService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  sessionId?: string;
}

/**
 * JWT Authentication Middleware
 * Validates JWT access token from Authorization header or cookie
 */
export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookie
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify token
    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.sessionId = payload.sessionId;

    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional JWT Authentication
 * Continues even if no token is provided
 */
export const optionalAuthenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies?.accessToken;
    }

    if (token) {
      const payload = tokenService.verifyAccessToken(token);
      if (payload) {
        req.userId = payload.userId;
        req.userEmail = payload.email;
        req.sessionId = payload.sessionId;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Refresh Token Middleware
 * Handles token refresh using refresh token
 */
export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ error: 'Token refresh failed' });
  }
};

/**
 * Require MFA Verification
 * Checks if user has MFA enabled and requires verification
 */
export const requireMFAVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user has MFA enabled
    const { data: mfaSettings } = await supabase
      .from('user_mfa_settings')
      .select('mfa_enabled')
      .eq('user_id', req.userId)
      .single();

    if (mfaSettings?.mfa_enabled) {
      // Check if MFA has been verified in this session
      const session = req.session as any;
      const mfaVerified = session?.mfaVerified;

      if (!mfaVerified) {
        return res.status(403).json({ 
          error: 'MFA verification required',
          requiresMFA: true 
        });
      }
    }

    next();
  } catch (error) {
    console.error('MFA verification check error:', error);
    return res.status(500).json({ error: 'MFA verification check failed' });
  }
};

/**
 * Rate Limit by IP
 * Simple IP-based rate limiting for sensitive endpoints
 */
export const rateLimitByIP = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = attempts.get(ip);

    if (record && record.resetAt > now) {
      if (record.count >= maxAttempts) {
        return res.status(429).json({ 
          error: 'Too many attempts. Please try again later.',
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        });
      }
      record.count++;
    } else {
      attempts.set(ip, { count: 1, resetAt: now + windowMs });
    }

    // Clean up old records periodically
    if (Math.random() < 0.01) {
      for (const [key, value] of attempts.entries()) {
        if (value.resetAt <= now) {
          attempts.delete(key);
        }
      }
    }

    next();
  };
};

/**
 * Check for account lockout due to failed login attempts
 */
export const checkAccountLockout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.socket.remoteAddress;

    if (!email || !ip) {
      return next();
    }

    // Check for lockout
    const { data: lockout } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', email)
      .eq('ip_address', ip)
      .single();

    if (lockout && lockout.locked_until) {
      const lockedUntil = new Date(lockout.locked_until);
      
      if (lockedUntil > new Date()) {
        const remainingSeconds = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
        return res.status(423).json({ 
          error: 'Account temporarily locked due to multiple failed login attempts',
          lockedFor: remainingSeconds,
        });
      }
    }

    next();
  } catch (error) {
    // Don't block on error, just log and continue
    console.error('Account lockout check error:', error);
    next();
  }
};

/**
 * Log security event
 */
export const logSecurityEvent = async (
  userId: string | null,
  eventType: string,
  eventData: any,
  req: Request,
  success: boolean = true
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await supabase
      .from('security_audit_log')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        ip_address: ip,
        user_agent: userAgent,
        success,
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};
