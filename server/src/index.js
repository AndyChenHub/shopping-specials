import express from 'express';
import cors from 'cors';
import os from 'node:os';
import {
  CATEGORIES,
  SUBCATEGORY_FILTERS,
  matchesSubCategory,
} from './normalize.js';
import {
  CACHE_SCHEMA_VERSION,
  loadCacheFromDisk,
  getStoreState,
} from './cache.js';
import {
  syncAllSupermarkets,
  searchSpecialsLive,
  fetchSupermarketRangePage,
  compareItemAcrossCompetitors,
  searchSuburbs,
  findNearbyStores,
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

function extractLocationCtx(src = {}) {
  return {
    postcode: src.postcode ? String(src.postcode) : '',
    suburb: src.suburb ? String(src.suburb) : '',
    state: src.state ? String(src.state) : '',
    wwStoreId: src.wwStoreId ? String(src.wwStoreId) : '',
    wwStoreName: src.wwStoreName ? String(src.wwStoreName) : '',
    igaStoreId: src.igaStoreId ? String(src.igaStoreId) : '',
    igaStoreName: src.igaStoreName ? String(src.igaStoreName) : '',
    aldiStoreId: src.aldiStoreId ? String(src.aldiStoreId) : '',
    aldiStoreName: src.aldiStoreName ? String(src.aldiStoreName) : '',
  };
}

app.get('/api/locations/suburbs', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ suburbs: [] });
    const suburbs = await searchSuburbs(q);
    res.json({ suburbs });
  } catch (err) {
    console.error('GET /api/locations/suburbs error:', err);
    res.status(500).json({ error: err.message || 'Failed to look up suburbs' });
  }
});

app.get('/api/locations/stores', async (req, res) => {
  try {
    const {
      q = '',
      postcode = '',
      suburb = '',
      state = '',
      lat = '',
      lon = '',
    } = req.query;

    const result = await findNearbyStores({
      query: String(q || ''),
      postcode: String(postcode || ''),
      suburb: String(suburb || ''),
      state: String(state || ''),
      latitude: lat !== '' ? Number(lat) : null,
      longitude: lon !== '' ? Number(lon) : null,
    });
    res.json(result);
  } catch (err) {
    console.error('GET /api/locations/stores error:', err);
    res.status(500).json({ error: err.message || 'Failed to find nearby stores' });
  }
});

app.get('/api/specials', async (req, res) => {
  try {
    const locationCtx = extractLocationCtx(req.query);
    let state = getStoreState();

    // If cache is empty on first request, trigger an initial download
    if (state.items.length === 0 && state.syncStatus !== 'syncing') {
      state = await syncAllSupermarkets({ locationCtx });
    }

    const {
      store = 'all',
      category = 'All',
      subCategory = 'All',
      dealFilter = 'all',
      onSale = 'false',
      halfPrice = 'false',
      inStockOnly = 'false',
      q = '',
      live = 'false',
      range = 'false',
      page = '1',
      sort = 'featured',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    let pool = state.items;

    // Live full-range pagination or live keyword search
    if (range === 'true' || range === '1') {
      pool = await fetchSupermarketRangePage({
        query: String(q || ''),
        category: String(category || 'All'),
        subCategory: String(subCategory || 'All'),
        store: String(store || 'all'),
        page: pageNum,
        locationCtx,
      });
    } else if (String(q).trim()) {
      if (live === 'true' || live === '1') {
        pool = await searchSpecialsLive(String(q), locationCtx, pageNum);
      } else {
        const tokens = String(q)
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);
        pool = pool.filter((item) => {
          const hay = `${item.title} ${item.brand || ''} ${item.category} ${item.subCategory || ''} ${item.promoText || ''} ${item.storeName}`.toLowerCase();
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

    // Deal / sale filter ('all' | 'regular' | 'sale' | 'half_price')
    const isItemHalfPrice = (item) =>
      Boolean(
        item.isHalfPrice ||
          (item.discountPercent && item.discountPercent >= 48) ||
          (item.wasPrice &&
            item.wasPrice > item.price &&
            (item.wasPrice - item.price) / item.wasPrice >= 0.48)
      );

    const isItemOnSale = (item) =>
      Boolean(
        item.isOnSale ??
          (isItemHalfPrice(item) ||
            (item.saveAmount && item.saveAmount > 0) ||
            (item.wasPrice && item.wasPrice > item.price) ||
            item.promoText)
      );

    if (dealFilter === 'half_price' || halfPrice === 'true' || halfPrice === '1') {
      pool = pool.filter((item) => isItemHalfPrice(item));
    } else if (dealFilter === 'sale' || onSale === 'true' || onSale === '1') {
      pool = pool.filter((item) => isItemOnSale(item));
    } else if (dealFilter === 'regular') {
      pool = pool.filter((item) => !isItemOnSale(item));
    }

    if (inStockOnly === 'true' || inStockOnly === '1') {
      pool = pool.filter((item) => item.inStock === true);
    }

    // Subcategory filter (handles both leaf subcategories & umbrella filters like Snacks / Meat)
    if (subCategory && subCategory !== 'All' && subCategory !== 'all') {
      pool = pool.filter((item) => matchesSubCategory(item, String(subCategory)));
    }

    // Category filter
    if (category && category !== 'All') {
      pool = pool.filter(
        (item) => item.category.toLowerCase() === String(category).toLowerCase()
      );
    }

    // Sorting
    const getDiscountPct = (it) =>
      it.discountPercent ??
      (it.wasPrice && it.wasPrice > it.price
        ? Math.round(((it.wasPrice - it.price) / it.wasPrice) * 100)
        : 0);
    const getSaveAmt = (it) =>
      it.saveAmount ??
      (it.wasPrice && it.wasPrice > it.price ? it.wasPrice - it.price : 0);

    const items = [...pool];
    if (sort === 'discount') {
      items.sort((a, b) => getDiscountPct(b) - getDiscountPct(a));
    } else if (sort === 'savings') {
      items.sort((a, b) => getSaveAmt(b) - getSaveAmt(a));
    } else if (sort === 'price_asc') {
      items.sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999));
    }

    res.json({
      items,
      total: items.length,
      categories: CATEGORIES,
      subCategories: SUBCATEGORY_FILTERS,
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
    const locationCtx = extractLocationCtx(req.body?.location || req.query || {});
    if (!rawItem.title || !String(rawItem.title).trim()) {
      return res.status(400).json({ error: 'Missing item title for comparison' });
    }
    const comparison = await compareItemAcrossCompetitors(rawItem, locationCtx);
    res.json(comparison);
  } catch (err) {
    console.error('POST /api/compare error:', err);
    res.status(500).json({ error: err.message || 'Failed to compare competitor prices' });
  }
});

app.get('/api/compare', async (req, res) => {
  try {
    const locationCtx = extractLocationCtx(req.query);
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

    const comparison = await compareItemAcrossCompetitors(
      {
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
      },
      locationCtx
    );
    res.json(comparison);
  } catch (err) {
    console.error('GET /api/compare error:', err);
    res.status(500).json({ error: err.message || 'Failed to compare competitor prices' });
  }
});

app.post('/api/refresh', async (req, res) => {
  try {
    const locationCtx = extractLocationCtx(req.body?.location || req.query || {});
    const state = await syncAllSupermarkets({ locationCtx });
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
    (current.schemaVersion !== CACHE_SCHEMA_VERSION ||
      typeof current.items[0].isOnSale !== 'boolean' ||
      !current.storeStats?.iga);

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
