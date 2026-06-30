import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Default rate limiter for general use
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 15
  },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP with proper IPv6 handling
    const userId = (req as any).user?.id;
    if (userId) return `user:${userId}`;
    
    // Use the library's ipKeyGenerator for proper IPv6 support
    const { ipKeyGenerator } = require('express-rate-limit');
    return ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction, options) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});
