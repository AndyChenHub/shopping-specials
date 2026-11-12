import { fetchSaleFinderStoreSpecials } from './salefinder.js';
import { fetchAldiSpecials } from './aldi.js';
import { saveCacheToDisk, getStoreState, setSyncStatus } from '../cache.js';

let activeSyncPromise = null;

/**
 * Interleave/rank specials so browsing "All Stores" shows a rich mix of
 * half-price deals and top specials across Woolworths, Coles, and ALDI.
 */
function sortAndInterleave(woolworthsItems, colesItems, aldiItems) {
  const rankStoreItems = (arr) =>
    [...arr].sort((a, b) => {
      if (a.isHalfPrice !== b.isHalfPrice) return a.isHalfPrice ? -1 : 1;
      const discA = a.discountPercent || 0;
      const discB = b.discountPercent || 0;
      if (discB !== discA) return discB - discA;
      const saveA = a.saveAmount || 0;
      const saveB = b.saveAmount || 0;
      return saveB - saveA;
    });

  const w = rankStoreItems(woolworthsItems);
  const c = rankStoreItems(colesItems);
  const a = rankStoreItems(aldiItems);

  const maxLen = Math.max(w.length, c.length, a.length);
  const combined = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < w.length) combined.push(w[i]);
    if (i < c.length) combined.push(c[i]);
    if (i < a.length) combined.push(a[i]);
  }
  return combined;
}

/**
 * Search the web & download latest specials from Woolworths, Coles, and ALDI.
 */
export async function syncAllSupermarkets({ maxPagesPerCatalogue = 15 } = {}) {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    setSyncStatus('syncing');
    const prevState = getStoreState();

    const [wwRes, colesRes, aldiRes] = await Promise.allSettled([
      fetchSaleFinderStoreSpecials('woolworths', { maxPages: maxPagesPerCatalogue }),
      fetchSaleFinderStoreSpecials('coles', { maxPages: maxPagesPerCatalogue }),
      fetchAldiSpecials(),
    ]);

    const prevByStore = (store) =>
      (prevState.items || []).filter((item) => item.store === store);

    const woolworthsItems =
      wwRes.status === 'fulfilled' && wwRes.value.items.length > 0
        ? wwRes.value.items
        : prevByStore('woolworths');

    const colesItems =
      colesRes.status === 'fulfilled' && colesRes.value.items.length > 0
        ? colesRes.value.items
        : prevByStore('coles');

    const aldiItems =
      aldiRes.status === 'fulfilled' && aldiRes.value.length > 0
        ? aldiRes.value
        : prevByStore('aldi');

    const combined = sortAndInterleave(woolworthsItems, colesItems, aldiItems);

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
        name: 'ALDI Special Buys & Super Savers',
        validDates: 'Updated Wed & Sat • While Stocks Last',
      },
    };

    const storeStats = {
      woolworths: {
        count: woolworthsItems.length,
        halfPriceCount: woolworthsItems.filter((i) => i.isHalfPrice).length,
        status: wwRes.status === 'fulfilled' ? 'ok' : 'cached',
        error: wwRes.status === 'rejected' ? wwRes.reason?.message : null,
      },
      coles: {
        count: colesItems.length,
        halfPriceCount: colesItems.filter((i) => i.isHalfPrice).length,
        status: colesRes.status === 'fulfilled' ? 'ok' : 'cached',
        error: colesRes.status === 'rejected' ? colesRes.reason?.message : null,
      },
      aldi: {
        count: aldiItems.length,
        halfPriceCount: aldiItems.filter((i) => i.isHalfPrice).length,
        status: aldiRes.status === 'fulfilled' ? 'ok' : 'cached',
        error: aldiRes.status === 'rejected' ? aldiRes.reason?.message : null,
      },
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
 * Perform a live query combining downloaded Woolworths/Coles/ALDI catalogue deals
 * with live ALDI web search results for items not yet in cache.
 */
export async function searchSpecialsLive(query) {
  const q = String(query || '').trim().toLowerCase();
  const state = getStoreState();
  if (!q) return state.items;

  const tokens = q.split(/\s+/).filter(Boolean);
  const localMatches = (state.items || []).filter((item) => {
    const hay = `${item.title} ${item.brand || ''} ${item.category} ${item.promoText || ''} ${item.storeName}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });

  // Also query ALDI live search endpoint to catch extra matching specials on the web
  try {
    const liveAldi = await fetchAldiSpecials({ searchQuery: q });
    const existingIds = new Set(localMatches.map((i) => i.id));
    for (const item of liveAldi) {
      if (!existingIds.has(item.id)) {
        localMatches.push(item);
        existingIds.add(item.id);
      }
    }
  } catch {
    // Graceful fallback to cached catalogue search
  }

  return localMatches;
}
