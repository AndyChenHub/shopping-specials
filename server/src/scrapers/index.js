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
import { saveCacheToDisk, getStoreState, setSyncStatus } from '../cache.js';

let activeSyncPromise = null;

const EVERYDAY_STAPLES = [
  'milk',
  'bread',
  'eggs',
  'chicken breast',
  'coffee',
  'pasta',
  'cheese',
  'biscuits',
];

async function fetchEverydayRange() {
  const wwMap = new Map();
  const colesMap = new Map();
  const igaMap = new Map();

  await Promise.allSettled(
    EVERYDAY_STAPLES.map(async (term) => {
      const [ww, cl, ig] = await Promise.allSettled([
        searchWoolworthsProducts(term, 6),
        searchColesProducts(term, 6),
        searchIgaProducts(term, 6),
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
export async function syncAllSupermarkets({ maxPagesPerCatalogue = 12 } = {}) {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    setSyncStatus('syncing');
    const prevState = getStoreState();

    const [wwRes, colesRes, aldiRes, everydayRes] = await Promise.allSettled([
      fetchSaleFinderStoreSpecials('woolworths', { maxPages: maxPagesPerCatalogue }),
      fetchSaleFinderStoreSpecials('coles', { maxPages: maxPagesPerCatalogue }),
      fetchAldiSpecials(),
      fetchEverydayRange(),
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
export async function searchSpecialsLive(query) {
  const q = String(query || '').trim();
  const state = getStoreState();
  if (!q) return state.items;

  const settled = await Promise.allSettled([
    searchWoolworthsProducts(q, 10),
    searchColesProducts(q, 10),
    searchAldiProducts(q, 12),
    searchIgaProducts(q, 8),
    searchAmazonAuProducts(q, 6),
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

export { compareItemAcrossCompetitors };
