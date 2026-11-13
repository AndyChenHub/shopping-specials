import {
  CompetitorQuote,
  LocationSearchContext,
  SpecialItem,
  StoreId,
} from '../types/specials';
import {
  classifyCategory,
  computeSavings,
  decodeHtmlEntities,
  parseMoney,
} from './normalizeClient';

const REQUEST_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'text/html,application/json,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-AU,en;q=0.9',
};

const IGA_DEFAULT_STORE_ID = '32600';

const PRIVATE_LABEL_BRANDS = new RegExp(
  '^(' +
    [
      'woolworths',
      'coles finest',
      'coles',
      'macro',
      'aldi',
      'farmdale',
      'bakers life',
      'ready,? set[….]*\\s*cook!?',
      'belmont biscuit co\\.?',
      'belmont',
      'choceur',
      'stonemill',
      'urban eats',
      'ocean rise',
      'deli originals',
      'portview',
      'hillcrest',
      'power force',
      'mamia',
      'crofton',
      'curated collection',
      'community co',
      'black & gold',
    ].join('|') +
    ')\\b\\s*',
  'i'
);

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'pack',
  'each',
  'varieties',
  'selected',
  'assorted',
  'australian',
  'fresh',
  'new',
  'everyday',
]);

async function fetchWithTimeout(
  url: string,
  timeoutMs = 9500,
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
      throw new Error(`HTTP ${res.status}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function extractPackageSize(text: string): string | null {
  const m = text.match(
    /\b(\d+(?:\.\d+)?\s*(?:kg|g|ml|l|litre|litres|pk|pack))\b/i
  );
  return m ? m[1].replace(/litres?/i, 'L').trim() : null;
}

/**
 * Clean up catalogue/product titles so cross-store search engines match accurately.
 */
export function buildCleanSearchQuery(item: {
  title: string;
  brand?: string | null;
  packageSize?: string | null;
}): string {
  let q = item.title
    .replace(/['’‘`]/g, '')
    .replace(/[®™^~*Δ]/g, ' ')
    // Collapse "A, B or C" multi-flavour catalogue titles into "A"
    .replace(/,\s*[^,]{2,28}\s+\bor\b\s+[A-Za-z0-9'&-]+(?:\s+[A-Za-z0-9'&-]+)?/gi, ' ')
    .replace(/\s+\bor\b\s+[A-Za-z0-9'&-]+(?=\s+(?:soft|chocolate|ice|chips|biscuits|blocks|multipacks|drink|varieties|pk|pack|\d))/gi, ' ')
    // Remove range sizes like "400-700ml" or "Pk 8-14" that break exact search
    .replace(/\b\d+\s*-\s*\d+\s*(?:g|kg|ml|l|pk|pack)?\b/gi, ' ')
    .replace(/\bpk\s+(\d+)\b/gi, '$1 pack')
    .replace(/\blitres?\b/gi, 'L')
    .replace(/\b(varieties|selected|assorted|from the deli|from the seafood counter|from the bakery)\b/gi, ' ')
    .replace(PRIVATE_LABEL_BRANDS, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Keep query concise (max 7 tokens) so retailer search engines don't over-constrain
  const words = q.split(' ').filter(Boolean);
  if (words.length > 7) {
    q = words.slice(0, 7).join(' ');
  }
  return q || item.title.slice(0, 40);
}

function buildConciseFallbackQuery(
  fullQuery: string,
  packageSize?: string | null
): string | null {
  const words = fullQuery.split(' ').filter(Boolean);
  if (words.length <= 4) return null;
  const head = words.slice(0, 3).join(' ');
  const size = packageSize ? packageSize.trim() : '';
  return size && !head.toLowerCase().includes(size.toLowerCase())
    ? `${head} ${size}`
    : head;
}

// ---------------------------------------------------------------------------
// 1. WOOLWORTHS LIVE PRODUCT SEARCH (Everyday + Specials)
// ---------------------------------------------------------------------------
export async function searchWoolworthsProducts(
  query: string,
  limit = 16,
  locationCtx: LocationSearchContext = {}
): Promise<SpecialItem[]> {
  const pageSize = Math.min(Math.max(limit, 20), 36);
  const url = `https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=${encodeURIComponent(
    query
  )}&pageSize=${pageSize}`;
  const res = await fetchWithTimeout(url, 9500, { Accept: 'application/json' });
  const json = await res.json();

  const localStoreName = locationCtx.wwStoreName || null;
  const out: SpecialItem[] = [];
  for (const bundle of json?.Products || []) {
    for (const p of bundle?.Products || []) {
      if (typeof p?.Price !== 'number' || p.Price <= 0) continue;

      const title = decodeHtmlEntities(p.DisplayName || p.Name || '');
      if (!title) continue;

      const wasPrice =
        typeof p.WasPrice === 'number' && p.WasPrice > p.Price ? p.WasPrice : null;
      const saveAmount =
        typeof p.SavingsAmount === 'number' && p.SavingsAmount > 0
          ? p.SavingsAmount
          : wasPrice
          ? Math.round((wasPrice - p.Price) * 100) / 100
          : null;

      const isHalfPrice = Boolean(
        p.IsHalfPrice ||
          (wasPrice && (wasPrice - p.Price) / wasPrice >= 0.48)
      );
      const isOnSale = Boolean(p.IsOnSpecial || isHalfPrice || (saveAmount && saveAmount > 0));

      const discountPercent =
        wasPrice && wasPrice > p.Price
          ? Math.round(((wasPrice - p.Price) / wasPrice) * 100)
          : isHalfPrice
          ? 50
          : null;

      let promoText: string | null = null;
      if (isHalfPrice) promoText = '1/2 Price';
      else if (saveAmount && saveAmount > 0) promoText = `Save $${saveAmount.toFixed(2)}`;
      else if (isOnSale) promoText = 'On Special';

      const inStock = Boolean(
        p.IsInStock ?? p.InstoreIsAvailable ?? p.IsAvailable ?? true
      );
      const stockLabel = inStock
        ? localStoreName
          ? `In Stock • ${localStoreName}`
          : 'In Stock'
        : localStoreName
        ? `Out of Stock • ${localStoreName}`
        : 'Out of Stock';

      const slug = p.UrlFriendlyName || '';
      const productUrl = p.Stockcode
        ? `https://www.woolworths.com.au/shop/productdetails/${p.Stockcode}/${slug}`
        : `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(
            query
          )}`;

      out.push({
        id: `woolworths-sku-${p.Stockcode || title}`,
        store: 'woolworths',
        storeName: 'Woolworths',
        title,
        brand: p.Brand ? decodeHtmlEntities(p.Brand) : null,
        packageSize: p.PackageSize ? decodeHtmlEntities(p.PackageSize) : extractPackageSize(title),
        barcode: p.Barcode ? String(p.Barcode) : null,
        sku: p.Stockcode ? String(p.Stockcode) : null,
        price: p.Price,
        priceText: `$${p.Price.toFixed(2)}`,
        wasPrice,
        saveAmount,
        discountPercent,
        isOnSale,
        isHalfPrice,
        promoText,
        unitPrice: p.CupString ? decodeHtmlEntities(p.CupString) : null,
        category: classifyCategory('', title, 'woolworths'),
        imageUrl: p.LargeImageFile || p.MediumImageFile || null,
        productUrl,
        catalogueName: isOnSale ? 'Woolworths Specials' : 'Woolworths Everyday Range',
        validDates: isOnSale ? 'Current Store Price' : 'Everyday Regular Price',
        inStock,
        stockLabel,
        localStoreName,
        fetchedAt: new Date().toISOString(),
      });

      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. COLES LIVE PRODUCT SEARCH (Everyday + Specials via __NEXT_DATA__)
// ---------------------------------------------------------------------------
export async function searchColesProducts(
  query: string,
  limit = 10,
  locationCtx: LocationSearchContext = {}
): Promise<SpecialItem[]> {
  const searchUrl = `https://www.coles.com.au/search/products?q=${encodeURIComponent(
    query
  )}`;
  const res = await fetchWithTimeout(searchUrl, 10000);
  const html = await res.text();

  const nextMatch = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i
  );
  if (!nextMatch) return [];

  const nextJson = JSON.parse(nextMatch[1]);
  const rawResults =
    nextJson?.props?.pageProps?.searchResults?.results || [];

  const out: SpecialItem[] = [];
  for (const r of rawResults) {
    if (r?._type !== 'PRODUCT' || typeof r?.pricing?.now !== 'number') continue;

    const price: number = r.pricing.now;
    if (price <= 0) continue;

    const brand = r.brand ? decodeHtmlEntities(r.brand) : '';
    const baseName = decodeHtmlEntities(r.name || '');
    const size = r.size ? decodeHtmlEntities(r.size) : '';
    const fullTitle = [
      brand && !baseName.toLowerCase().startsWith(brand.toLowerCase()) ? brand : '',
      baseName,
      size && !baseName.toLowerCase().includes(size.toLowerCase()) ? size : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!fullTitle) continue;

    const wasRaw = typeof r.pricing.was === 'number' && r.pricing.was > price ? r.pricing.was : null;
    const offerDesc = r.pricing.offerDescription
      ? decodeHtmlEntities(r.pricing.offerDescription)
      : '';

    const savings = computeSavings({
      price,
      wasPrice: wasRaw,
      promoText: offerDesc,
    });

    const isOnSale = Boolean(
      r.pricing.promotionType === 'SPECIAL' ||
        r.pricing.onlineSpecial ||
        savings.isHalfPrice ||
        (savings.saveAmount && savings.saveAmount > 0) ||
        offerDesc
    );

    let promoText: string | null = null;
    if (savings.isHalfPrice) promoText = '1/2 Price';
    else if (savings.saveAmount && savings.saveAmount > 0) {
      promoText = `Save $${savings.saveAmount.toFixed(2)}`;
    } else if (offerDesc) {
      promoText = offerDesc;
    } else if (isOnSale) {
      promoText = 'Special';
    }

    const imgUri = r.imageUris?.[0]?.uri;
    const imageUrl = imgUri
      ? `https://productimages.coles.com.au/productimages${imgUri}`
      : null;

    const slug = fullTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const productUrl = r.id
      ? `https://www.coles.com.au/product/${slug}-${r.id}`
      : searchUrl;

    const catHint = r.merchandiseHeir?.category || r.merchandiseHeir?.subCategory || '';

    const inStock =
      typeof r.availability === 'boolean'
        ? r.availability
        : r.availabilityType
        ? !/OUT|UNAVAIL/i.test(String(r.availabilityType))
        : true;
    const regionTag = locationCtx.suburb
      ? `Coles ${locationCtx.suburb}`
      : locationCtx.state
      ? `Coles ${locationCtx.state}`
      : null;
    const stockLabel = inStock
      ? regionTag
        ? `In Stock • ${regionTag}`
        : 'In Stock'
      : 'Out of Stock';

    out.push({
      id: `coles-sku-${r.id || slug}`,
      store: 'coles',
      storeName: 'Coles',
      title: fullTitle,
      brand: brand || null,
      packageSize: size || extractPackageSize(fullTitle),
      sku: r.id ? String(r.id) : null,
      price,
      priceText: `$${price.toFixed(2)}`,
      wasPrice: savings.wasPrice,
      saveAmount: savings.saveAmount,
      discountPercent: savings.discountPercent,
      isOnSale,
      isHalfPrice: savings.isHalfPrice,
      promoText,
      unitPrice: r.pricing.comparable ? decodeHtmlEntities(r.pricing.comparable) : null,
      category: classifyCategory(catHint, fullTitle, 'coles'),
      imageUrl,
      productUrl,
      catalogueName: isOnSale ? 'Coles Specials' : 'Coles Everyday Range',
      validDates: isOnSale ? 'Current Store Price' : 'Everyday Regular Price',
      inStock,
      stockLabel,
      localStoreName: regionTag,
      fetchedAt: new Date().toISOString(),
    });

    if (out.length >= limit) break;
  }

  return out;
}

// ---------------------------------------------------------------------------
// 3. ALDI LIVE PRODUCT SEARCH (Everyday + Special Buys)
// ---------------------------------------------------------------------------
export async function searchAldiProducts(
  query: string,
  limit = 12,
  locationCtx: LocationSearchContext = {}
): Promise<SpecialItem[]> {
  // ALDI API allows limit in [12,16,24,30,32,48,60]
  const validLimit = limit <= 12 ? 12 : limit <= 16 ? 16 : 24;
  const qs = new URLSearchParams({
    currency: 'AUD',
    serviceType: 'walk-in',
    q: query,
    limit: String(validLimit),
    offset: '0',
    sort: 'relevance',
  });
  if (locationCtx.aldiStoreId) {
    qs.set('servicePoint', locationCtx.aldiStoreId);
  }

  const res = await fetchWithTimeout(
    `https://api.aldi.com.au/v3/product-search?${qs.toString()}`,
    9500,
    { Accept: 'application/json' }
  );
  const json = await res.json();

  const out: SpecialItem[] = [];
  for (const item of json?.data || []) {
    if (!item?.name || !item?.price) continue;
    const rawPrice =
      typeof item.price.amountRelevant === 'number'
        ? item.price.amountRelevant / 100
        : typeof item.price.amount === 'number'
        ? item.price.amount / 100
        : parseMoney(item.price.amountRelevantDisplay);

    if (rawPrice === null || rawPrice <= 0) continue;

    const brand = decodeHtmlEntities(item.brandName || '');
    const baseName = decodeHtmlEntities(item.name);
    const fullTitle =
      brand && !baseName.toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${baseName}`
        : baseName;

    const savings = computeSavings({
      price: rawPrice,
      wasPrice: item.price.wasPriceDisplay,
      saveAmount: item.price.savingsDisplay,
      promoText: item.price.savingsDisplay || '',
    });

    const isSpecialBuy = Boolean(item.onSaleDate);
    const isOnSale = Boolean(
      savings.isHalfPrice ||
        (savings.saveAmount && savings.saveAmount > 0) ||
        item.price.savingsDisplay ||
        isSpecialBuy
    );

    let promoText: string | null = null;
    if (savings.isHalfPrice) promoText = '1/2 Price';
    else if (item.price.savingsDisplay) {
      promoText = decodeHtmlEntities(item.price.savingsDisplay);
    } else if (isSpecialBuy) {
      promoText = 'Special Buy';
    }

    const front =
      (item.assets || []).find((a: { assetType?: string }) => a.assetType === 'FR01') ||
      item.assets?.[0];
    const slug = item.urlSlugText || 'aldi-product';
    const imageUrl = front?.url
      ? String(front.url).replace('{width}', '500').replace('{slug}', `${slug}.jpg`)
      : null;

    const catNames = (item.categories || [])
      .map((c: { name?: string }) => c.name || '')
      .join(' ');

    const aldiStoreName = locationCtx.aldiStoreName || null;
    const inStock =
      !item.discontinued &&
      !/OUT_OF_STOCK/i.test(String(item.notForSaleReason || ''));
    const stockLabel = !inStock
      ? aldiStoreName
        ? `Sold Out • ${aldiStoreName}`
        : 'Out of Stock'
      : isSpecialBuy
      ? aldiStoreName
        ? `Special Buy • ${aldiStoreName}`
        : 'Limited Special Buy'
      : aldiStoreName
      ? `In Range • ${aldiStoreName}`
      : 'In-Store Range';

    out.push({
      id: `aldi-${item.sku || slug}`,
      store: 'aldi',
      storeName: 'ALDI',
      title: fullTitle,
      brand: brand || null,
      packageSize: decodeHtmlEntities(item.sellingSize || '') || extractPackageSize(fullTitle),
      sku: item.sku ? String(item.sku) : null,
      price: rawPrice,
      priceText: item.price.amountRelevantDisplay || `$${rawPrice.toFixed(2)}`,
      wasPrice: savings.wasPrice,
      saveAmount: savings.saveAmount,
      discountPercent: savings.discountPercent,
      isOnSale,
      isHalfPrice: savings.isHalfPrice,
      promoText,
      unitPrice:
        decodeHtmlEntities(
          item.price.comparisonDisplay || item.price.perUnitDisplay || ''
        ) || null,
      category: classifyCategory(catNames, fullTitle, 'aldi'),
      imageUrl,
      productUrl: item.urlSlugText
        ? `https://www.aldi.com.au/product/${item.urlSlugText}-${item.sku}`
        : `https://www.aldi.com.au/results?q=${encodeURIComponent(query)}`,
      catalogueName: isOnSale ? 'ALDI Special Buys' : 'ALDI Everyday Low Price',
      validDates: item.onSaleDateDisplay || 'Everyday Range',
      inStock,
      stockLabel,
      localStoreName: aldiStoreName,
      fetchedAt: new Date().toISOString(),
    });

    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 4. IGA SHOP LIVE PRODUCT SEARCH (Everyday + Specials)
// ---------------------------------------------------------------------------
export async function searchIgaProducts(
  query: string,
  limit = 10,
  locationCtx: LocationSearchContext = {}
): Promise<SpecialItem[]> {
  const activeStoreId = locationCtx.igaStoreId || IGA_DEFAULT_STORE_ID;
  const localStoreName = locationCtx.igaStoreName || null;
  const url = `https://www.igashop.com.au/api/storefront/stores/${encodeURIComponent(
    activeStoreId
  )}/search?q=${encodeURIComponent(query)}&take=${limit}`;

  const res = await fetchWithTimeout(url, 9500, { Accept: 'application/json' });
  const json = await res.json();

  const out: SpecialItem[] = [];
  for (const item of json?.items || []) {
    const price =
      typeof item?.priceNumeric === 'number'
        ? item.priceNumeric
        : parseMoney(item?.price);
    if (price === null || price <= 0) continue;

    const brand = item.brand ? decodeHtmlEntities(item.brand) : '';
    const rawName = decodeHtmlEntities(item.name || '');
    const sizeStr =
      item.unitOfSize?.size && item.unitOfSize?.abbreviation
        ? `${item.unitOfSize.size}${item.unitOfSize.abbreviation}`
        : '';

    const fullTitle = [
      brand && !rawName.toLowerCase().startsWith(brand.toLowerCase()) ? brand : '',
      rawName,
      sizeStr && !rawName.toLowerCase().includes(sizeStr.toLowerCase()) ? sizeStr : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!fullTitle) continue;

    const wasPrice =
      typeof item.wasPriceNumeric === 'number' && item.wasPriceNumeric > price
        ? item.wasPriceNumeric
        : null;

    const savings = computeSavings({
      price,
      wasPrice,
      promoText: item.priceLabel || '',
    });

    const isOnSale = Boolean(
      item.priceSource === 'tpr' ||
        item.priceLabel ||
        savings.isHalfPrice ||
        (savings.saveAmount && savings.saveAmount > 0)
    );

    let promoText: string | null = null;
    if (savings.isHalfPrice) promoText = '1/2 Price';
    else if (item.priceLabel) promoText = decodeHtmlEntities(item.priceLabel);
    else if (savings.saveAmount && savings.saveAmount > 0) {
      promoText = `Save $${savings.saveAmount.toFixed(2)}`;
    }

    const catHint =
      item.defaultCategory?.[0]?.categoryBreadcrumb || '';

    const inStock = item.available !== false;
    const stockLabel = inStock
      ? localStoreName
        ? `In Stock • ${localStoreName}`
        : 'In Stock'
      : localStoreName
      ? `Out of Stock • ${localStoreName}`
      : 'Out of Stock';

    out.push({
      id: `iga-${activeStoreId}-${item.productId || item.sku || fullTitle}`,
      store: 'iga',
      storeName: 'IGA',
      title: fullTitle,
      brand: brand || null,
      packageSize: sizeStr || extractPackageSize(fullTitle),
      sku: item.sku ? String(item.sku) : null,
      price,
      priceText: `$${price.toFixed(2)}`,
      wasPrice: savings.wasPrice,
      saveAmount: savings.saveAmount,
      discountPercent: savings.discountPercent,
      isOnSale,
      isHalfPrice: savings.isHalfPrice,
      promoText,
      unitPrice: item.pricePerUnit ? decodeHtmlEntities(item.pricePerUnit) : null,
      category: classifyCategory(catHint, fullTitle, 'iga'),
      imageUrl: item.image?.default || item.image?.cell || null,
      productUrl: `https://www.igashop.com.au/search?q=${encodeURIComponent(fullTitle)}`,
      catalogueName:
        localStoreName || (isOnSale ? 'IGA Price Match & Specials' : 'IGA Everyday Range'),
      validDates: isOnSale ? 'Current Store Offer' : 'Everyday Regular Price',
      inStock,
      stockLabel,
      localStoreName,
      fetchedAt: new Date().toISOString(),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 5. AMAZON AUSTRALIA LIVE PRODUCT SEARCH (amazon.com.au)
// ---------------------------------------------------------------------------
export async function searchAmazonAuProducts(
  query: string,
  limit = 8
): Promise<SpecialItem[]> {
  const searchUrl = `https://www.amazon.com.au/s?k=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(searchUrl, 10000);
  const html = await res.text();

  const out: SpecialItem[] = [];
  const parts = html.split(
    /(?=<div[^>]*data-component-type="s-search-result"[^>]*>)/i
  );

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];
    const asinMatch = block.slice(0, 360).match(/data-asin="([A-Z0-9]{10})"/i);
    if (!asinMatch) continue;
    const asin = asinMatch[1];

    // Skip paid irrelevant sponsored ad placements
    if (/s-sponsored-label|AdHolder/i.test(block.slice(0, 900))) continue;

    const rawTitle =
      block.match(/<h2[^>]*aria-label="([^"]+)"/i)?.[1] ||
      block.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
      '';
    const title = decodeHtmlEntities(rawTitle).replace(/^Sponsored Ad\s*[-–]\s*/i, '');
    if (!title) continue;

    const priceStr = block.match(
      /class="a-price"[^>]*>[\s\S]*?<span class="a-offscreen">(\$[\d,.]+)<\/span>/i
    )?.[1];
    const price = parseMoney(priceStr);
    if (price === null || price <= 0) continue;

    const wasStr = block.match(
      /data-a-strike="true"[^>]*>[\s\S]*?<span class="a-offscreen">(\$[\d,.]+)<\/span>/i
    )?.[1];
    const savings = computeSavings({ price, wasPrice: wasStr });
    const isOnSale = Boolean(savings.wasPrice && savings.wasPrice > price);

    const img =
      block.match(/class="s-image"[^>]*src="([^"]+)"/i)?.[1] ||
      block.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i)?.[1] ||
      null;

    const unitMatch = block.match(
      /\((\$[\d,.]+\s*\/\s*(?:\d+\s*)?[a-zA-Z]+)\)/
    );

    out.push({
      id: `amazon-${asin}`,
      store: 'amazon',
      storeName: 'Amazon AU',
      title,
      brand: null,
      packageSize: extractPackageSize(title),
      price,
      priceText: `$${price.toFixed(2)}`,
      wasPrice: savings.wasPrice,
      saveAmount: savings.saveAmount,
      discountPercent: savings.discountPercent,
      isOnSale,
      isHalfPrice: savings.isHalfPrice,
      promoText:
        savings.saveAmount && savings.saveAmount > 0
          ? `Save $${savings.saveAmount.toFixed(2)}`
          : null,
      unitPrice: unitMatch ? unitMatch[1] : null,
      category: classifyCategory('', title, 'amazon'),
      imageUrl: img,
      productUrl: `https://www.amazon.com.au/dp/${asin}`,
      catalogueName: 'Amazon.com.au',
      validDates: 'Live Amazon Price',
      inStock: true,
      stockLabel: 'In Stock Online',
      localStoreName: 'Amazon AU Delivery',
      fetchedAt: new Date().toISOString(),
    });

    if (out.length >= limit) break;
  }

  return out;
}

// ---------------------------------------------------------------------------
// RELEVANCE MATCHING & CROSS-COMPETITOR PRICE COMPARISON
// ---------------------------------------------------------------------------
function tokenizeMeaningful(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[®™^~*Δ]/g, '')
    .replace(PRIVATE_LABEL_BRANDS, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+(?:g|kg|ml|l|pk)?$/.test(w));
}

function parseNumericGramsOrMl(sizeText: string | null | undefined): number | null {
  if (!sizeText) return null;
  const m = sizeText.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml)\b/);
  if (!m) return null;
  const val = parseFloat(m[1]);
  const unit = m[2];
  if (unit === 'kg' || unit === 'l') return val * 1000;
  return val;
}

function pickBestCandidate(
  target: SpecialItem,
  candidates: SpecialItem[]
): SpecialItem | null {
  if (candidates.length === 0) return null;

  const targetTokens = tokenizeMeaningful(
    buildCleanSearchQuery({
      title: target.title,
      brand: target.brand,
      packageSize: target.packageSize,
    })
  );
  if (targetTokens.length === 0) return candidates[0];

  const targetMeasure = parseNumericGramsOrMl(
    target.packageSize || target.title
  );

  let best: SpecialItem | null = null;
  let bestScore = -999;

  for (let idx = 0; idx < candidates.length; idx++) {
    const c = candidates[idx];
    const candLower = c.title.toLowerCase();
    let matchedTokens = 0;
    for (const tok of targetTokens) {
      if (candLower.includes(tok)) matchedTokens += 1;
    }

    const overlapRatio = matchedTokens / targetTokens.length;
    if (matchedTokens === 0) continue;
    if (targetTokens.length >= 3 && matchedTokens < 2 && overlapRatio < 0.34) {
      continue;
    }

    // Rank bonus for earlier search rank + token overlap
    let score = overlapRatio * 60 + matchedTokens * 10 - idx * 1.5;

    // Brand match bonus
    if (target.brand && candLower.includes(target.brand.toLowerCase())) {
      score += 18;
    }

    // Pack size similarity bonus
    const candMeasure = parseNumericGramsOrMl(c.packageSize || c.title);
    if (targetMeasure && candMeasure) {
      const ratio =
        Math.min(targetMeasure, candMeasure) /
        Math.max(targetMeasure, candMeasure);
      if (ratio >= 0.85) score += 22;
      else if (ratio < 0.4) score -= 12;
    }

    // Penalize wholesale bulk cartons / multipacks when comparing a single grocery item
    if (target.price < 25 && c.price > target.price * 3.5) {
      score -= 35;
    }
    const bulkRe =
      /\b(pack of [2-9]\d*|[2-9]\s*pack\s*x|\d+\s*x\s*\d+\s*(?:g|kg|ml|l)|carton|case of|bulk)\b/i;
    if (bulkRe.test(c.title) && !bulkRe.test(target.title)) {
      score -= 32;
    }

    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best;
}

function fallbackSearchUrl(store: StoreId, query: string): string {
  const enc = encodeURIComponent(query);
  switch (store) {
    case 'woolworths':
      return `https://www.woolworths.com.au/shop/search/products?searchTerm=${enc}`;
    case 'coles':
      return `https://www.coles.com.au/search/products?q=${enc}`;
    case 'aldi':
      return `https://www.aldi.com.au/results?q=${enc}`;
    case 'iga':
      return `https://www.igashop.com.au/search?q=${enc}`;
    case 'amazon':
      return `https://www.amazon.com.au/s?k=${enc}`;
  }
}

const COMPETITOR_LIST: Array<{
  store: StoreId;
  storeName: CompetitorQuote['storeName'];
  fetcher: (
    q: string,
    limit: number,
    ctx?: LocationSearchContext
  ) => Promise<SpecialItem[]>;
}> = [
  { store: 'woolworths', storeName: 'Woolworths', fetcher: searchWoolworthsProducts },
  { store: 'coles', storeName: 'Coles', fetcher: searchColesProducts },
  { store: 'aldi', storeName: 'ALDI', fetcher: searchAldiProducts },
  { store: 'iga', storeName: 'IGA', fetcher: searchIgaProducts },
  { store: 'amazon', storeName: 'Amazon AU', fetcher: searchAmazonAuProducts },
];

/**
 * Compare a clicked item across Woolworths, Coles, ALDI, IGA, and Amazon AU!
 */
export async function compareItemAcrossCompetitorsOnDevice(
  item: SpecialItem,
  locationCtx: LocationSearchContext = {}
): Promise<{ queryUsed: string; quotes: CompetitorQuote[] }> {
  const queryUsed = buildCleanSearchQuery(item);

  const settled = await Promise.allSettled(
    COMPETITOR_LIST.map(async (comp) => {
      const isOwnStore = comp.store === item.store;
      const needsLiveLocalStock =
        isOwnStore &&
        (item.inStock === undefined ||
          item.inStock === null ||
          (comp.store === 'iga' &&
            locationCtx.igaStoreName &&
            item.localStoreName !== locationCtx.igaStoreName) ||
          (comp.store === 'woolworths' &&
            locationCtx.wwStoreName &&
            item.localStoreName !== locationCtx.wwStoreName) ||
          (comp.store === 'aldi' &&
            locationCtx.aldiStoreName &&
            item.localStoreName !== locationCtx.aldiStoreName));

      if (isOwnStore && !needsLiveLocalStock) {
        return {
          store: comp.store,
          storeName: comp.storeName,
          matched: true,
          title: item.title,
          packageSize: item.packageSize,
          price: item.price,
          priceText: item.priceText || `$${item.price.toFixed(2)}`,
          wasPrice: item.wasPrice,
          saveAmount: item.saveAmount,
          isOnSale: item.isOnSale,
          isHalfPrice: item.isHalfPrice,
          promoText: item.promoText,
          unitPrice: item.unitPrice,
          imageUrl: item.imageUrl,
          productUrl: item.productUrl || fallbackSearchUrl(comp.store, queryUsed),
          inStock: item.inStock ?? true,
          stockLabel: item.stockLabel || 'In Stock',
          localStoreName: item.localStoreName || null,
          isCurrentItem: true,
        } satisfies CompetitorQuote;
      }

      let candidates: SpecialItem[] = [];
      try {
        candidates = await comp.fetcher(queryUsed, 8, locationCtx);
      } catch {
        candidates = [];
      }
      let best = pickBestCandidate(item, candidates);
      if (!best) {
        const shortQ = buildConciseFallbackQuery(queryUsed, item.packageSize);
        if (shortQ) {
          try {
            candidates = await comp.fetcher(shortQ, 8, locationCtx);
            best = pickBestCandidate(item, candidates);
          } catch {
            // ignore fallback error
          }
        }
      }

      if (isOwnStore) {
        return {
          store: comp.store,
          storeName: comp.storeName,
          matched: true,
          title: item.title,
          packageSize: item.packageSize || best?.packageSize || null,
          price: comp.store === 'iga' && best?.price ? best.price : item.price,
          priceText:
            comp.store === 'iga' && best?.priceText
              ? best.priceText
              : item.priceText || `$${item.price.toFixed(2)}`,
          wasPrice: item.wasPrice ?? best?.wasPrice ?? null,
          saveAmount: item.saveAmount ?? best?.saveAmount ?? null,
          isOnSale: item.isOnSale || Boolean(best?.isOnSale),
          isHalfPrice: item.isHalfPrice || Boolean(best?.isHalfPrice),
          promoText: item.promoText || best?.promoText || null,
          unitPrice: item.unitPrice || best?.unitPrice || null,
          imageUrl: item.imageUrl || best?.imageUrl || null,
          productUrl:
            best?.productUrl ||
            item.productUrl ||
            fallbackSearchUrl(comp.store, queryUsed),
          inStock: best ? best.inStock ?? true : item.inStock ?? null,
          stockLabel:
            best?.stockLabel || item.stockLabel || 'Check Local Store Stock',
          localStoreName: best?.localStoreName || item.localStoreName || null,
          isCurrentItem: true,
        } satisfies CompetitorQuote;
      }

      if (best) {
        return {
          store: comp.store,
          storeName: comp.storeName,
          matched: true,
          title: best.title,
          packageSize: best.packageSize,
          price: best.price,
          priceText: best.priceText,
          wasPrice: best.wasPrice,
          saveAmount: best.saveAmount,
          isOnSale: best.isOnSale,
          isHalfPrice: best.isHalfPrice,
          promoText: best.promoText,
          unitPrice: best.unitPrice,
          imageUrl: best.imageUrl,
          productUrl: best.productUrl || fallbackSearchUrl(comp.store, queryUsed),
          inStock: best.inStock ?? true,
          stockLabel: best.stockLabel || 'In Stock',
          localStoreName: best.localStoreName || null,
        } satisfies CompetitorQuote;
      }

      return {
        store: comp.store,
        storeName: comp.storeName,
        matched: false,
        title: `Search "${queryUsed}" on ${comp.storeName}`,
        packageSize: null,
        price: null,
        priceText: null,
        wasPrice: null,
        saveAmount: null,
        isOnSale: false,
        isHalfPrice: false,
        promoText: null,
        unitPrice: null,
        imageUrl: null,
        productUrl: fallbackSearchUrl(comp.store, queryUsed),
        inStock: null,
        stockLabel: 'Check Store Website',
        localStoreName: null,
      } satisfies CompetitorQuote;
    })
  );

  const quotes: CompetitorQuote[] = settled.map((res, idx) => {
    if (res.status === 'fulfilled') return res.value;
    const comp = COMPETITOR_LIST[idx];
    return {
      store: comp.store,
      storeName: comp.storeName,
      matched: false,
      title: `Search "${queryUsed}" on ${comp.storeName}`,
      packageSize: null,
      price: null,
      priceText: null,
      wasPrice: null,
      saveAmount: null,
      isOnSale: false,
      isHalfPrice: false,
      promoText: null,
      unitPrice: null,
      imageUrl: null,
      productUrl: fallbackSearchUrl(comp.store, queryUsed),
    };
  });

  // Sort matched quotes from cheapest price to highest, with unmatched search links at the bottom
  quotes.sort((a, b) => {
    if (a.matched !== b.matched) return a.matched ? -1 : 1;
    if (a.price !== null && b.price !== null) return a.price - b.price;
    return 0;
  });

  return { queryUsed, quotes };
}

/**
 * Live cross-store product search (both everyday items & sales) across Woolworths, Coles, ALDI, IGA & Amazon AU!
 */
export async function searchAllCompetitorsLive(
  query: string,
  locationCtx: LocationSearchContext = {}
): Promise<SpecialItem[]> {
  const q = query.trim();
  if (!q) return [];

  const settled = await Promise.allSettled([
    searchWoolworthsProducts(q, 20, locationCtx),
    searchColesProducts(q, 20, locationCtx),
    searchAldiProducts(q, 24, locationCtx),
    searchIgaProducts(q, 16, locationCtx),
    searchAmazonAuProducts(q, 10),
  ]);

  const lists = settled.map((r) => (r.status === 'fulfilled' ? r.value : []));
  const maxLen = Math.max(...lists.map((l) => l.length), 0);
  const interleaved: SpecialItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length && !seen.has(list[i].id)) {
        seen.add(list[i].id);
        interleaved.push(list[i]);
      }
    }
  }
  return interleaved;
}
