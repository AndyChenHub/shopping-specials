import {
  CatalogueInfo,
  SpecialItem,
  SpecialsResponse,
  StoreId,
} from '../types/specials';
import {
  CLIENT_CATEGORIES,
  classifyCategory,
  computeSavings,
  decodeHtmlEntities,
} from './normalizeClient';

const SALEFINDER_BASE = 'https://www.salefinder.com.au';
const ALDI_API_BASE = 'https://api.aldi.com.au/v3/product-search';
const ALDI_WEB_BASE = 'https://www.aldi.com.au';

const REQUEST_HEADERS: Record<string, string> = {
  // Request desktop HTML from SaleFinder so m.salefinder.com.au redirect is avoided on iOS!
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'text/html,application/json,application/xhtml+xml,*/*;q=0.8',
};

async function fetchWithTimeout(
  url: string,
  timeoutMs = 14000,
  extraHeaders: Record<string, string> = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { ...REQUEST_HEADERS, ...extraHeaders },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function simpleHashId(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function extractPackageSize(title: string): string | null {
  const m = title.match(
    /\b(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:kg|g|ml|l|litre|litres|pk|pack)(?:\s*pk\s*\d+(?:-\d+)?)?)\b/i
  );
  return m ? m[1].trim() : null;
}

function extractUrlCategoryHint(href = ''): string {
  const parts = href.split('/').filter(Boolean);
  if (parts.length >= 4) {
    return parts.slice(1, -2).join(' ').replace(/-/g, ' ');
  }
  return '';
}

interface DiscoveredCatalogue extends CatalogueInfo {
  saleId: string;
  listUrl: string;
  priority: number;
}

const RETAILER_CONFIG: Record<
  'woolworths' | 'coles',
  {
    store: 'woolworths' | 'coles';
    storeName: 'Woolworths' | 'Coles';
    hubSlug: string;
    excludePattern: RegExp;
    preferPattern: RegExp;
  }
> = {
  woolworths: {
    store: 'woolworths',
    storeName: 'Woolworths',
    hubSlug: 'Woolworths-catalogue',
    excludePattern: /\b(bws|dan\s*murphy|big\s*w|everyday\s*market)\b/i,
    preferPattern: /\b(weekly|catalogue|specials)\b/i,
  },
  coles: {
    store: 'coles',
    storeName: 'Coles',
    hubSlug: 'Coles-catalogue',
    excludePattern: /\b(liquorland|first\s*choice|vintage\s*cellars)\b/i,
    preferPattern: /\b(coles\s*catalogue|weekly|specials)\b/i,
  },
};

async function discoverSaleFinderCatalogues(
  storeKey: 'woolworths' | 'coles'
): Promise<DiscoveredCatalogue[]> {
  const config = RETAILER_CONFIG[storeKey];
  const res = await fetchWithTimeout(`${SALEFINDER_BASE}/${config.hubSlug}`);
  const html = await res.text();

  const found = new Map<string, DiscoveredCatalogue>();
  const blocks = html.split(/<div[^>]*class="[^"]*retailer-catalogue[^"]*"[^>]*>/i).slice(1);

  for (const block of blocks) {
    const hrefMatch = block.match(/href="([^"]*\/(\d{4,7})\/catalogue2[^"]*)"/i);
    if (!hrefMatch) continue;

    const rawHref = hrefMatch[1];
    const saleId = hrefMatch[2];
    const nameMatch = block.match(
      /<div[^>]*class="[^"]*catalogue-name[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    const dateMatch = block.match(
      /<div[^>]*class="[^"]*catalogue-date[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);

    const name =
      decodeHtmlEntities(nameMatch?.[1] || '') ||
      `${config.storeName} Weekly Catalogue`;
    const validDates = (
      decodeHtmlEntities(dateMatch?.[1] || '') || 'Current Weekly Specials'
    ).replace(/^Offer valid\s*/i, '');

    if (config.excludePattern.test(`${name} ${rawHref}`)) continue;

    const listPath = rawHref.replace(/\/catalogue2.*$/i, '/list');
    if (!found.has(saleId)) {
      found.set(saleId, {
        saleId,
        name,
        validDates,
        coverImage: imgMatch?.[1] ? imgMatch[1].replace(/^\/\//, 'https://') : null,
        listUrl: listPath.startsWith('http') ? listPath : `${SALEFINDER_BASE}${listPath}`,
        priority: config.preferPattern.test(name) ? 1 : 2,
      });
    }
  }

  // Fallback anchor scan
  if (found.size === 0) {
    const anchorRegex = /href="([^"]*\/(\d{4,7})\/catalogue2[^"]*)"/gi;
    let m: RegExpExecArray | null;
    while ((m = anchorRegex.exec(html)) !== null) {
      const rawHref = m[1];
      const saleId = m[2];
      if (config.excludePattern.test(rawHref)) continue;
      if (!found.has(saleId)) {
        const listPath = rawHref.replace(/\/catalogue2.*$/i, '/list');
        found.set(saleId, {
          saleId,
          name: `${config.storeName} Weekly Catalogue`,
          validDates: 'Current Weekly Specials',
          coverImage: null,
          listUrl: listPath.startsWith('http')
            ? listPath
            : `${SALEFINDER_BASE}${listPath}`,
          priority: 1,
        });
      }
    }
  }

  return Array.from(found.values()).sort((a, b) => a.priority - b.priority);
}

function parseSaleFinderListHtml(
  html: string,
  storeKey: 'woolworths' | 'coles',
  catalogue: DiscoveredCatalogue
): { items: SpecialItem[]; maxPage: number } {
  const config = RETAILER_CONFIG[storeKey];
  const items: SpecialItem[] = [];

  // Split each product tile around a.item-image
  const chunks = html.split(/(?=<a\b[^>]*class="[^"]*\bitem-image\b[^"]*"[^>]*>)/i);
  for (const chunk of chunks) {
    if (!/^<a\b[^>]*class="[^"]*\bitem-image\b/i.test(chunk)) continue;

    const tileHtml = chunk.split(/<div[^>]*class="[^"]*sf-clear[^"]*"/i)[0] || chunk;
    const anchorTagMatch = tileHtml.match(/^<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    if (!anchorTagMatch) continue;

    const anchorAttrs = anchorTagMatch[1];
    const anchorInner = anchorTagMatch[2];

    const href = anchorAttrs.match(/href="([^"]+)"/i)?.[1] || '';
    const itemId = anchorAttrs.match(/data-itemid="([^"]+)"/i)?.[1] || '';
    const rawName =
      anchorAttrs.match(/data-itemname="([^"]+)"/i)?.[1] ||
      tileHtml.match(/class="[^"]*more-info-button[^"]*"[^>]*data-itemname="([^"]+)"/i)?.[1] ||
      tileHtml.match(/<a[^>]*class="[^"]*item-name[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ||
      '';

    const fullTitle = decodeHtmlEntities(rawName);
    if (!fullTitle) continue;

    const imgSrc = anchorInner.match(/<img[^>]*src="([^"]+)"/i)?.[1] || null;
    const unitPrice =
      decodeHtmlEntities(
        tileHtml.match(/<span[^>]*class="[^"]*comparative-text[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
          ''
      ) || null;

    const priceOptionsInner =
      tileHtml.match(/<div[^>]*class="[^"]*price-options[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
      '';
    const primaryPriceSpan = decodeHtmlEntities(
      priceOptionsInner.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
        ''
    );
    const fullPriceOptionsText = decodeHtmlEntities(priceOptionsInner);

    let promoRaw = fullPriceOptionsText;
    if (primaryPriceSpan) promoRaw = promoRaw.replace(primaryPriceSpan, '');
    if (unitPrice) promoRaw = promoRaw.replace(unitPrice, '');
    promoRaw = decodeHtmlEntities(promoRaw);

    const savings = computeSavings({
      price: primaryPriceSpan || fullPriceOptionsText,
      promoText: promoRaw,
    });

    if (savings.price === null) continue;

    let promoText: string | null = promoRaw || null;
    if (promoText) {
      if (/better\s*than\s*1\/2\s*price/i.test(promoText)) {
        promoText = 'Better than 1/2 Price';
      } else if (/1\/2\s*price|half\s*price/i.test(promoText)) {
        promoText = '1/2 Price';
      } else if (savings.saveAmount) {
        promoText = `Save $${savings.saveAmount.toFixed(2)}`;
      }
    } else if (savings.isHalfPrice) {
      promoText = '1/2 Price';
    } else if (savings.saveAmount) {
      promoText = `Save $${savings.saveAmount.toFixed(2)}`;
    } else {
      promoText = 'Weekly Special';
    }

    const category = classifyCategory(
      extractUrlCategoryHint(href),
      fullTitle,
      config.store
    );

    const productUrl = href
      ? href.startsWith('http')
        ? href
        : `${SALEFINDER_BASE}${href}`
      : catalogue.listUrl;

    items.push({
      id: `${config.store}-${itemId || simpleHashId(fullTitle)}`,
      store: config.store,
      storeName: config.storeName,
      title: fullTitle,
      brand: null,
      packageSize: extractPackageSize(fullTitle),
      price: savings.price,
      priceText: primaryPriceSpan || `$${savings.price.toFixed(2)}`,
      wasPrice: savings.wasPrice,
      saveAmount: savings.saveAmount,
      discountPercent: savings.discountPercent,
      isHalfPrice: savings.isHalfPrice,
      promoText,
      unitPrice,
      category,
      imageUrl: imgSrc ? imgSrc.replace(/^\/\//, 'https://') : null,
      productUrl,
      catalogueName: catalogue.name,
      validDates: catalogue.validDates,
      fetchedAt: new Date().toISOString(),
    });
  }

  let maxPage = 1;
  const pageRegex = /\?qs=(\d+),/g;
  let pm: RegExpExecArray | null;
  while ((pm = pageRegex.exec(html)) !== null) {
    const p = parseInt(pm[1], 10);
    if (Number.isFinite(p) && p > maxPage) maxPage = p;
  }

  return { items, maxPage };
}

async function fetchStoreSaleFinderDirect(
  storeKey: 'woolworths' | 'coles',
  maxPages = 12
): Promise<{ items: SpecialItem[]; catalogue: CatalogueInfo | null }> {
  const catalogues = await discoverSaleFinderCatalogues(storeKey);
  if (catalogues.length === 0) {
    return { items: [], catalogue: null };
  }

  const primary = catalogues[0];
  const seen = new Map<string, SpecialItem>();

  const p1Res = await fetchWithTimeout(`${primary.listUrl}?qs=1,,,,`);
  const p1 = parseSaleFinderListHtml(await p1Res.text(), storeKey, primary);
  for (const item of p1.items) seen.set(item.id, item);

  const pagesToFetch = Math.min(maxPages, Math.max(p1.maxPage, 1));
  const remaining: number[] = [];
  for (let p = 2; p <= pagesToFetch; p++) remaining.push(p);

  const batchSize = 4;
  for (let i = 0; i < remaining.length; i += batchSize) {
    const batch = remaining.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map(async (pageNum) => {
        const res = await fetchWithTimeout(`${primary.listUrl}?qs=${pageNum},,,,`);
        return parseSaleFinderListHtml(await res.text(), storeKey, primary);
      })
    );
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        for (const item of r.value.items) {
          if (!seen.has(item.id)) seen.set(item.id, item);
        }
      }
    }
  }

  return {
    items: Array.from(seen.values()),
    catalogue: {
      saleId: primary.saleId,
      name: primary.name,
      validDates: primary.validDates,
      coverImage: primary.coverImage,
    },
  };
}

