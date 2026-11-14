import { fetchSaleFinderStoreSpecials } from './salefinder.js';
import { fetchAldiSpecials } from './aldi.js';
import {
  searchWoolworthsProducts,
  searchColesProducts,
  searchAldiProducts,
  searchIgaProducts,
  searchAmazonAuProducts,
  compareItemAcrossCompetitors,
} from './competitors.js';
import { searchSuburbs, findNearbyStores } from './locations.js';
import { saveCacheToDisk, getStoreState, setSyncStatus } from '../cache.js';
import { getRangeSearchPlan } from '../normalize.js';

let activeSyncPromise = null;

const EVERYDAY_STAPLES = [
  'apples',
  'bananas',
  'tomatoes',
  'potatoes',
  'salad',
  'beef mince',
  'chicken breast',
  'sausages',
  'salmon',
  'milk',
  'cheese',
  'yoghurt',
  'eggs',
  'bread',
  'wraps',
  'potato chips',
  'crackers',
  'chocolate',
  'lollies',
  'biscuits',
  'cereal',
  'pasta',
  'soft drink',
  'coffee',
  'ice cream',
  'frozen pizza',
  'laundry liquid',
  'vitamins',
];

const COLES_BROWSE_DEPARTMENTS = [
  'browse:pantry',
  'browse:meat-seafood',
  'browse:fruit-vegetables',
  'browse:dairy-eggs-fridge',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchColesEverydaySequential(locationCtx = {}) {
  const colesMap = new Map();
  for (let i = 0; i < COLES_BROWSE_DEPARTMENTS.length; i++) {
    if (i > 0) await sleep(1050);
    try {
      const items = await searchColesProducts(
        COLES_BROWSE_DEPARTMENTS[i],
        56,
        locationCtx,
        1
      );
      for (const item of items) colesMap.set(item.id, item);
    } catch {
      // ignore individual department hiccup
    }
  }
  return Array.from(colesMap.values());
}

async function fetchEverydayRange(locationCtx = {}) {
  const wwMap = new Map();
  const igaMap = new Map();

  const colesPromise = fetchColesEverydaySequential(locationCtx);

  const batchSize = 6;
  for (let i = 0; i < EVERYDAY_STAPLES.length; i += batchSize) {
    const batch = EVERYDAY_STAPLES.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (term) => {
        const [ww, ig] = await Promise.allSettled([
          searchWoolworthsProducts(term, 24, locationCtx, 1),
          searchIgaProducts(term, 20, locationCtx, 1),
        ]);
        if (ww.status === 'fulfilled') {
          for (const item of ww.value) wwMap.set(item.id, item);
        }
        if (ig.status === 'fulfilled') {
          for (const item of ig.value) igaMap.set(item.id, item);
        }
      })
    );
  }

  const colesItems = await colesPromise;

  return {
    woolworths: Array.from(wwMap.values()),
    coles: colesItems,
    iga: Array.from(igaMap.values()),
  };
}

function normalizeDedupeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function dedupeStoreList(list) {
  const byKey = new Map();
  const skuToKey = new Map();

  for (const item of list) {
    const normTitle = normalizeDedupeTitle(item.title);
    const skuKey = item.sku ? `${item.store}-sku-${item.sku}` : null;
    const existingKey =
      (skuKey && skuToKey.get(skuKey)) || `${item.store}-${normTitle}`;

    const prev = byKey.get(existingKey);
    if (!prev) {
      byKey.set(existingKey, item);
      if (skuKey) skuToKey.set(skuKey, existingKey);
      continue;
    }

    const merged = {
      ...prev,
      sku: prev.sku || item.sku || null,
      barcode: prev.barcode || item.barcode || null,
      brand: prev.brand || item.brand || null,
      packageSize: prev.packageSize || item.packageSize || null,
      imageUrl: prev.imageUrl || item.imageUrl || null,
      unitPrice: prev.unitPrice || item.unitPrice || null,
      inStock: prev.inStock ?? item.inStock,
      stockLabel: prev.stockLabel || item.stockLabel,
      localStoreName: prev.localStoreName || item.localStoreName || null,
      isOnSale: Boolean(prev.isOnSale || item.isOnSale),
      isHalfPrice: Boolean(prev.isHalfPrice || item.isHalfPrice),
      wasPrice: prev.wasPrice ?? item.wasPrice ?? null,
      saveAmount: prev.saveAmount ?? item.saveAmount ?? null,
      discountPercent: prev.discountPercent ?? item.discountPercent ?? null,
      promoText: prev.promoText || item.promoText || null,
    };
    byKey.set(existingKey, merged);
    if (skuKey) skuToKey.set(skuKey, existingKey);
  }
  return Array.from(byKey.values());
}

