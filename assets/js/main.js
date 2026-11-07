import { initDb, db } from './data/index.js';
import { route, start } from './core/router.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const setTitle = t => document.title = `${t} | BuzzSpot`;

// Dark mode (remembers choice)
const root = document.documentElement, btn = document.getElementById('theme-toggle');
const applyTheme = m => { root.dataset.theme = m; btn.firstElementChild.textContent = m === 'dark' ? 'light_mode' : 'dark_mode'; };
applyTheme(localStorage.getItem('theme') || 'light');
btn.onclick = () => { const m = root.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', m); applyTheme(m); };

// Placeholder views. Real pages replace these in Phase 2; data comes only from the repository.
const shell = (h, body) => `<section class="container page"><h1>${h}</h1>${body}</section>`;
const postCard = p => `<a class="card" href="/blog/${esc(p.slug)}" data-link><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></a>`;
const listView = (title, col, fmt) => async () => {
  setTitle(title); const rows = await db.list(col);
  return shell(title, `<p>${rows.length} ${col} loaded from the local database.</p><div class="grid">${rows.map(fmt).join('')}</div>`);
};

async function selfTest() {
  const out = [], check = (n, ok) => out.push(`<li class="${ok ? 'ok' : 'fail'}">${ok ? 'PASS' : 'FAIL'}: ${n}</li>`);
  await db.remove('messages', 'selftest');
  const c = await db.create('messages', { name: 'Test', body: 'hello' }, 'selftest');
  check('create', c.id === 'selftest');
  check('read', (await db.get('messages', 'selftest'))?.name === 'Test');
  await db.update('messages', 'selftest', { name: 'Changed' });
  check('update', (await db.get('messages', 'selftest')).name === 'Changed');
  check('query', (await db.list('posts', { where: [['status', '==', 'published']], orderBy: ['views', 'desc'], limit: 3 })).length === 3);
  await db.remove('messages', 'selftest');
  check('delete', (await db.get('messages', 'selftest')) === null);
  check('export', Object.keys(await db.exportAll()).length === 14);
  return shell('Database self-test', `<ul>${out.join('')}</ul>`);
}

await initDb();
route('/', listView('Home', 'posts', postCard));
route('/about', async () => { setTitle('About'); const s = await db.get('settings', 'site'); return shell('About', `<p>${esc(s.tagline)}</p>`); });
route('/services', listView('Services', 'services', s => `<div class="card"><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div>`));
route('/portfolio', listView('Portfolio', 'portfolio', w => `<div class="card"><h3>${esc(w.title)}</h3><p>${esc(w.summary)}</p></div>`));
route('/blog', listView('Blog', 'posts', postCard));
route('/blog/:slug', async ({ slug }) => {
  const [p] = await db.list('posts', { where: [['slug', '==', slug]] });
  if (!p) return shell('Post not found', '<p>This post does not exist. <a data-link href="/blog">Back to the blog</a></p>');
  setTitle(p.title); return shell(esc(p.title), `<p>${esc(p.excerpt)}</p><p>URL: /blog/${esc(p.slug)} (no .html)</p>`);
});
route('/contact', async () => { setTitle('Contact'); const s = await db.get('settings', 'site'); return shell('Contact', `<p>${esc(s.email)} · ${esc(s.phone)}</p>`); });
route('/dev/selftest', selfTest);
start(document.getElementById('app'), () => shell('Page not found', '<p>That page does not exist. <a data-link href="/">Go home</a></p>'));
