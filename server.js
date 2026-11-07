// Zero-dependency dev server. Clean URLs: unknown paths fall back to the app shell.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = process.env.PORT || 3000;
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon' };

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  const send = f => fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(500); return res.end('Server error'); }
    res.writeHead(200, { 'Content-Type': (TYPES[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(data);
  });
  fs.stat(file, (err, st) => {
    if (!err && st.isFile()) return send(file);
    if (!err && st.isDirectory() && fs.existsSync(path.join(file, 'index.html'))) return send(path.join(file, 'index.html'));
    if (path.extname(urlPath)) { res.writeHead(404); return res.end('Not found'); }   // missing asset
    const admin = urlPath === '/admin' || urlPath.startsWith('/admin/');
    send(path.join(ROOT, admin ? 'admin/index.html' : 'index.html'));                 // SPA fallback
  });
}).listen(PORT, () => console.log(`BuzzSpot running at http://localhost:${PORT}`));
