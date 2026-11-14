import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { db, safeJson } from './db/database.js';
import { contentRepository, domainRepository } from './repositories/content.js';
import { createSession, destroySession, loadAdmin, requireAdmin, requireCsrf } from './auth.js';

const scrypt = promisify(scryptCallback);
const app = express();
app.disable('x-powered-by');
// (2026-07-13) Allow 15mb json & base64 cover_image; was 1mb and max(1000)
app.use(express.json({ limit: '15mb' }));
app.use(loadAdmin);

const postSchema = z.object({
  title: z.string().trim().min(1).max(180), slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(600).optional(), cover_image: z.string().max(2000000).optional(), author: z.string().max(100).optional(),
  category: z.string().max(100).optional(), tags: z.array(z.string().max(40)).max(20).optional(), blocks: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  status: z.enum(['draft','published']).optional(), seo_title: z.string().max(180).optional(), seo_description: z.string().max(320).optional(), published_at: z.string().nullable().optional()
});
const safeHost = z.string().trim().min(3).max(253).regex(/^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i);
const contactSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), company: z.string().max(120).optional(), message: z.string().trim().min(10).max(5000) });

app.get('/api/health', (_req, res) => res.json({ ok: true, storage: 'local-sqlite' }));
app.get('/api/site', (req, res) => {
  const host = (req.query.host || req.hostname || '').toString().toLowerCase().split(':')[0];
  const mapped = domainRepository.resolvePreview(host) as { blog_name: string } | undefined;
  const setting = db.prepare("SELECT value FROM settings WHERE key='siteName'").get() as { value:string } | undefined;
  res.json({ name: setting?.value || 'BaiNest', mappedBlog: mapped?.blog_name || null, localDomainMode: true });
});
app.get('/api/posts', (_req, res) => res.json(contentRepository.listPublished()));
app.get('/api/posts/:slug', (req, res) => {
  const post = contentRepository.getPublishedBySlug(req.params.slug);
  if (!post) return res.status(404).json({ error: 'That article could not be found.' });
  res.json(post);
});
app.post('/api/contact', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the fields and try again.' });
  db.prepare('INSERT INTO contacts(name,email,company,message) VALUES(?,?,?,?)').run(parsed.data.name, parsed.data.email, parsed.data.company || '', parsed.data.message);
  res.status(201).json({ ok: true, message: 'Thanks — your note is saved. We’ll be in touch.' });
});

