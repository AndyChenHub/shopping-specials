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

let activeSyncPromise = null;

const EVERYDAY_STAPLES = [
  'milk',
  'bread',
  'eggs',
  'chips',
  'chocolate',
  'soft drink',
  'biscuits',
  'coffee',
  'cereal',
  'pasta',
  'rice',
  'cheese',
  'yogurt',
  'chicken breast',
  'apples',
  'ice cream',
];

const COLES_GENTLE_STAPLES = new Set(['milk', 'chips', 'coffee', 'cheese']);

async function fetchEverydayRange(locationCtx = {}) {
  const wwMap = new Map();
  const colesMap = new Map();
  const igaMap = new Map();

  // Fetch in gentle batches of 4 terms (with at most 1 Coles SSR query per batch)
  const batchSize = 4;
  for (let i = 0; i < EVERYDAY_STAPLES.length; i += batchSize) {
    const batch = EVERYDAY_STAPLES.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (term) => {
        const [ww, cl, ig] = await Promise.allSettled([
          searchWoolworthsProducts(term, 10, locationCtx),
          COLES_GENTLE_STAPLES.has(term)
            ? searchColesProducts(term, 12, locationCtx)
            : Promise.resolve([]),
          searchIgaProducts(term, 8, locationCtx),
        ]);
        if (ww.status === 'fulfilled') {
          for (const item of ww.value) wwMap.set(item.id, item);
        }
        if (cl.status === 'fulfilled') {
          for (const item of cl.value) colesMap.set(item.id, item);
        }
        if (ig.status === 'fulfilled') {
          for (const item of ig.value) igaMap.set(item.id, item);
        }
      })
    );
  }

  return {
    woolworths: Array.from(wwMap.values()),
    coles: Array.from(colesMap.values()),
    iga: Array.from(igaMap.values()),
  };
}

function dedupeStoreList(list) {
  const map = new Map();
  for (const item of list) {
    const key = `${item.store}-${String(item.title).toLowerCase().slice(0, 38)}`;
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
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

/**
 * Live search across cached items + live Woolworths, Coles, ALDI, IGA & Amazon AU feeds!
 */
export async function searchSpecialsLive(query, locationCtx = {}) {
  const q = String(query || '').trim();
  const state = getStoreState();
  if (!q) return state.items;

  const settled = await Promise.allSettled([
    searchWoolworthsProducts(q, 20, locationCtx),
    searchColesProducts(q, 20, locationCtx),
    searchAldiProducts(q, 24, locationCtx),
    searchIgaProducts(q, 16, locationCtx),
    searchAmazonAuProducts(q, 10),
  ]);

  const lists = settled.map((r) => (r.status === 'fulfilled' ? r.value : []));
  const liveInterleaved = interleaveLists(lists);

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const localMatches = (state.items || []).filter((item) => {
    const hay = `${item.title} ${item.brand || ''} ${item.category} ${
      item.promoText || ''
    } ${item.storeName}`.toLowerCase();
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

export { compareItemAcrossCompetitors, searchSuburbs, findNearbyStores };
