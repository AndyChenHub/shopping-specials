import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reclassifyItems } from './normalize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'specials-cache.json');

export const CACHE_SCHEMA_VERSION = 3;

let memoryStore = {
  schemaVersion: CACHE_SCHEMA_VERSION,
  items: [],
  catalogues: {},
  lastSyncedAt: null,
  syncStatus: 'idle', // 'idle' | 'syncing' | 'ready' | 'error'
  lastError: null,
  storeStats: {
    woolworths: { count: 0, onSaleCount: 0, halfPriceCount: 0, status: 'pending' },
    coles: { count: 0, onSaleCount: 0, halfPriceCount: 0, status: 'pending' },
    aldi: { count: 0, onSaleCount: 0, halfPriceCount: 0, status: 'pending' },
    iga: { count: 0, onSaleCount: 0, halfPriceCount: 0, status: 'pending' },
  },
};

export async function loadCacheFromDisk() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      const repairedItems = reclassifyItems(parsed.items);
      memoryStore = {
        ...memoryStore,
        ...parsed,
        items: repairedItems,
        syncStatus: repairedItems.length > 0 ? 'ready' : 'idle',
      };
      return true;
    }
  } catch {
    // No cache yet on first run
  }
  return false;
}

export async function saveCacheToDisk(data) {
  memoryStore = {
    ...memoryStore,
    ...data,
    schemaVersion: CACHE_SCHEMA_VERSION,
  };
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.warn('Warning: unable to persist cache file:', err.message);
  }
}

export function getStoreState() {
  return memoryStore;
}

export function setSyncStatus(status, lastError = null) {
  memoryStore.syncStatus = status;
  memoryStore.lastError = lastError;
}
