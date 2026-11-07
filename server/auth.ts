import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db/database.js';

const COOKIE = 'bainenest_session';
const sessionSecret = process.env.APP_SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32 || sessionSecret === 'replace-with-a-long-random-local-secret') {
  throw new Error('Set APP_SESSION_SECRET to a unique value of at least 32 characters in your local .env file.');
}
const secureCookie = process.env.COOKIE_SECURE === 'true';
const cookieOptions = `${secureCookie ? 'SameSite=None; Secure' : 'SameSite=Lax'}; HttpOnly; Path=/; Max-Age=604800`;
const sign = (id: string) => createHmac('sha256', sessionSecret).update(id).digest('hex');
export type AdminSession = { adminId: number; username: string; sessionId: string; csrf: string };
declare global { namespace Express { interface Request { admin?: AdminSession } } }

export function createSession(adminId: number, username: string, res: Response) {
  const id = randomBytes(32).toString('hex');
  const csrf = randomBytes(32).toString('hex');
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  db.prepare('INSERT INTO sessions(id,csrf_token,admin_id,expires_at) VALUES(?,?,?,?)').run(id, csrf, adminId, expires);
  res.setHeader('Set-Cookie', `${COOKIE}=${id}.${sign(id)}; ${cookieOptions}`);
  return { id, csrf, expires, username };
}
export function destroySession(req: Request, res: Response) {
  if (req.admin) db.prepare('DELETE FROM sessions WHERE id=?').run(req.admin.sessionId);
  res.setHeader('Set-Cookie', `${COOKIE}=; ${secureCookie ? 'SameSite=None; Secure' : 'SameSite=Lax'}; HttpOnly; Path=/; Max-Age=0`);
}
export function loadAdmin(req: Request, _res: Response, next: NextFunction) {
  const raw = req.headers.cookie?.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (raw) {
    const [id, signature] = raw.split('.');
    if (id && signature) {
      const expected = sign(id);
      const a = Buffer.from(signature); const b = Buffer.from(expected);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        const row = db.prepare(`SELECT s.id,s.csrf_token,s.expires_at,a.id AS admin_id,a.username FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.id=?`).get(id) as { id:string; csrf_token:string; expires_at:number; admin_id:number; username:string } | undefined;
        if (row && row.expires_at > Date.now()) req.admin = { adminId: row.admin_id, username: row.username, sessionId: row.id, csrf: row.csrf_token };
        else if (row) db.prepare('DELETE FROM sessions WHERE id=?').run(id);
      }
    }
  }
  next();
}
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.admin) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const token = req.get('x-csrf-token') || '';
  if (!req.admin || token.length !== req.admin.csrf.length || !timingSafeEqual(Buffer.from(token), Buffer.from(req.admin.csrf))) return res.status(403).json({ error: 'Your session has expired. Refresh and try again.' });
  next();
}
