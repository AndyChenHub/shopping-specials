import {
  classifyCategory,
  classifySubCategory,
  computeSavings,
  cleanText,
} from '../normalize.js';

const ALDI_API_BASE = 'https://api.aldi.com.au/v3/product-search';
const ALDI_WEB_BASE = 'https://www.aldi.com.au';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

/**
 * Resolve ALDI dynamic image template URL into a real loadable HTTPS image URL.
 */
function buildAldiImageUrl(item) {
  const assets = item?.assets || [];
  const front = assets.find((a) => a.assetType === 'FR01') || assets[0];
  if (!front?.url) return null;
  const slug = item.urlSlugText || 'aldi-special';
  return front.url
    .replace('{width}', '500')
    .replace('{slug}', `${slug}.jpg`);
}

function mapAldiProduct(item, sourceLabel = 'Special Buys', locationCtx = {}) {
  if (!item || !item.name || !item.price) return null;

  const rawPrice =
    typeof item.price.amountRelevant === 'number'
      ? item.price.amountRelevant / 100
      : typeof item.price.amount === 'number'
      ? item.price.amount / 100
      : item.price.amountRelevantDisplay;

  const badgeLabels = (item.badges || [])
    .map((b) => (typeof b === 'string' ? b : b?.text || b?.label || ''))
    .filter(Boolean)
    .join(' ');

  const isSpecialCollection =
    /super\s*savers?|special\s*buys?|low\s*price\s*special/i.test(sourceLabel);

  const rawPromo = [
    item.price.savingsDisplay,
    badgeLabels,
    isSpecialCollection ? sourceLabel : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const savings = computeSavings({
    price: rawPrice,
    wasPrice: item.price.wasPriceDisplay,
    saveAmount: item.price.savingsDisplay,
    promoText: rawPromo,
  });

  if (savings.price === null) return null;

  const brand = cleanText(item.brandName || '');
  const baseName = cleanText(item.name);
  const fullTitle =
    brand && !baseName.toLowerCase().startsWith(brand.toLowerCase())
      ? `${brand} ${baseName}`
      : baseName;

  const rawCatNames = (item.categories || []).map((c) => c.name).join(' ');
  const rawHint = `${rawCatNames} ${isSpecialCollection ? sourceLabel : ''}`.trim();
  const category = classifyCategory(rawHint, fullTitle, 'aldi');
  const subCategory = classifySubCategory(rawHint, fullTitle, category);

  const isOnSale = Boolean(
    savings.isHalfPrice ||
      (savings.saveAmount && savings.saveAmount > 0) ||
      item.price.savingsDisplay ||
      item.onSaleDate ||
      isSpecialCollection
  );

  let promoText = isOnSale
    ? isSpecialCollection
      ? sourceLabel
      : 'Special Buy'
    : null;
  if (savings.isHalfPrice) {
    promoText = '1/2 Price';
  } else if (item.price.savingsDisplay) {
    promoText = cleanText(item.price.savingsDisplay);
  } else if (savings.saveAmount) {
    promoText = `Save $${savings.saveAmount.toFixed(2)}`;
  }

  const validDates = item.onSaleDate
    ? `On sale ${item.onSaleDate}${
        item.onSaleDateDisplay ? ` • ${item.onSaleDateDisplay}` : ''
      }`
    : item.onSaleDateDisplay || 'Everyday Range';

  const productSlug = item.urlSlugText
    ? `${ALDI_WEB_BASE}/product/${item.urlSlugText}-${item.sku}`
    : `${ALDI_WEB_BASE}/special-buys/`;

  const inStock =
    !item.discontinued &&
    !/OUT_OF_STOCK|SOLD_OUT|UNAVAILABLE/i.test(
      String(item.notForSaleReason || '')
    );
  const localStoreName = locationCtx?.aldiStoreName || null;
  const stockLabel = inStock
    ? localStoreName
      ? `In Range • ${localStoreName}`
      : 'In-Store Range'
    : localStoreName
    ? `Out of Stock • ${localStoreName}`
    : 'Out of Stock';

  return {
    id: `aldi-${item.sku || item.urlSlugText}`,
    store: 'aldi',
    storeName: 'ALDI',
    title: fullTitle,
    brand: brand || null,
    packageSize: cleanText(item.sellingSize || '') || null,
    sku: item.sku ? String(item.sku) : null,
    price: savings.price,
    priceText: item.price.amountRelevantDisplay || `$${savings.price.toFixed(2)}`,
    wasPrice: savings.wasPrice,
    saveAmount: savings.saveAmount,
    discountPercent: savings.discountPercent,
    isOnSale,
    isHalfPrice: savings.isHalfPrice,
    promoText,
    unitPrice: cleanText(item.price.comparisonDisplay || item.price.perUnitDisplay || '') || null,
    category,
    subCategory,
    imageUrl: buildAldiImageUrl(item),
    productUrl: productSlug,
    catalogueName: isOnSale
      ? `ALDI ${isSpecialCollection ? sourceLabel : 'Special Buys'}`
      : 'ALDI Everyday Range',
    validDates,
    inStock,
    stockLabel,
    localStoreName,
    fetchedAt: new Date().toISOString(),
  };
}

async function queryAldiApi(params) {
  const url = new URL(ALDI_API_BASE);
  url.searchParams.set('currency', 'AUD');
  url.searchParams.set('serviceType', 'walk-in');
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`ALDI API HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Discover dynamic facet keys for ALDI promotional collections ("Super Savers", "New Low Price", "Limited Time Only", "Grocery Specials")
 * and download live specials.
 */
export async function fetchAldiSpecials({
  searchQuery = '',
  locationCtx = {},
} = {}) {
  const seen = new Map();
  const spParam = locationCtx?.aldiStoreId
    ? { servicePoint: locationCtx.aldiStoreId }
    : {};

  // If user is performing a live web search for a specific term
  if (searchQuery.trim()) {
    const json = await queryAldiApi({
      q: searchQuery.trim(),
      limit: 32,
      offset: 0,
      sort: 'relevance',
      ...spParam,
    });
    for (const item of json.data || []) {
      const mapped = mapAldiProduct(item, 'ALDI Range & Specials', locationCtx);
      if (mapped && !seen.has(mapped.id)) {
        seen.set(mapped.id, mapped);
      }
    }
    return Array.from(seen.values());
  }

  // 1. Discover current facet IDs dynamically from a lightweight root search
  const discovery = await queryAldiApi({
    limit: 12,
    offset: 0,
    sort: 'relevance',
    ...spParam,
  });
  const facets = discovery?.meta?.facets || [];
  const catFacet = facets.find((f) => f.name === 'category-tree');
  const themeFacet = facets.find((f) => f.name === 'theme');

  const promoCollections = [];
  const everydayDepartments = [];

  if (catFacet?.values) {
    for (const v of catFacet.values) {
      if (/super\s*savers?/i.test(v.label)) {
        promoCollections.push({ param: 'categoryKey', key: v.key, fallbackParam: 'categoryTree', label: 'Super Savers', limit: 48 });
      } else if (/limited\s*time/i.test(v.label)) {
        promoCollections.push({ param: 'categoryKey', key: v.key, fallbackParam: 'categoryTree', label: 'Special Buys', limit: 60 });
      } else if (/new\s*low\s*price/i.test(v.label)) {
        promoCollections.push({ param: 'categoryKey', key: v.key, fallbackParam: 'categoryTree', label: 'Low Price Special', limit: 48 });
      } else if (
        /fruits?\s*(?:&|and)\s*veg|meat\s*(?:&|and)\s*seafood|deli\s*(?:&|and)\s*chilled|dairy|pantry|bakery|freezer|drinks|health\s*(?:&|and)\s*beauty|baby|cleaning\s*(?:&|and)\s*household|pets?|snacks?\s*(?:&|and)\s*confectionery/i.test(
          v.label
        )
      ) {
        everydayDepartments.push({
          param: 'categoryKey',
          key: v.key,
          fallbackParam: 'categoryTree',
          label: 'Everyday Range',
          limit: 60,
        });
      }
    }
  }

  if (themeFacet?.values) {
    for (const v of themeFacet.values) {
      if (/grocery\s*specials/i.test(v.label)) {
        promoCollections.push({ param: 'theme', key: v.key, label: 'Grocery Special Buys', limit: 48 });
      }
    }
  }

  if (promoCollections.length === 0) {
    promoCollections.push({ param: 'q', key: 'special', label: 'Special Buys', limit: 48 });
  }

  const fetchCollectionBatch = async (batch) => {
    await Promise.allSettled(
      batch.map(async (col) => {
        let data = [];
        try {
          const res = await queryAldiApi({
            [col.param]: col.key,
            limit: col.limit,
            offset: 0,
            sort: 'relevance',
            ...spParam,
          });
          data = res.data || [];
        } catch {
          // ignore and try fallback param
        }

        if (data.length === 0 && col.fallbackParam) {
          try {
            const res2 = await queryAldiApi({
              [col.fallbackParam]: col.key,
              limit: col.limit,
              offset: 0,
              sort: 'relevance',
              ...spParam,
            });
            data = res2.data || [];
          } catch {
            // ignore
          }
        }

        for (const raw of data) {
          const mapped = mapAldiProduct(raw, col.label, locationCtx);
          if (mapped && !seen.has(mapped.id)) {
            seen.set(mapped.id, mapped);
          }
        }
      })
    );
  };

  // Fetch promotional collections first so promo items keep their Special Buys / Super Savers badge
  await fetchCollectionBatch(promoCollections);

  // Then fetch all everyday ALDI grocery departments in gentle batches of 4
  const deptBatchSize = 4;
  for (let i = 0; i < everydayDepartments.length; i += deptBatchSize) {
    await fetchCollectionBatch(everydayDepartments.slice(i, i + deptBatchSize));
  }

  // If still empty, use discovery items
  if (seen.size === 0) {
    for (const raw of discovery?.data || []) {
      const mapped = mapAldiProduct(raw, 'Special Buys', locationCtx);
      if (mapped && !seen.has(mapped.id)) {
        seen.set(mapped.id, mapped);
      }
    }
  }

  return Array.from(seen.values());
}
