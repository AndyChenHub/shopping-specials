import express from 'express';
import cors from 'cors';
import os from 'node:os';
import { CATEGORIES } from './normalize.js';
import { loadCacheFromDisk, getStoreState } from './cache.js';
import {
  syncAllSupermarkets,
  searchSpecialsLive,
  compareItemAcrossCompetitors,
} from './scrapers/index.js';

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
      dealFilter = 'all',
      onSale = 'false',
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

    // Store filter (supports 'woolworths', 'coles', 'aldi', 'iga', 'amazon', or comma-separated)
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

    // Deal / sale filter ('all' | 'sale' | 'half_price')
    const isItemOnSale = (item) =>
      Boolean(
        item.isOnSale ??
          (item.isHalfPrice || (item.saveAmount && item.saveAmount > 0) || item.promoText)
      );

    if (dealFilter === 'half_price' || halfPrice === 'true' || halfPrice === '1') {
      pool = pool.filter((item) => item.isHalfPrice);
    } else if (dealFilter === 'sale' || onSale === 'true' || onSale === '1') {
      pool = pool.filter((item) => isItemOnSale(item));
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

app.post('/api/compare', async (req, res) => {
  try {
    const rawItem = req.body?.item || req.body || {};
    if (!rawItem.title || !String(rawItem.title).trim()) {
      return res.status(400).json({ error: 'Missing item title for comparison' });
    }
    const comparison = await compareItemAcrossCompetitors(rawItem);
    res.json(comparison);
  } catch (err) {
    console.error('POST /api/compare error:', err);
    res.status(500).json({ error: err.message || 'Failed to compare competitor prices' });
  }
});

app.get('/api/compare', async (req, res) => {
  try {
    const {
      title = '',
      brand = null,
      packageSize = null,
      store = null,
      price = null,
      priceText = null,
      wasPrice = null,
      saveAmount = null,
      isOnSale = 'false',
      isHalfPrice = 'false',
      promoText = null,
      unitPrice = null,
      imageUrl = null,
      productUrl = null,
    } = req.query;

    if (!String(title).trim()) {
      return res.status(400).json({ error: 'Missing query parameter: title' });
    }

    const comparison = await compareItemAcrossCompetitors({
      title: String(title),
      brand: brand ? String(brand) : null,
      packageSize: packageSize ? String(packageSize) : null,
      store: store ? String(store) : undefined,
      price: price !== null && price !== '' ? Number(price) : null,
      priceText: priceText ? String(priceText) : null,
      wasPrice: wasPrice !== null && wasPrice !== '' ? Number(wasPrice) : null,
      saveAmount: saveAmount !== null && saveAmount !== '' ? Number(saveAmount) : null,
      isOnSale: isOnSale === 'true' || isOnSale === '1',
      isHalfPrice: isHalfPrice === 'true' || isHalfPrice === '1',
      promoText: promoText ? String(promoText) : null,
      unitPrice: unitPrice ? String(unitPrice) : null,
      imageUrl: imageUrl ? String(imageUrl) : null,
      productUrl: productUrl ? String(productUrl) : null,
    });
    res.json(comparison);
  } catch (err) {
    console.error('GET /api/compare error:', err);
    res.status(500).json({ error: err.message || 'Failed to compare competitor prices' });
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

  // Refresh in background on startup if cache is empty, missing new stores/fields, or older than 6 hours
  const current = getStoreState();
  const ageMs = current.lastSyncedAt
    ? Date.now() - new Date(current.lastSyncedAt).getTime()
    : Infinity;
  const schemaOutdated =
    current.items.length > 0 &&
    (typeof current.items[0].isOnSale !== 'boolean' || !current.storeStats?.iga);

  if (current.items.length === 0 || schemaOutdated || ageMs > 6 * 60 * 60 * 1000) {
    console.log(
      'Syncing latest Woolworths, Coles, ALDI & IGA everyday items + specials in background...'
    );
    syncAllSupermarkets()
      .then((s) => {
        console.log(
          `Initial sync complete: ${s.items.length} items ready!`,
          s.storeStats
        );
      })
      .catch((err) => {
        console.error('Background sync warning:', err.message);
      });
  }
}

bootstrap();