// --- ALDI Direct Fetcher ---

interface AldiRawProduct {
  sku?: string;
  name?: string;
  brandName?: string;
  urlSlugText?: string;
  sellingSize?: string;
  onSaleDate?: string;
  onSaleDateDisplay?: string;
  price?: {
    amount?: number;
    amountRelevant?: number;
    amountRelevantDisplay?: string;
    comparisonDisplay?: string;
    perUnitDisplay?: string;
    wasPriceDisplay?: string;
    savingsDisplay?: string;
  };
  categories?: { name?: string }[];
  assets?: { url?: string; assetType?: string }[];
  badges?: Array<string | { text?: string; label?: string }>;
}

function mapAldiItem(item: AldiRawProduct, sourceLabel: string): SpecialItem | null {
  if (!item?.name || !item?.price) return null;

  const rawPrice =
    typeof item.price.amountRelevant === 'number'
      ? item.price.amountRelevant / 100
      : typeof item.price.amount === 'number'
      ? item.price.amount / 100
      : item.price.amountRelevantDisplay;

  const badges = (item.badges || [])
    .map((b) => (typeof b === 'string' ? b : b?.text || b?.label || ''))
    .filter(Boolean)
    .join(' ');

  const savings = computeSavings({
    price: rawPrice,
    wasPrice: item.price.wasPriceDisplay,
    saveAmount: item.price.savingsDisplay,
    promoText: [item.price.savingsDisplay, badges, sourceLabel]
      .filter(Boolean)
      .join(' • '),
  });

  if (savings.price === null) return null;

  const brand = decodeHtmlEntities(item.brandName || '');
  const baseName = decodeHtmlEntities(item.name);
  const fullTitle =
    brand && !baseName.toLowerCase().startsWith(brand.toLowerCase())
      ? `${brand} ${baseName}`
      : baseName;

  const catNames = (item.categories || []).map((c) => c.name || '').join(' ');
  const category = classifyCategory(`${catNames} ${sourceLabel}`, fullTitle, 'aldi');

  let promoText = sourceLabel;
  if (savings.isHalfPrice) {
    promoText = '1/2 Price';
  } else if (item.price.savingsDisplay) {
    promoText = decodeHtmlEntities(item.price.savingsDisplay);
  } else if (savings.saveAmount) {
    promoText = `Save $${savings.saveAmount.toFixed(2)}`;
  }

  const assets = item.assets || [];
  const front = assets.find((a) => a.assetType === 'FR01') || assets[0];
  const slug = item.urlSlugText || 'aldi-special';
  const imageUrl = front?.url
    ? front.url.replace('{width}', '500').replace('{slug}', `${slug}.jpg`)
    : null;

  const validDates = item.onSaleDate
    ? `On sale ${item.onSaleDate}${
        item.onSaleDateDisplay ? ` • ${item.onSaleDateDisplay}` : ''
      }`
    : item.onSaleDateDisplay || 'This Week at ALDI';

  return {
    id: `aldi-${item.sku || slug}`,
    store: 'aldi',
    storeName: 'ALDI',
    title: fullTitle,
    brand: brand || null,
    packageSize: decodeHtmlEntities(item.sellingSize || '') || null,
    price: savings.price,
    priceText: item.price.amountRelevantDisplay || `$${savings.price.toFixed(2)}`,
    wasPrice: savings.wasPrice,
    saveAmount: savings.saveAmount,
    discountPercent: savings.discountPercent,
    isHalfPrice: savings.isHalfPrice,
    promoText,
    unitPrice:
      decodeHtmlEntities(
        item.price.comparisonDisplay || item.price.perUnitDisplay || ''
      ) || null,
    category,
    imageUrl,
    productUrl: item.urlSlugText
      ? `${ALDI_WEB_BASE}/product/${item.urlSlugText}-${item.sku}`
      : `${ALDI_WEB_BASE}/special-buys/`,
    catalogueName: `ALDI ${sourceLabel}`,
    validDates,
    fetchedAt: new Date().toISOString(),
  };
}

