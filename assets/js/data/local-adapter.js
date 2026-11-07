// IndexedDB implementation of the repository interface. Same method names a Firestore adapter will expose.
export const COLLECTIONS = ['users','settings','theme','menus','layout','pages','posts','categories','media','messages','services','portfolio','testimonials','redirects'];
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 14);
const ops = { '==': (a, b) => a === b, '!=': (a, b) => a !== b, '<': (a, b) => a < b, '>': (a, b) => a > b,
  '<=': (a, b) => a <= b, '>=': (a, b) => a >= b, in: (a, b) => b.includes(a) };

export class LocalAdapter {
  constructor(name) { this.name = name; this.subs = {}; }
  open() {
    return new Promise((ok, bad) => {
      const r = indexedDB.open(this.name, 1);
      r.onupgradeneeded = () => COLLECTIONS.forEach(c => r.result.createObjectStore(c, { keyPath: 'id' }));
      r.onsuccess = () => { this.idb = r.result; ok(); };
      r.onerror = () => bad(r.error);
    });
  }
  tx(col, mode, fn) {
    return new Promise((ok, bad) => {
      const t = this.idb.transaction(col, mode); const req = fn(t.objectStore(col));
      t.oncomplete = () => ok(req && req.result); t.onerror = t.onabort = () => bad(t.error);
    });
  }
  async get(col, id) { return (await this.tx(col, 'readonly', s => s.get(id))) || null; }
  async list(col, q = {}) {
    let rows = await this.tx(col, 'readonly', s => s.getAll());
    for (const [f, op, v] of q.where || []) rows = rows.filter(r => ops[op](r[f], v));
    if (q.orderBy) { const [f, d = 'asc'] = q.orderBy; rows.sort((a, b) => (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * (d === 'desc' ? -1 : 1)); }
    return q.limit ? rows.slice(0, q.limit) : rows;
  }
  async create(col, data, id = uid()) {
    const now = Date.now(), doc = { ...data, id, createdAt: now, updatedAt: now };
    await this.tx(col, 'readwrite', s => s.add(doc)); this.emit(col); return doc;
  }
  async update(col, id, patch) {
    const cur = await this.get(col, id); if (!cur) throw new Error(`${col}/${id} not found`);
    const doc = { ...cur, ...patch, id, updatedAt: Date.now() };
    await this.tx(col, 'readwrite', s => s.put(doc)); this.emit(col); return doc;
  }
  async remove(col, id) { await this.tx(col, 'readwrite', s => s.delete(id)); this.emit(col); }
  subscribe(col, cb) { (this.subs[col] ||= new Set()).add(cb); return () => this.subs[col].delete(cb); }
  emit(col) { this.subs[col]?.forEach(cb => cb()); }
  async exportAll() { const o = {}; for (const c of COLLECTIONS) o[c] = await this.list(c); return o; }
  async importAll(o) {
    for (const c of COLLECTIONS) if (o[c]) {
      await this.tx(c, 'readwrite', s => s.clear());
      for (const d of o[c]) await this.tx(c, 'readwrite', s => s.put(d));
    }
  }
}