function interleaveLists(lists) {
  const maxLen = Math.max(...lists.map((l) => l.length), 0);
  const combined = [];
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length) combined.push(list[i]);
    }
  }
  return combined;
}

/**
 * Search the web & download everyday items + weekly specials from Woolworths, Coles, ALDI & IGA.
 */
export async function syncAllSupermarkets({
  maxPagesPerCatalogue = 12,
  locationCtx = {},
} = {}) {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    setSyncStatus('syncing');
    const prevState = getStoreState();

    const [wwRes, colesRes, aldiRes, everydayRes] = await Promise.allSettled([
      fetchSaleFinderStoreSpecials('woolworths', {
        maxPages: maxPagesPerCatalogue,
        state: locationCtx?.state || '',
      }),
      fetchSaleFinderStoreSpecials('coles', {
        maxPages: maxPagesPerCatalogue,
        state: locationCtx?.state || '',
      }),
      fetchAldiSpecials({ locationCtx }),
      fetchEverydayRange(locationCtx),
    ]);

    const prevByStore = (store) =>
      (prevState.items || []).filter((item) => item.store === store);

    const everyday =
      everydayRes.status === 'fulfilled'
        ? everydayRes.value
        : { woolworths: [], coles: [], iga: [] };

    const wwCatItems =
      wwRes.status === 'fulfilled' && wwRes.value.items.length > 0
        ? wwRes.value.items
        : [];
    const colesCatItems =
      colesRes.status === 'fulfilled' && colesRes.value.items.length > 0
        ? colesRes.value.items
        : [];

    const woolworthsItems =
      wwCatItems.length + everyday.woolworths.length > 0
        ? dedupeStoreList([...everyday.woolworths, ...wwCatItems])
        : prevByStore('woolworths');

    const colesItems =
      colesCatItems.length + everyday.coles.length > 0
        ? dedupeStoreList([...everyday.coles, ...colesCatItems])
        : prevByStore('coles');

    const aldiItems =
      aldiRes.status === 'fulfilled' && aldiRes.value.length > 0
        ? aldiRes.value
        : prevByStore('aldi');

    const igaItems =
      everyday.iga.length > 0 ? dedupeStoreList(everyday.iga) : prevByStore('iga');

    const combined = interleaveLists([
      woolworthsItems,
      colesItems,
      aldiItems,
      igaItems,
    ]);

    const catalogues = {
      woolworths:
        wwRes.status === 'fulfilled'
          ? wwRes.value.catalogue
          : prevState.catalogues?.woolworths || null,
      coles:
        colesRes.status === 'fulfilled'
          ? colesRes.value.catalogue
          : prevState.catalogues?.coles || null,
      aldi: {
        name: 'ALDI Everyday Range & Special Buys',
        validDates: 'Updated Wed & Sat • Everyday Low Prices',
      },
      iga: {
        name: 'IGA Everyday & Price Match',
        validDates: 'Current Store Prices & Specials',
      },
    };

    const buildStat = (arr, status = 'ok') => ({
      count: arr.length,
      onSaleCount: arr.filter((i) => i.isOnSale).length,
      halfPriceCount: arr.filter((i) => i.isHalfPrice).length,
      status,
      error: null,
    });

    const storeStats = {
      woolworths: buildStat(woolworthsItems),
      coles: buildStat(colesItems),
      aldi: buildStat(aldiItems),
      iga: buildStat(igaItems),
    };

    await saveCacheToDisk({
      items: combined,
      catalogues,
      storeStats,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'ready',
      lastError: null,
    });

    return getStoreState();
  })();

  try {
    return await activeSyncPromise;
  } catch (err) {
    setSyncStatus('error', err.message);
    throw err;
  } finally {
    activeSyncPromise = null;
  }
}

function interleaveUniqueLists(lists) {
  const maxLen = Math.max(...lists.map((l) => l.length), 0);
  const out = [];
  const seen = new Set();
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length && !seen.has(list[i].id)) {
        seen.add(list[i].id);
        out.push(list[i]);
      }
    }
  }
  return out;
}

/**
 * Live search across cached items + live Woolworths, Coles, ALDI, IGA & Amazon AU feeds!
 */
