import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
if (!JWT_SECRET && IS_PRODUCTION) {
  throw new Error('JWT_SECRET must be configured in production. Refusing to start with a default signing secret.');
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL = process.env.JWT_TTL || '24h';

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: 'buyer' | 'vendor' | 'admin';
  // Only set for role: 'admin'. Distinguishes Admin/Superuser from lower-
  // privilege roles like Manager or Office Assistant, which share the
  // 'admin' role for basic access but not for the most sensitive actions
  // (see requireAdminLevel below).
  level?: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, EFFECTIVE_JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

// Extend Express Request with the decoded auth payload
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

// Attaches req.auth if a valid token is present, but never blocks the request.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.auth = payload;
  }
  next();
}

// Blocks the request unless a valid token is present.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.auth = payload;
  next();
}

// Blocks the request unless the authenticated user has one of the given roles.
export function requireRole(...roles: Array<'buyer' | 'vendor' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(payload.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.auth = payload;
    next();
  };
}

// Blocks the request unless the authenticated admin has one of the given
// levels — for actions (system settings, adding/removing other admins)
// that a lower-privilege admin role like Manager or Office Assistant
// should not be able to reach, even with a valid admin login. This is what
// makes the admin sidebar's role-based hiding a real security boundary
// instead of just a UI suggestion someone could bypass with devtools.
const FULL_ACCESS_LEVELS = ['Admin', 'Superuser Level-4'];
export function requireAdminLevel(...levels: string[]) {
  const allowed = levels.length > 0 ? levels : FULL_ACCESS_LEVELS;
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowed.includes(payload.level || '')) {
      return res.status(403).json({ error: 'Your admin role does not have access to this action' });
    }
    req.auth = payload;
    next();
  };
}