async function queryAldiDirect(params: Record<string, string | number>) {
  const qs = new URLSearchParams({
    currency: 'AUD',
    serviceType: 'walk-in',
  });
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, String(v));
  }
  const res = await fetchWithTimeout(`${ALDI_API_BASE}?${qs.toString()}`, 12000, {
    Accept: 'application/json',
  });
  return res.json();
}

export async function fetchAldiDirect(searchQuery = ''): Promise<SpecialItem[]> {
  const seen = new Map<string, SpecialItem>();

  if (searchQuery.trim()) {
    const json = await queryAldiDirect({
      q: searchQuery.trim(),
      limit: 32,
      offset: 0,
      sort: 'relevance',
    });
    for (const raw of json?.data || []) {
      const mapped = mapAldiItem(raw, 'ALDI Range & Specials');
      if (mapped && !seen.has(mapped.id)) seen.set(mapped.id, mapped);
    }
    return Array.from(seen.values());
  }

  const discovery = await queryAldiDirect({
    limit: 12,
    offset: 0,
    sort: 'relevance',
  });
  const facets = discovery?.meta?.facets || [];
  const catFacet = facets.find((f: { name?: string }) => f.name === 'category-tree');
  const themeFacet = facets.find((f: { name?: string }) => f.name === 'theme');

  const collections: Array<{
    param: string;
    fallbackParam?: string;
    key: string;
    label: string;
    limit: number;
  }> = [];

  for (const v of catFacet?.values || []) {
    if (/super\s*savers?/i.test(v.label)) {
      collections.push({
        param: 'categoryKey',
        fallbackParam: 'categoryTree',
        key: v.key,
        label: 'Super Savers',
        limit: 30,
      });
    } else if (/limited\s*time/i.test(v.label)) {
      collections.push({
        param: 'categoryKey',
        fallbackParam: 'categoryTree',
        key: v.key,
        label: 'Special Buys',
        limit: 48,
      });
    } else if (/new\s*low\s*price/i.test(v.label)) {
      collections.push({
        param: 'categoryKey',
        fallbackParam: 'categoryTree',
        key: v.key,
        label: 'Low Price Special',
        limit: 48,
      });
    }
  }

  for (const v of themeFacet?.values || []) {
    if (/grocery\s*specials/i.test(v.label)) {
      collections.push({
        param: 'theme',
        key: v.key,
        label: 'Grocery Special Buys',
        limit: 32,
      });
    }
  }

  if (collections.length === 0) {
    collections.push({
      param: 'q',
      key: 'special',
      label: 'Special Buys',
      limit: 48,
    });
  }

  await Promise.allSettled(
    collections.map(async (col) => {
      let data: AldiRawProduct[] = [];
      try {
        const res = await queryAldiDirect({
          [col.param]: col.key,
          limit: col.limit,
          offset: 0,
          sort: 'relevance',
        });
        data = res?.data || [];
      } catch {
        // try fallback
      }
      if (data.length === 0 && col.fallbackParam) {
        try {
          const res2 = await queryAldiDirect({
            [col.fallbackParam]: col.key,
            limit: col.limit,
            offset: 0,
            sort: 'relevance',
          });
          data = res2?.data || [];
        } catch {
          // ignore
        }
      }
      for (const raw of data) {
        const mapped = mapAldiItem(raw, col.label);
        if (mapped && !seen.has(mapped.id)) seen.set(mapped.id, mapped);
      }
    })
  );

  if (seen.size === 0) {
    for (const raw of discovery?.data || []) {
      const mapped = mapAldiItem(raw, 'Special Buys');
      if (mapped && !seen.has(mapped.id)) seen.set(mapped.id, mapped);
    }
  }

  return Array.from(seen.values());
}