export async function searchSpecialsLive(query, locationCtx = {}, page = 1) {
  const q = String(query || '').trim();
  const state = getStoreState();
  if (!q) return state.items;
  const safePage = Math.max(1, Math.floor(page || 1));

  const settled = await Promise.allSettled([
    searchWoolworthsProducts(q, 32, locationCtx, safePage),
    safePage === 1 ? searchColesProducts(q, 48, locationCtx, 1) : Promise.resolve([]),
    searchAldiProducts(q, 32, locationCtx, safePage),
    searchIgaProducts(q, 28, locationCtx, safePage),
    searchAmazonAuProducts(q, 12, locationCtx, safePage),
  ]);

  const lists = settled.map((r) => (r.status === 'fulfilled' ? r.value : []));
  const liveInterleaved = interleaveUniqueLists(lists);

  if (safePage > 1) {
    return liveInterleaved;
  }

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const localMatches = (state.items || []).filter((item) => {
    const hay = `${item.title} ${item.brand || ''} ${item.category} ${
      item.subCategory || ''
    } ${item.promoText || ''} ${item.storeName}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });

  const out = [];
  const seen = new Set();
  for (const item of [...liveInterleaved, ...localMatches]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

/**
 * Fetch a page of full supermarket range items (everyday regular-price + specials)
 * for any search query, aisle, subcategory, or store.
 */
export async function fetchSupermarketRangePage({
  query = '',
  category = 'All',
  subCategory = 'All',
  store = 'all',
  page = 1,
  locationCtx = {},
} = {}) {
  const safePage = Math.max(1, Math.floor(page || 1));
  const trimmedQ = String(query || '').trim();
  const allowedStores =
    store && store !== 'all'
      ? new Set(
          String(store)
            .toLowerCase()
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      : null;
  const wantsStore = (s) => !allowedStores || allowedStores.has(s);

  if (trimmedQ) {
    if (!allowedStores) {
      return searchSpecialsLive(trimmedQ, locationCtx, safePage);
    }
    const singleTasks = [];
    if (wantsStore('woolworths')) {
      singleTasks.push(searchWoolworthsProducts(trimmedQ, 36, locationCtx, safePage));
    }
    if (wantsStore('coles') && safePage === 1) {
      singleTasks.push(searchColesProducts(trimmedQ, 54, locationCtx, 1));
    }
    if (wantsStore('aldi')) {
      singleTasks.push(searchAldiProducts(trimmedQ, 48, locationCtx, safePage));
    }
    if (wantsStore('iga')) {
      singleTasks.push(searchIgaProducts(trimmedQ, 36, locationCtx, safePage));
    }
    if (wantsStore('amazon')) {
      singleTasks.push(searchAmazonAuProducts(trimmedQ, 16, locationCtx, safePage));
    }
    const settled = await Promise.allSettled(singleTasks);
    return interleaveUniqueLists(
      settled.map((r) => (r.status === 'fulfilled' ? r.value : []))
    );
  }

  const plan = getRangeSearchPlan(category, subCategory, safePage);
  const terms = [plan.primaryTerm, plan.secondaryTerm].filter(Boolean);
  const tasks = [];

  if (wantsStore('woolworths')) {
    tasks.push(
      Promise.allSettled(
        terms.map((t) => searchWoolworthsProducts(t, 28, locationCtx, plan.apiPage))
      ).then((res) =>
        interleaveUniqueLists(
          res.map((r) => (r.status === 'fulfilled' ? r.value : []))
        )
      )
    );
  }

  if (wantsStore('coles') && plan.colesQuery) {
    tasks.push(searchColesProducts(plan.colesQuery, 52, locationCtx, 1));
  }

  if (wantsStore('aldi')) {
    tasks.push(
      Promise.allSettled(
        terms.map((t) => searchAldiProducts(t, 32, locationCtx, plan.apiPage))
      ).then((res) =>
        interleaveUniqueLists(
          res.map((r) => (r.status === 'fulfilled' ? r.value : []))
        )
      )
    );
  }

  if (wantsStore('iga')) {
    tasks.push(
      Promise.allSettled(
        terms.map((t) => searchIgaProducts(t, 24, locationCtx, plan.apiPage))
      ).then((res) =>
        interleaveUniqueLists(
          res.map((r) => (r.status === 'fulfilled' ? r.value : []))
        )
      )
    );
  }

  const settled = await Promise.allSettled(tasks);
  return interleaveUniqueLists(
    settled.map((r) => (r.status === 'fulfilled' ? r.value : []))
  );
}

export { compareItemAcrossCompetitors, searchSuburbs, findNearbyStores };
