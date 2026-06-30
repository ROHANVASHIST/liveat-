import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import hpp from 'hpp';
import { Request, Response, NextFunction } from 'express';

// Enhanced Helmet configuration for maximum security
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'data:'],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
    reportOnly: false,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize MongoDB queries
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ key }) => {
      console.warn(`MongoDB injection attempt blocked: ${key}`);
    }
  })(req, res, (err) => {
    if (err) return next(err);
    
    // Custom XSS sanitization for all string inputs
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query) as any;
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params) as any;
    }
    
    next();
  });
};

// Recursively sanitize objects
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return xss(obj.trim());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      const sanitizedKey = xss(key);
      sanitized[sanitizedKey] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
};

// HTTP Parameter Pollution protection
export const parameterPollution = hpp({
  whitelist: [
    'limit',
    'offset',
    'page',
    'sort',
    'order',
    'status',
    'type',
  ]
});

// Enhanced CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow all localhost origins in development
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-Token'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
};

// Request size limiting
export const bodySizeLimit = '10mb';
export const queryLimit = '2mb';

// Validate content types
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json'
      });
    }
  }
  next();
};

// Security logging
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log suspicious activities
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`[SECURITY] ${req.method} ${req.path} - Status: ${res.statusCode} - IP: ${req.ip}`);
    }
    
    if (res.statusCode >= 500) {
      console.error(`[ERROR] ${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`);
    }
  });
  
  next();
};

// Prevent open redirects
export const preventOpenRedirects = (req: Request, res: Response, next: NextFunction) => {
  const redirectUrl = req.query.returnTo || req.query.redirect || req.query.url;
  
  if (redirectUrl && typeof redirectUrl === 'string') {
    // Only allow relative URLs or our own domain
    if (!redirectUrl.startsWith('/') || redirectUrl.includes('://') || redirectUrl.includes('../')) {
      console.warn(`[SECURITY] Open redirect attempt blocked: ${redirectUrl}`);
      return res.status(400).json({ error: 'Invalid redirect URL' });
    }
  }
  
  next();
};

// Secure session configuration helper
export const getSecureSessionConfig = () => ({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  name: 'concierge_session',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on each request
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }
});