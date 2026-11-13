import { classifyCategory, computeSavings, cleanText, parseMoney } from '../normalize.js';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const IGA_STORE_ID = '32600';

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

function extractPackageSize(text = '') {
  const m = text.match(/\b(\d+(?:\.\d+)?\s*(?:kg|g|ml|l|litre|litres|pk|pack))\b/i);
  return m ? m[1].replace(/litres?/i, 'L').trim() : null;
}

export function buildCleanSearchQuery(item) {
  let q = String(item?.title || '')
    .replace(/['’‘`]/g, '')
    .replace(/[®™^~*Δ]/g, ' ')
    .replace(/,\s*[^,]{2,28}\s+\bor\b\s+[A-Za-z0-9'&-]+(?:\s+[A-Za-z0-9'&-]+)?/gi, ' ')
    .replace(
      /\s+\bor\b\s+[A-Za-z0-9'&-]+(?=\s+(?:soft|chocolate|ice|chips|biscuits|blocks|multipacks|drink|varieties|pk|pack|\d))/gi,
      ' '
    )
    .replace(/\b\d+\s*-\s*\d+\s*(?:g|kg|ml|l|pk|pack)?\b/gi, ' ')
    .replace(/\bpk\s+(\d+)\b/gi, '$1 pack')
    .replace(/\blitres?\b/gi, 'L')
    .replace(/\b(varieties|selected|assorted|from the deli|from the seafood counter|from the bakery)\b/gi, ' ')
    .replace(PRIVATE_LABEL_BRANDS, '')
    .replace(/\s+/g, ' ')
    .trim();

  const words = q.split(' ').filter(Boolean);
  if (words.length > 7) q = words.slice(0, 7).join(' ');
  return q || String(item?.title || '').slice(0, 40);
}

function buildConciseFallbackQuery(fullQuery, packageSize) {
  const words = fullQuery.split(' ').filter(Boolean);
  if (words.length <= 4) return null;
  const head = words.slice(0, 3).join(' ');
  const size = packageSize ? String(packageSize).trim() : '';
  return size && !head.toLowerCase().includes(size.toLowerCase())
    ? `${head} ${size}`
    : head;
}

export async function searchWoolworthsProducts(query, limit = 16, locationCtx = {}) {
  const pageSize = Math.min(Math.max(limit, 20), 36);
  const url = `https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=${encodeURIComponent(query)}&pageSize=${pageSize}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Woolworths HTTP ${res.status}`);
  const json = await res.json();

  const localStoreName = locationCtx?.wwStoreName || null;
  const out = [];
  for (const bundle of json?.Products || []) {
    for (const p of bundle?.Products || []) {
      if (typeof p?.Price !== 'number' || p.Price <= 0) continue;
      const title = cleanText(p.DisplayName || p.Name || '');
      if (!title) continue;

      const wasPrice = typeof p.WasPrice === 'number' && p.WasPrice > p.Price ? p.WasPrice : null;
      const saveAmount =
        typeof p.SavingsAmount === 'number' && p.SavingsAmount > 0
          ? p.SavingsAmount
          : wasPrice
          ? Math.round((wasPrice - p.Price) * 100) / 100
          : null;

      const isHalfPrice = Boolean(
        p.IsHalfPrice || (wasPrice && (wasPrice - p.Price) / wasPrice >= 0.48)
      );
      const isOnSale = Boolean(p.IsOnSpecial || isHalfPrice || (saveAmount && saveAmount > 0));
      const discountPercent =
        wasPrice && wasPrice > p.Price
          ? Math.round(((wasPrice - p.Price) / wasPrice) * 100)
          : isHalfPrice
          ? 50
          : null;

      let promoText = null;
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

      const wwCatHint = [
        p.Department,
        p.AdditionalAttributes?.piesdepartmentnamesjson,
        p.AdditionalAttributes?.piescategorynamesjson,
        p.AdditionalAttributes?.sapcategoryname,
        p.AdditionalAttributes?.sapsubcategoryname,
      ]
        .filter(Boolean)
        .join(' ');

      out.push({
        id: `woolworths-sku-${p.Stockcode || title}`,
        store: 'woolworths',
        storeName: 'Woolworths',
        title,
        brand: p.Brand ? cleanText(p.Brand) : null,
        packageSize: p.PackageSize ? cleanText(p.PackageSize) : extractPackageSize(title),
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
        unitPrice: p.CupString ? cleanText(p.CupString) : null,
        category: classifyCategory(wwCatHint, title, 'woolworths'),
        imageUrl: p.LargeImageFile || p.MediumImageFile || null,
        productUrl: p.Stockcode
          ? `https://www.woolworths.com.au/shop/productdetails/${p.Stockcode}/${p.UrlFriendlyName || ''}`
          : `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(query)}`,
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

export async function searchColesProducts(query, limit = 10, locationCtx = {}) {
  const searchUrl = `https://www.coles.com.au/search/products?q=${encodeURIComponent(query)}`;
  const res = await fetch(searchUrl, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-AU,en;q=0.9' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Coles HTTP ${res.status}`);
  const html = await res.text();

  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!nextMatch) return [];

  const nextJson = JSON.parse(nextMatch[1]);
  const rawResults = nextJson?.props?.pageProps?.searchResults?.results || [];

  const out = [];
  for (const r of rawResults) {
    if (r?._type !== 'PRODUCT' || typeof r?.pricing?.now !== 'number') continue;
    const price = r.pricing.now;
    if (price <= 0) continue;

    const brand = r.brand ? cleanText(r.brand) : '';
    const baseName = cleanText(r.name || '');
    const size = r.size ? cleanText(r.size) : '';
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
    const offerDesc = r.pricing.offerDescription ? cleanText(r.pricing.offerDescription) : '';
    const savings = computeSavings({ price, wasPrice: wasRaw, promoText: offerDesc });
    const isOnSale = Boolean(
      r.pricing.promotionType === 'SPECIAL' ||
        r.pricing.onlineSpecial ||
        savings.isHalfPrice ||
        (savings.saveAmount && savings.saveAmount > 0) ||
        offerDesc
    );

    let promoText = null;
    if (savings.isHalfPrice) promoText = '1/2 Price';
    else if (savings.saveAmount && savings.saveAmount > 0) {
      promoText = `Save $${savings.saveAmount.toFixed(2)}`;
    } else if (offerDesc) promoText = offerDesc;
    else if (isOnSale) promoText = 'Special';

    const imgUri = r.imageUris?.[0]?.uri;
    const slug = fullTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const inStock =
      typeof r.availability === 'boolean'
        ? r.availability
        : r.availabilityType
        ? !/OUT|UNAVAIL/i.test(String(r.availabilityType))
        : true;
    const regionTag = locationCtx?.suburb
      ? `Coles ${locationCtx.suburb}`
      : locationCtx?.state
      ? `Coles ${locationCtx.state}`
      : null;
    const stockLabel = inStock
      ? regionTag
        ? `In Stock • ${regionTag}`
        : 'In Stock'
      : 'Out of Stock';

    const colesCatHint = [
      r.merchandiseHeir?.categoryGroup,
      r.merchandiseHeir?.aisle,
      r.merchandiseHeir?.category,
      r.merchandiseHeir?.subCategory,
    ]
      .filter(Boolean)
      .join(' ');

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
      unitPrice: r.pricing.comparable ? cleanText(r.pricing.comparable) : null,
      category: classifyCategory(colesCatHint, fullTitle, 'coles'),
      imageUrl: imgUri ? `https://productimages.coles.com.au/productimages${imgUri}` : null,
      productUrl: r.id ? `https://www.coles.com.au/product/${slug}-${r.id}` : searchUrl,
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

export async function searchAldiProducts(query, limit = 12, locationCtx = {}) {
  const validLimit = limit <= 12 ? 12 : limit <= 16 ? 16 : 24;
  const qs = new URLSearchParams({
    currency: 'AUD',
    serviceType: 'walk-in',
    q: query,
    limit: String(validLimit),
    offset: '0',
    sort: 'relevance',
  });
  if (locationCtx?.aldiStoreId) {
    qs.set('servicePoint', String(locationCtx.aldiStoreId));
  }
  const res = await fetch(`https://api.aldi.com.au/v3/product-search?${qs.toString()}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`ALDI HTTP ${res.status}`);
  const json = await res.json();

  const out = [];
  for (const item of json?.data || []) {
    if (!item?.name || !item?.price) continue;
    const rawPrice =
      typeof item.price.amountRelevant === 'number'
        ? item.price.amountRelevant / 100
        : typeof item.price.amount === 'number'
        ? item.price.amount / 100
        : parseMoney(item.price.amountRelevantDisplay);
    if (rawPrice === null || rawPrice <= 0) continue;

    const brand = cleanText(item.brandName || '');
    const baseName = cleanText(item.name);
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

    let promoText = null;
    if (savings.isHalfPrice) promoText = '1/2 Price';
    else if (item.price.savingsDisplay) promoText = cleanText(item.price.savingsDisplay);
    else if (isSpecialBuy) promoText = 'Special Buy';

    const front = (item.assets || []).find((a) => a.assetType === 'FR01') || item.assets?.[0];
    const slug = item.urlSlugText || 'aldi-product';

    const aldiStoreName = locationCtx?.aldiStoreName || null;
    const inStock = !item.discontinued && !/OUT_OF_STOCK/i.test(String(item.notForSaleReason || ''));
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
      packageSize: cleanText(item.sellingSize || '') || extractPackageSize(fullTitle),
      sku: item.sku ? String(item.sku) : null,
      price: rawPrice,
      priceText: item.price.amountRelevantDisplay || `$${rawPrice.toFixed(2)}`,
      wasPrice: savings.wasPrice,
      saveAmount: savings.saveAmount,
      discountPercent: savings.discountPercent,
      isOnSale,
      isHalfPrice: savings.isHalfPrice,
      promoText,
      unitPrice: cleanText(item.price.comparisonDisplay || item.price.perUnitDisplay || '') || null,
      category: classifyCategory((item.categories || []).map((c) => c.name).join(' '), fullTitle, 'aldi'),
      imageUrl: front?.url ? String(front.url).replace('{width}', '500').replace('{slug}', `${slug}.jpg`) : null,
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

export async function searchIgaProducts(query, limit = 10, locationCtx = {}) {
  const activeStoreId = locationCtx?.igaStoreId || IGA_STORE_ID;
  const localStoreName = locationCtx?.igaStoreName || null;
  const url = `https://www.igashop.com.au/api/storefront/stores/${encodeURIComponent(activeStoreId)}/search?q=${encodeURIComponent(query)}&take=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`IGA HTTP ${res.status}`);
  const json = await res.json();

  const out = [];
  for (const item of json?.items || []) {
    const price =
      typeof item?.priceNumeric === 'number' ? item.priceNumeric : parseMoney(item?.price);
    if (price === null || price <= 0) continue;

    const brand = item.brand ? cleanText(item.brand) : '';
    const rawName = cleanText(item.name || '');
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
    const savings = computeSavings({ price, wasPrice, promoText: item.priceLabel || '' });
    const isOnSale = Boolean(
      item.priceSource === 'tpr' ||
        item.priceLabel ||
        savings.isHalfPrice ||
        (savings.saveAmount && savings.saveAmount > 0)
    );

    let promoText = null;
    if (savings.isHalfPrice) promoText = '1/2 Price';
    else if (item.priceLabel) promoText = cleanText(item.priceLabel);
    else if (savings.saveAmount && savings.saveAmount > 0) {
      promoText = `Save $${savings.saveAmount.toFixed(2)}`;
    }

    const inStock = item.available !== false;
    const stockLabel = inStock
      ? localStoreName
        ? `In Stock • ${localStoreName}`
        : 'In Stock'
      : localStoreName
      ? `Out of Stock • ${localStoreName}`
      : 'Out of Stock';

    const igaCatHint = Array.isArray(item.defaultCategory)
      ? item.defaultCategory
          .map((c) => c?.categoryBreadcrumb || '')
          .filter(Boolean)
          .join(' ')
      : '';

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
      unitPrice: item.pricePerUnit ? cleanText(item.pricePerUnit) : null,
      category: classifyCategory(igaCatHint, fullTitle, 'iga'),
      imageUrl: item.image?.default || item.image?.cell || null,
      productUrl: `https://www.igashop.com.au/search?q=${encodeURIComponent(fullTitle)}`,
      catalogueName: localStoreName || (isOnSale ? 'IGA Specials' : 'IGA Everyday Range'),
      validDates: isOnSale ? 'Current Store Offer' : 'Everyday Regular Price',
      inStock,
      stockLabel,
      localStoreName,
      fetchedAt: new Date().toISOString(),
    });
  }
  return out;
}

export async function searchAmazonAuProducts(query, limit = 8) {
  const searchUrl = `https://www.amazon.com.au/s?k=${encodeURIComponent(query)}`;
  const res = await fetch(searchUrl, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-AU,en;q=0.9' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Amazon AU HTTP ${res.status}`);
  const html = await res.text();

  const out = [];
  const parts = html.split(/(?=<div[^>]*data-component-type="s-search-result"[^>]*>)/i);
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];
    const openTag = block.slice(0, 360);
    const asinMatch = openTag.match(/data-asin="([A-Z0-9]{10})"/i);
    if (!asinMatch) continue;
    const asin = asinMatch[1];
    if (/s-sponsored-label|AdHolder/i.test(block.slice(0, 900))) continue;

    const rawTitle =
      block.match(/<h2[^>]*aria-label="([^"]+)"/i)?.[1] ||
      block.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
      '';
    const title = cleanText(rawTitle).replace(/^Sponsored Ad\s*[-–]\s*/i, '');
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
    const unitMatch = block.match(/\((\$[\d,.]+\s*\/\s*(?:\d+\s*)?[a-zA-Z]+)\)/);

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

function tokenizeMeaningful(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[®™^~*Δ]/g, '')
    .replace(PRIVATE_LABEL_BRANDS, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+(?:g|kg|ml|l|pk)?$/.test(w));
}

function parseNumericMeasure(sizeText) {
  if (!sizeText) return null;
  const m = String(sizeText).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml)\b/);
  if (!m) return null;
  const val = parseFloat(m[1]);
  return m[2] === 'kg' || m[2] === 'l' ? val * 1000 : val;
}

function pickBestCandidate(target, candidates) {
  if (!candidates?.length) return null;
  const targetTokens = tokenizeMeaningful(buildCleanSearchQuery(target));
  if (targetTokens.length === 0) return candidates[0];

  const targetMeasure = parseNumericMeasure(target.packageSize || target.title);
  let best = null;
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
    if (targetTokens.length >= 3 && matchedTokens < 2 && overlapRatio < 0.34) continue;

    let score = overlapRatio * 60 + matchedTokens * 10 - idx * 1.5;
    if (target.brand && candLower.includes(target.brand.toLowerCase())) score += 18;

    const candMeasure = parseNumericMeasure(c.packageSize || c.title);
    if (targetMeasure && candMeasure) {
      const ratio = Math.min(targetMeasure, candMeasure) / Math.max(targetMeasure, candMeasure);
      if (ratio >= 0.85) score += 22;
      else if (ratio < 0.4) score -= 12;
    }

    if (target.price && target.price < 25 && c.price > target.price * 3.5) score -= 35;
    const bulkRe = /\b(pack of [2-9]\d*|[2-9]\s*pack\s*x|\d+\s*x\s*\d+\s*(?:g|kg|ml|l)|carton|case of|bulk)\b/i;
    if (bulkRe.test(c.title) && !bulkRe.test(target.title || '')) {
      score -= 32;
    }

    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function fallbackSearchUrl(store, query) {
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
    default:
      return `https://www.google.com.au/search?q=${enc}`;
  }
}

const COMPETITORS = [
  { store: 'woolworths', storeName: 'Woolworths', fetcher: searchWoolworthsProducts },
  { store: 'coles', storeName: 'Coles', fetcher: searchColesProducts },
  { store: 'aldi', storeName: 'ALDI', fetcher: searchAldiProducts },
  { store: 'iga', storeName: 'IGA', fetcher: searchIgaProducts },
  { store: 'amazon', storeName: 'Amazon AU', fetcher: searchAmazonAuProducts },
];

export async function compareItemAcrossCompetitors(targetItem, locationCtx = {}) {
  const queryUsed = buildCleanSearchQuery(targetItem);

  const settled = await Promise.allSettled(
    COMPETITORS.map(async (comp) => {
      const isOwnStore = Boolean(comp.store === targetItem.store && targetItem.price);
      const needsLiveLocalStock =
        isOwnStore &&
        (targetItem.inStock === undefined ||
          targetItem.inStock === null ||
          (comp.store === 'iga' &&
            locationCtx?.igaStoreName &&
            targetItem.localStoreName !== locationCtx.igaStoreName) ||
          (comp.store === 'woolworths' &&
            locationCtx?.wwStoreName &&
            targetItem.localStoreName !== locationCtx.wwStoreName) ||
          (comp.store === 'aldi' &&
            locationCtx?.aldiStoreName &&
            targetItem.localStoreName !== locationCtx.aldiStoreName));

      if (isOwnStore && !needsLiveLocalStock) {
        return {
          store: comp.store,
          storeName: comp.storeName,
          matched: true,
          title: targetItem.title,
          packageSize: targetItem.packageSize || null,
          price: Number(targetItem.price),
          priceText: targetItem.priceText || `$${Number(targetItem.price).toFixed(2)}`,
          wasPrice: targetItem.wasPrice ? Number(targetItem.wasPrice) : null,
          saveAmount: targetItem.saveAmount ? Number(targetItem.saveAmount) : null,
          isOnSale: Boolean(targetItem.isOnSale),
          isHalfPrice: Boolean(targetItem.isHalfPrice),
          promoText: targetItem.promoText || null,
          unitPrice: targetItem.unitPrice || null,
          imageUrl: targetItem.imageUrl || null,
          productUrl: targetItem.productUrl || fallbackSearchUrl(comp.store, queryUsed),
          inStock: targetItem.inStock ?? true,
          stockLabel: targetItem.stockLabel || 'In Stock',
          localStoreName: targetItem.localStoreName || null,
          isCurrentItem: true,
        };
      }

      let candidates = [];
      try {
        candidates = await comp.fetcher(queryUsed, 8, locationCtx);
      } catch {
        candidates = [];
      }
      let best = pickBestCandidate(targetItem, candidates);
      if (!best) {
        const shortQ = buildConciseFallbackQuery(queryUsed, targetItem.packageSize);
        if (shortQ) {
          try {
            candidates = await comp.fetcher(shortQ, 8, locationCtx);
            best = pickBestCandidate(targetItem, candidates);
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
          title: targetItem.title,
          packageSize: targetItem.packageSize || best?.packageSize || null,
          price:
            comp.store === 'iga' && best?.price ? best.price : Number(targetItem.price),
          priceText:
            comp.store === 'iga' && best?.priceText
              ? best.priceText
              : targetItem.priceText || `$${Number(targetItem.price).toFixed(2)}`,
          wasPrice: targetItem.wasPrice ? Number(targetItem.wasPrice) : best?.wasPrice ?? null,
          saveAmount: targetItem.saveAmount
            ? Number(targetItem.saveAmount)
            : best?.saveAmount ?? null,
          isOnSale: Boolean(targetItem.isOnSale ?? best?.isOnSale),
          isHalfPrice: Boolean(targetItem.isHalfPrice ?? best?.isHalfPrice),
          promoText: targetItem.promoText || best?.promoText || null,
          unitPrice: targetItem.unitPrice || best?.unitPrice || null,
          imageUrl: targetItem.imageUrl || best?.imageUrl || null,
          productUrl:
            best?.productUrl ||
            targetItem.productUrl ||
            fallbackSearchUrl(comp.store, queryUsed),
          inStock: best ? best.inStock : targetItem.inStock ?? null,
          stockLabel:
            best?.stockLabel || targetItem.stockLabel || 'Check Local Store Stock',
          localStoreName: best?.localStoreName || targetItem.localStoreName || null,
          isCurrentItem: true,
        };
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
        };
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
      };
    })
  );

  const quotes = settled.map((res, idx) => {
    if (res.status === 'fulfilled') return res.value;
    const comp = COMPETITORS[idx];
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

  quotes.sort((a, b) => {
    if (a.matched !== b.matched) return a.matched ? -1 : 1;
    if (a.price !== null && b.price !== null) return a.price - b.price;
    return 0;
  });

  return { queryUsed, quotes };
}
