import { LocalAdapter } from './local-adapter.js';
import { FirebaseAdapter } from './firebase-adapter.js';
import { seed } from './seed.js';

export const CONFIG = { adapter: 'local' };           // switch to 'firebase' in Phase 7
export const db = CONFIG.adapter === 'firebase' ? new FirebaseAdapter() : new LocalAdapter('buzzspot-db');

export async function initDb() {
  await db.open();
  if (!(await db.get('settings', 'site'))) await seed(db);
  return db;
}
