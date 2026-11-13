import * as cheerio from 'cheerio';
import {
  classifyCategory,
  computeSavings,
  cleanText,
  extractSaleFinderUrlHint,
} from '../normalize.js';

const SALEFINDER_BASE = 'https://www.salefinder.com.au';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const RETAILER_CONFIG = {
  woolworths: {
    store: 'woolworths',
    storeName: 'Woolworths',
    hubSlug: 'Woolworths-catalogue',
    excludeCataloguePattern: /\b(bws|dan\s*murphy|big\s*w|everyday\s*market)\b/i,
    preferCataloguePattern: /\b(weekly|catalogue|specials)\b/i,
  },
  coles: {
    store: 'coles',
    storeName: 'Coles',
    hubSlug: 'Coles-catalogue',
    excludeCataloguePattern: /\b(liquorland|first\s*choice|vintage\s*cellars)\b/i,
    preferCataloguePattern: /\b(coles\s*catalogue|weekly|specials)\b/i,
  },
};

async function fetchHtml(url, retries = 1) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(16000),
      });
      if (!res.ok) {
        throw new Error(`SaleFinder HTTP ${res.status} for ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }
  throw lastErr;
}

/**
 * Extract package size from product title if present (e.g., "1.25 Litre", "400-700ml Pk 8-14", "500g").
 */
function extractPackageSize(title) {
  const m = title.match(
    /\b(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:kg|g|ml|l|litre|litres|pk|pack)(?:\s*pk\s*\d+(?:-\d+)?)?)\b/i
  );
  return m ? m[1].trim() : null;
}

/**
 * Parse category hint from SaleFinder item URL path:
 * e.g. "/68850/food-and-beverage/groceries/frozen-food/bulla-.../688501003/"
 */
function extractUrlCategoryHint(href = '') {
  return extractSaleFinderUrlHint(href);
}

/**
 * Discover active supermarket catalogues from SaleFinder's retailer hub page.
 */
export async function discoverRetailerCatalogues(storeKey) {
  const config = RETAILER_CONFIG[storeKey];
  if (!config) throw new Error(`Unknown store key: ${storeKey}`);

  const html = await fetchHtml(`${SALEFINDER_BASE}/${config.hubSlug}`);
  const $ = cheerio.load(html);

  const catalogues = [];
  $('.retailer-catalogue').each((_, el) => {
    const $el = $(el);
    const rawHref = $el.find('a.catalogue-image, a[href*="catalogue2"]').first().attr('href') || '';
    const name = cleanText($el.find('.catalogue-name').text()) || `${config.storeName} Weekly Catalogue`;
    const validDates = cleanText($el.find('.catalogue-date').text()) || 'Current Weekly Specials';
    const coverImage = $el.find('img').first().attr('src') || null;

    if (!rawHref) return;
    if (config.excludeCataloguePattern.test(`${name} ${rawHref}`)) return;

    const saleIdMatch = rawHref.match(/\/(\d{4,7})\/catalogue2/i) || rawHref.match(/\/(\d{4,7})(?:\/|$)/);
    if (!saleIdMatch) return;

    const saleId = saleIdMatch[1];
    const listPath = rawHref.replace(/\/catalogue2.*$/i, '/list');

    catalogues.push({
      saleId,
      name,
      validDates: validDates.replace(/^Offer valid\s*/i, ''),
      coverImage,
      listUrl: listPath.startsWith('http') ? listPath : `${SALEFINDER_BASE}${listPath}`,
      priority: config.preferCataloguePattern.test(name) ? 1 : 2,
    });
  });

  // Fallback: scan any catalogue2 anchors if DOM class changes
  if (catalogues.length === 0) {
    $('a[href*="/catalogue2"]').each((_, el) => {
      const rawHref = $(el).attr('href') || '';
      if (config.excludeCataloguePattern.test(rawHref)) return;
      const m = rawHref.match(/\/(\d{4,7})\/catalogue2/i);
      if (m) {
        catalogues.push({
          saleId: m[1],
          name: `${config.storeName} Weekly Catalogue`,
          validDates: 'Current Weekly Specials',
          coverImage: null,
          listUrl: `${SALEFINDER_BASE}${rawHref.replace(/\/catalogue2.*$/i, '/list')}`,
          priority: 1,
        });
      }
    });
  }

  // Deduplicate by saleId and sort primary weekly catalogue first
  const byId = new Map();
  for (const c of catalogues) {
    if (!byId.has(c.saleId)) byId.set(c.saleId, c);
  }
  return Array.from(byId.values()).sort((a, b) => a.priority - b.priority);
}

/**
 * Parse all product tiles on a SaleFinder `/list` HTML page.
 */
function parseSaleFinderListPage(html, { store, storeName, catalogue }) {
  const $ = cheerio.load(html);
  const items = [];

  $('a.item-image').each((_, imgAnchor) => {
    const $imgAnchor = $(imgAnchor);
    const $card = $imgAnchor.parent();

    const itemId =
      $imgAnchor.attr('data-itemid') ||
      $card.find('[data-itemid]').first().attr('data-itemid');

    const fullTitle = cleanText(
      $imgAnchor.attr('data-itemname') ||
        $card.find('a.more-info-button').attr('data-itemname') ||
        $card.find('a.item-name').text()
    );

    if (!fullTitle) return;

    const itemHref = $imgAnchor.attr('href') || $card.find('a.item-name').attr('href') || '';
    const imageUrl = $imgAnchor.find('img').attr('src') || null;
    const unitPrice = cleanText($card.find('.comparative-text').text()) || null;

    const $priceOptions = $card.find('.price-options');
    const primaryPriceSpan = cleanText($priceOptions.find('.price').first().text());
    const fullPriceOptionsText = cleanText($priceOptions.text());

    // Remove primaryPriceSpan and unitPrice from fullPriceOptionsText to isolate the promo/savings text!
    let promoRaw = fullPriceOptionsText;
    if (primaryPriceSpan) promoRaw = promoRaw.replace(primaryPriceSpan, '');
    if (unitPrice) promoRaw = promoRaw.replace(unitPrice, '');
    promoRaw = cleanText(promoRaw);

    const savings = computeSavings({
      price: primaryPriceSpan || fullPriceOptionsText,
      promoText: promoRaw,
    });

    if (savings.price === null) return;

    // Determine crisp promo badge label
    let promoText = promoRaw || null;
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

    const urlHint = extractUrlCategoryHint(itemHref);
    const category = classifyCategory(urlHint, fullTitle, store);

    const productUrl = itemHref
      ? itemHref.startsWith('http')
        ? itemHref
        : `${SALEFINDER_BASE}${itemHref}`
      : catalogue.listUrl;

    items.push({
      id: `${store}-${itemId || Buffer.from(fullTitle).toString('base64url').slice(0, 14)}`,
      store,
      storeName,
      title: fullTitle,
      brand: null,
      packageSize: extractPackageSize(fullTitle),
      price: savings.price,
      priceText: primaryPriceSpan || `$${savings.price.toFixed(2)}`,
      wasPrice: savings.wasPrice,
      saveAmount: savings.saveAmount,
      discountPercent: savings.discountPercent,
      isOnSale: true,
      isHalfPrice: savings.isHalfPrice,
      promoText,
      unitPrice,
      category,
      imageUrl: imageUrl ? imageUrl.replace(/^\/\//, 'https://') : null,
      productUrl,
      catalogueName: catalogue.name,
      validDates: catalogue.validDates,
      fetchedAt: new Date().toISOString(),
    });
  });

  // Check highest page number available in pagination links
  let maxPage = 1;
  $('a[href*="?qs="]').each((_, a) => {
    const h = $(a).attr('href') || '';
    const m = h.match(/\?qs=(\d+),/);
    if (m) {
      const p = parseInt(m[1], 10);
      if (Number.isFinite(p) && p > maxPage) maxPage = p;
    }
  });

  return { items, maxPage };
}

/**
 * Download weekly specials for Woolworths or Coles across multiple catalogue pages.
 */
export async function fetchSaleFinderStoreSpecials(
  storeKey,
  { maxPages = 10, state = '' } = {}
) {
  const config = RETAILER_CONFIG[storeKey];
  const catalogues = await discoverRetailerCatalogues(storeKey);
  if (catalogues.length === 0) {
    return { items: [], catalogue: null };
  }

  // Prefer catalogue matching user's state (e.g. NSW, VIC, QLD, WA, SA, TAS) when available
  const stateRe = state ? new RegExp(`\\b${String(state).trim()}\\b`, 'i') : null;
  const primaryCatalogue =
    (stateRe && catalogues.find((c) => stateRe.test(c.name))) || catalogues[0];
  const seen = new Map();

  // Fetch page 1 first to discover total pages
  const page1Html = await fetchHtml(`${primaryCatalogue.listUrl}?qs=1,,,,`);
  const page1Result = parseSaleFinderListPage(page1Html, {
    store: config.store,
    storeName: config.storeName,
    catalogue: primaryCatalogue,
  });

  for (const item of page1Result.items) {
    seen.set(item.id, item);
  }

  const pagesToFetch = Math.min(maxPages, Math.max(page1Result.maxPage, 1));
  if (pagesToFetch > 1) {
    const pageNumbers = [];
    for (let p = 2; p <= pagesToFetch; p++) {
      pageNumbers.push(p);
    }

    // Fetch in gentle batches of 4 concurrent requests
    const batchSize = 4;
    for (let i = 0; i < pageNumbers.length; i += batchSize) {
      const batch = pageNumbers.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (pageNum) => {
          const html = await fetchHtml(`${primaryCatalogue.listUrl}?qs=${pageNum},,,,`);
          return parseSaleFinderListPage(html, {
            store: config.store,
            storeName: config.storeName,
            catalogue: primaryCatalogue,
          });
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const item of r.value.items) {
            if (!seen.has(item.id)) {
              seen.set(item.id, item);
            }
          }
        }
      }
    }
  }

  return {
    items: Array.from(seen.values()),
    catalogue: primaryCatalogue,
  };
}
