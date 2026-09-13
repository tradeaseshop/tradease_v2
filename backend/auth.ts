import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'tradeease-dev-secret-change-me';
const TOKEN_TTL = '30d';

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: 'buyer' | 'vendor' | 'admin';
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
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
