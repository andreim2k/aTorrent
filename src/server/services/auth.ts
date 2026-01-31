import { createHash, timingSafeEqual } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

/** Verify password against stored hash. Supports legacy SHA256 (salt:hex) and bcrypt formats. */
export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    return bcrypt.compareSync(password, stored);
  }
  // Legacy SHA256 format: salt:hash
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = createHash('sha256').update(salt + password).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
  } catch {
    return false;
  }
}

/** Returns true if the stored hash is in the legacy SHA256 format and should be re-hashed. */
export function needsRehash(stored: string): boolean {
  return !(stored.startsWith('$2b$') || stored.startsWith('$2a$'));
}

export function signToken(payload: { userId: number; username: string }): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    return jwt.verify(token, config.jwtSecret) as { userId: number; username: string };
  } catch {
    return null;
  }
}
