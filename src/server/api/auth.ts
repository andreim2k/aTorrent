import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword, signToken, verifyToken, needsRehash } from '../services/auth.js';
import { eq, count as countFn } from 'drizzle-orm';

export function authRoutes(app: FastifyInstance) {
  // Cookie configuration for cross-domain or same-origin support
  const crossDomain = !!process.env.CORS_ORIGIN;
  const cookieOpts = {
    path: '/',
    httpOnly: true,
    sameSite: crossDomain ? 'none' as const : 'strict' as const,
    secure: crossDomain,
    maxAge: 7 * 86400,
  };

  // Check if setup is needed + whether current session is valid
  app.get('/api/auth/status', async (req) => {
    const userCount = db.select({ count: countFn() }).from(users).get()?.count ?? 0;
    const setupRequired = userCount === 0;

    let authenticated = false;
    let username: string | null = null;

    if (!setupRequired) {
      const token = req.cookies.token;
      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          authenticated = true;
          username = payload.username;
        }
      }
    } else {
      // In setup mode, treat everyone as authenticated
      authenticated = true;
    }

    return { setupRequired, authenticated, username };
  });

  // Setup — create first admin user
  app.post('/api/auth/setup', { config: { rateLimit: { max: 3, timeWindow: '1 minute' } } }, async (req, reply) => {
    const userCount = db.select({ count: countFn() }).from(users).get()?.count ?? 0;
    if (userCount > 0) {
      return reply.status(400).send({ error: 'Setup already completed' });
    }
    const { username, password } = req.body as any;
    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password required' });
    }
    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }
    const passwordHash = hashPassword(password);
    const result = db.insert(users).values({ username, passwordHash }).run();
    const token = signToken({ userId: Number(result.lastInsertRowid), username });
    reply.setCookie('token', token, cookieOpts);
    return { ok: true, username };
  });

  // Login
  app.post('/api/auth/login', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { username, password } = req.body as any;
    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password required' });
    }
    const user = db.select().from(users).where(eq(users.username, username)).get();
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    // Migrate legacy SHA256 hash to bcrypt on successful login
    if (needsRehash(user.passwordHash)) {
      const newHash = hashPassword(password);
      db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id)).run();
    }
    const token = signToken({ userId: user.id, username: user.username });
    reply.setCookie('token', token, cookieOpts);
    return { ok: true, username: user.username };
  });

  // Logout
  app.post('/api/auth/logout', async (_req, reply) => {
    reply.clearCookie('token', { path: '/', sameSite: cookieOpts.sameSite, secure: cookieOpts.secure });
    return { ok: true };
  });

  // Change password
  app.post('/api/auth/change-password', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    const token = req.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: 'No token provided' });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    const { currentPassword, newPassword } = req.body as any;
    if (!currentPassword || !newPassword) {
      return reply.status(400).send({ error: 'Current password and new password required' });
    }

    const user = db.select().from(users).where(eq(users.id, payload.userId)).get();
    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return reply.status(401).send({ error: 'Current password is incorrect' });
    }

    if (newPassword.length < 8) {
      return reply.status(400).send({ error: 'New password must be at least 8 characters' });
    }

    const newHash = hashPassword(newPassword);
    db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id)).run();

    return { ok: true };
  });

  // Auth check middleware — skip for auth routes
  app.addHook('onRequest', async (req, reply) => {
    if (req.url.startsWith('/api/auth/')) return;
    if (!req.url.startsWith('/api/')) return;

    // If no users exist, allow all requests (setup mode)
    const userCount = db.select({ count: countFn() }).from(users).get()?.count ?? 0;
    if (userCount === 0) return;

    const token = req.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return reply.status(401).send({ error: 'Invalid token' });
    }
    (req as any).user = payload;
  });
}