const loginAttempts = new Map<string, { count:number; reset:number }>();
app.get('/api/admin/me', (req, res) => res.json(req.admin ? { authenticated: true, username: req.admin.username, csrf: req.admin.csrf } : { authenticated: false }));
app.post('/api/admin/login', async (req, res) => {
  const ip = req.ip || 'local';
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.reset > Date.now() && attempt.count >= 8) return res.status(429).json({ error: 'Too many attempts. Wait a few minutes and try again.' });
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const row = db.prepare('SELECT id,username,salt,password_hash FROM admins WHERE username=?').get(username) as {id:number;username:string;salt:string;password_hash:string} | undefined;
  let accepted = false;
  if (row) {
    const candidate = await scrypt(password, row.salt, 64) as Buffer;
    const expected = Buffer.from(row.password_hash, 'hex');
    accepted = candidate.length === expected.length && timingSafeEqual(candidate, expected);
  }
  if (!row || !accepted) {
    const current = attempt && attempt.reset > Date.now() ? attempt : { count: 0, reset: Date.now() + 10 * 60 * 1000 };
    loginAttempts.set(ip, { count: current.count + 1, reset: current.reset });
    return res.status(401).json({ error: 'Those sign-in details did not match.' });
  }
  loginAttempts.delete(ip);
  const session = createSession(row.id, row.username, res);
  res.json({ authenticated: true, username: row.username, csrf: session.csrf });
});
app.post('/api/admin/logout', requireAdmin, requireCsrf, (req, res) => { destroySession(req, res); res.json({ ok: true }); });
app.get('/api/admin/posts', requireAdmin, (_req, res) => res.json(contentRepository.listAll()));
// (2026-07-13) Add GET /api/admin/posts/:id route in server. Prev: preview only
app.get('/api/admin/posts/:id', requireAdmin, (req, res) => { const post = contentRepository.getById(Number(req.params.id)); return post ? res.json(post) : res.status(404).json({ error: 'Post not found.' }); });
app.get('/api/admin/posts/:id/preview', requireAdmin, (req, res) => { const post = contentRepository.getById(Number(req.params.id)); return post ? res.json(post) : res.status(404).json({ error: 'Post not found.' }); });
app.post('/api/admin/posts', requireAdmin, requireCsrf, (req, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please review the post fields.', issues: parsed.error.flatten().fieldErrors });
  try { res.status(201).json(contentRepository.save(parsed.data)); }
  catch (error) { res.status(409).json({ error: error instanceof Error && error.message.includes('UNIQUE') ? 'That URL slug is already in use.' : 'The post could not be saved.' }); }
});
app.put('/api/admin/posts/:id', requireAdmin, requireCsrf, (req, res) => {
  const id = Number(req.params.id); const parsed = postSchema.safeParse(req.body);
  if (!Number.isSafeInteger(id) || id < 1 || !parsed.success) return res.status(400).json({ error: 'Please review the post fields.' });
  try { const saved = contentRepository.save(parsed.data, id); return saved ? res.json(saved) : res.status(404).json({ error: 'Post not found.' }); }
  catch (error) { res.status(409).json({ error: error instanceof Error && error.message.includes('UNIQUE') ? 'That URL slug is already in use.' : 'The post could not be saved.' }); }
});
app.delete('/api/admin/posts/:id', requireAdmin, requireCsrf, (req, res) => {
  const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid post.' });
  return contentRepository.remove(id) ? res.json({ ok: true }) : res.status(404).json({ error: 'Post not found.' });
});
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const posts = db.prepare('SELECT COUNT(*) AS total, SUM(status=\'published\') AS published FROM posts').get();
  const messages = db.prepare('SELECT COUNT(*) AS total, SUM(read=0) AS unread FROM contacts').get();
  res.json({ posts, messages });
});
app.get('/api/admin/contacts', requireAdmin, (_req, res) => res.json(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all()));
app.put('/api/admin/contacts/:id/read', requireAdmin, requireCsrf, (req, res) => {
  const result = db.prepare('UPDATE contacts SET read=1 WHERE id=?').run(Number(req.params.id));
  res.json({ ok: result.changes > 0 });
});
app.get('/api/admin/domains', requireAdmin, (_req, res) => res.json(domainRepository.list()));
app.post('/api/admin/domains', requireAdmin, requireCsrf, (req, res) => {
  const host = safeHost.safeParse(req.body?.hostname); const name = z.string().trim().min(1).max(100).safeParse(req.body?.blog_name);
  if (!host.success || !name.success) return res.status(400).json({ error: 'Enter a valid domain name and blog label.' });
  try { res.status(201).json(domainRepository.save(host.data, name.data)); }
  catch { res.status(409).json({ error: 'That hostname is already configured.' }); }
});
app.delete('/api/admin/domains/:id', requireAdmin, requireCsrf, (req, res) => res.json({ ok: domainRepository.remove(Number(req.params.id)) }));
// (2026-07-13) Store all site & page settings in SQLite. Prev: siteName only
app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT key,value FROM settings').all() as {key:string;value:string}[];
  const entries: Record<string, any> = {};
  for (const { key, value } of rows) {
    try {
      entries[key] = JSON.parse(value);
    } catch {
      entries[key] = value;
    }
  }
  res.json(entries);
});
app.put('/api/admin/settings', requireAdmin, requireCsrf, (req, res) => {
  const insert = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  const tx = db.transaction((data: Record<string, any>) => {
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        insert.run(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
    }
  });
  tx(req.body || {});
  res.json({ ok: true, ...(req.body || {}) });
});

const dirname = path.dirname(fileURLToPath(import.meta.url));
const production = process.env.NODE_ENV === 'production';
if (production) {
  const dist = path.resolve(dirname, '../dist');
  app.use(express.static(dist));
  app.get('*splat', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => console.log(`BaiNest Studio running on http://${host}:${port} — SQLite: ${process.env.DATABASE_PATH || './data/bainenest.sqlite'}`));
