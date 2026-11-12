import express from 'express';
import cors from 'cors';
import os from 'node:os';
import { CATEGORIES } from './normalize.js';
import { loadCacheFromDisk, getStoreState } from './cache.js';
import { syncAllSupermarkets, searchSpecialsLive } from './scrapers/index.js';

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(cors());
app.use(express.json());

function getLanAddresses() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const list of Object.values(nets)) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

app.get('/api/health', (_req, res) => {
  const state = getStoreState();
  res.json({
    ok: true,
    syncStatus: state.syncStatus,
    lastSyncedAt: state.lastSyncedAt,
    totalItems: state.items.length,
    storeStats: state.storeStats,
    catalogues: state.catalogues,
  });
});

app.get('/api/specials', async (req, res) => {
  try {
    let state = getStoreState();

    // If cache is empty on first request, trigger an initial download
    if (state.items.length === 0 && state.syncStatus !== 'syncing') {
      state = await syncAllSupermarkets();
    }

    const {
      store = 'all',
      category = 'All',
      halfPrice = 'false',
      q = '',
      live = 'false',
      sort = 'featured',
    } = req.query;

    let pool = state.items;

    // Optional live web search when searching a keyword
    if (String(q).trim()) {
      if (live === 'true' || live === '1') {
        pool = await searchSpecialsLive(String(q));
      } else {
        const tokens = String(q)
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);
        pool = pool.filter((item) => {
          const hay = `${item.title} ${item.brand || ''} ${item.category} ${item.promoText || ''} ${item.storeName}`.toLowerCase();
          return tokens.every((t) => hay.includes(t));
        });
      }
    }

    // Store filter (supports 'woolworths', 'coles', 'aldi', or comma-separated)
    if (store && store !== 'all') {
      const allowed = new Set(
        String(store)
          .toLowerCase()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
      pool = pool.filter((item) => allowed.has(item.store));
    }

    // Half-price filter
    if (halfPrice === 'true' || halfPrice === '1') {
      pool = pool.filter((item) => item.isHalfPrice);
    }

    // Category filter
    if (category && category !== 'All') {
      pool = pool.filter(
        (item) => item.category.toLowerCase() === String(category).toLowerCase()
      );
    }

    // Sorting
    const items = [...pool];
    if (sort === 'discount') {
      items.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    } else if (sort === 'savings') {
      items.sort((a, b) => (b.saveAmount || 0) - (a.saveAmount || 0));
    } else if (sort === 'price_asc') {
      items.sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999));
    }

    // Compute dynamic category counts prior to category filter for UI badges
    res.json({
      items,
      total: items.length,
      categories: CATEGORIES,
      storeStats: state.storeStats,
      catalogues: state.catalogues,
      lastSyncedAt: state.lastSyncedAt,
      syncStatus: state.syncStatus,
    });
  } catch (err) {
    console.error('GET /api/specials error:', err);
    res.status(500).json({ error: err.message || 'Failed to load specials' });
  }
});

app.post('/api/refresh', async (_req, res) => {
  try {
    const state = await syncAllSupermarkets();
    res.json({
      ok: true,
      total: state.items.length,
      storeStats: state.storeStats,
      catalogues: state.catalogues,
      lastSyncedAt: state.lastSyncedAt,
      syncStatus: state.syncStatus,
    });
  } catch (err) {
    console.error('POST /api/refresh error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Refresh failed' });
  }
});

async function bootstrap() {
  const loaded = await loadCacheFromDisk();
  if (loaded) {
    const s = getStoreState();
    console.log(
      `Loaded ${s.items.length} cached specials from disk (last synced: ${s.lastSyncedAt})`
    );
  }

  app.listen(PORT, HOST, () => {
    const ips = getLanAddresses();
    console.log(`\nSupermarket Specials API running:`);
    console.log(`  Local:   http://localhost:${PORT}/api/specials`);
    for (const ip of ips) {
      console.log(`  LAN iOS: http://${ip}:${PORT}/api/specials`);
    }
  });

  // Refresh in background on startup if cache is empty or older than 6 hours
  const current = getStoreState();
  const ageMs = current.lastSyncedAt
    ? Date.now() - new Date(current.lastSyncedAt).getTime()
    : Infinity;

  if (current.items.length === 0 || ageMs > 6 * 60 * 60 * 1000) {
    console.log('Syncing latest Woolworths, Coles & ALDI specials in background...');
    syncAllSupermarkets()
      .then((s) => {
        console.log(
          `Initial sync complete: ${s.items.length} specials ready!`,
          s.storeStats
        );
      })
      .catch((err) => {
        console.error('Background sync warning:', err.message);
      });
  }
}

bootstrap();