function interleaveStores(
  w: SpecialItem[],
  c: SpecialItem[],
  a: SpecialItem[]
): SpecialItem[] {
  const rank = (arr: SpecialItem[]) =>
    [...arr].sort((x, y) => {
      if (x.isHalfPrice !== y.isHalfPrice) return x.isHalfPrice ? -1 : 1;
      const d = (y.discountPercent || 0) - (x.discountPercent || 0);
      if (d !== 0) return d;
      return (y.saveAmount || 0) - (x.saveAmount || 0);
    });

  const rw = rank(w);
  const rc = rank(c);
  const ra = rank(a);
  const max = Math.max(rw.length, rc.length, ra.length);
  const out: SpecialItem[] = [];
  for (let i = 0; i < max; i++) {
    if (i < rw.length) out.push(rw[i]);
    if (i < rc.length) out.push(rc[i]);
    if (i < ra.length) out.push(ra[i]);
  }
  return out;
}

/**
 * Download specials directly on the iPhone from Woolworths, Coles & ALDI
 * without needing a companion PC server!
 */
export async function downloadAllSpecialsOnDevice(): Promise<SpecialsResponse> {
  const [wwRes, colesRes, aldiRes] = await Promise.allSettled([
    fetchStoreSaleFinderDirect('woolworths', 12),
    fetchStoreSaleFinderDirect('coles', 12),
    fetchAldiDirect(),
  ]);

  const wwItems = wwRes.status === 'fulfilled' ? wwRes.value.items : [];
  const colesItems = colesRes.status === 'fulfilled' ? colesRes.value.items : [];
  const aldiItems = aldiRes.status === 'fulfilled' ? aldiRes.value : [];

  const items = interleaveStores(wwItems, colesItems, aldiItems);
  if (items.length === 0) {
    throw new Error('Could not download specials. Please check your internet connection.');
  }

  const storeStats: Record<StoreId, { count: number; halfPriceCount: number; status: string }> = {
    woolworths: {
      count: wwItems.length,
      halfPriceCount: wwItems.filter((i) => i.isHalfPrice).length,
      status: wwRes.status === 'fulfilled' ? 'ok' : 'error',
    },
    coles: {
      count: colesItems.length,
      halfPriceCount: colesItems.filter((i) => i.isHalfPrice).length,
      status: colesRes.status === 'fulfilled' ? 'ok' : 'error',
    },
    aldi: {
      count: aldiItems.length,
      halfPriceCount: aldiItems.filter((i) => i.isHalfPrice).length,
      status: aldiRes.status === 'fulfilled' ? 'ok' : 'error',
    },
  };

  const catalogues: Record<StoreId, CatalogueInfo | null> = {
    woolworths: wwRes.status === 'fulfilled' ? wwRes.value.catalogue : null,
    coles: colesRes.status === 'fulfilled' ? colesRes.value.catalogue : null,
    aldi: {
      name: 'ALDI Special Buys & Super Savers',
      validDates: 'Updated Wed & Sat • While Stocks Last',
    },
  };

  return {
    items,
    total: items.length,
    categories: CLIENT_CATEGORIES,
    storeStats,
    catalogues,
    lastSyncedAt: new Date().toISOString(),
    syncStatus: 'ready',
  };
}
