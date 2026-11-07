// First-run sample content so every page looks finished.
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const img = (n, w = 800, h = 450) => `https://picsum.photos/seed/buzz${n}/${w}/${h}`;

export async function seed(db) {
  const put = (c, id, d) => db.create(c, d, id);
  await put('settings', 'site', { title: 'BuzzSpot', tagline: 'Stories, services and work worth sharing', email: 'hello@example.com', phone: '+63 900 000 0000', address: 'Cebu, Philippines' });
  await put('theme', 'default', { main: '#f12f3f', font: 'Montserrat', container: 1073, radius: 5, darkDefault: false });
  await put('menus', 'main', { items: ['Home|/', 'About|/about', 'Services|/services', 'Portfolio|/portfolio', 'Blog|/blog', 'Contact|/contact'].map(s => ({ label: s.split('|')[0], url: s.split('|')[1] })) });
  await put('layout', 'home', { sections: ['hero', 'ticker', 'trending', 'featured', 'latest', 'services', 'portfolio', 'stats', 'testimonials', 'cta'].map(k => ({ key: k, visible: true })) });
  await put('users', 'admin', { email: 'admin@example.com', role: 'admin', passwordHash: null, mustChange: true }); // hash set in Phase 3

  const cats = ['Technology', 'Lifestyle', 'Business'];
  for (const c of cats) await put('categories', slug(c), { name: c, slug: slug(c) });

  const titles = ['Ten tools that speed up any website', 'Designing for dark mode', 'How we plan a launch week', 'Why fast pages win customers',
    'A simple guide to brand colors', 'Writing copy people finish reading', 'Behind the scenes of a rebrand', 'Small business SEO basics'];
  for (const [i, t] of titles.entries()) await put('posts', 'p' + i, {
    title: t, slug: slug(t), status: 'published', category: slug(cats[i % 3]), author: 'Admin', cover: img(i),
    excerpt: 'A short, useful read for anyone building something online.', views: 100 - i * 9, publishedAt: Date.now() - i * 864e5,
    blocks: [{ type: 'paragraph', text: 'Replace this sample text from the admin once Phase 3 is built.' }], customDomain: ''
  });

  const services = ['Web design', 'Branding', 'SEO', 'Content writing', 'Photography', 'Support'];
  for (const [i, s] of services.entries()) await put('services', 's' + i, { title: s, description: `Professional ${s.toLowerCase()} tailored to your goals.`, icon: 'bolt', from: 'From $199', order: i });

  for (let i = 0; i < 8; i++) await put('portfolio', 'w' + i, { title: `Project ${i + 1}`, slug: `project-${i + 1}`, category: slug(cats[i % 3]), cover: img(20 + i, 600, 400), summary: 'A recent client project.' });
  for (const [i, n] of ['Ana R.', 'Mark T.', 'Liza C.', 'Joel P.'].entries()) await put('testimonials', 't' + i, { name: n, quote: 'Fast, clear and exactly what we needed.', rating: 5 });
}
