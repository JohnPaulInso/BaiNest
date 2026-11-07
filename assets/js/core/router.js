// History API router with animated transitions. Handlers return an HTML string or a Node.
const routes = []; let outlet, notFound, run = 0;

export function route(pattern, handler) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
  routes.push({ re, keys, handler });
}
export function go(url) { if (url !== location.pathname) history.pushState({}, '', url); render(); }
export function start(el, notFoundHandler) {
  outlet = el; notFound = notFoundHandler;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-link]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    e.preventDefault(); go(a.getAttribute('href'));
  });
  addEventListener('popstate', render);
  render();
}
function markActive(path) {
  const top = '/' + (path.split('/')[1] || '');
  document.querySelectorAll('.main-nav a').forEach(a => {
    if (a.getAttribute('href') === top) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
async function render() {
  const id = ++run, path = location.pathname, bar = document.getElementById('progress');
  let handler = notFound, params = {};
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) { handler = r.handler; r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1])); break; }
  }
  bar.className = ''; void bar.offsetWidth; bar.className = 'on';
  let view;
  try { view = await handler(params); }
  catch (e) { console.error(e); view = '<section class="container page"><h1>Something went wrong</h1><p>Reload the page and try again.</p></section>'; }
  if (id !== run) return;                       // a newer navigation took over
  const swap = () => {
    outlet.replaceChildren(typeof view === 'string' ? Object.assign(document.createElement('div'), { innerHTML: view }) : view);
    markActive(path); scrollTo(0, 0); outlet.focus({ preventScroll: true });
  };
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !calm) await document.startViewTransition(swap).finished;
  else { swap(); outlet.classList.remove('page-in'); void outlet.offsetWidth; outlet.classList.add('page-in'); }
  bar.className = 'done';
}
