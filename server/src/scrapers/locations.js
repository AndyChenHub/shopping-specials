import { cleanText } from '../normalize.js';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let cachedIgaStores = null;
let cachedIgaFetchedAt = 0;

let cachedAldiStores = null;
let cachedAldiFetchedAt = 0;

const STORE_DIRECTORY_TTL_MS = 12 * 60 * 60 * 1000;

function haversineKm(lat1, lon1, lat2, lon2) {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(a));
  return Math.round(km * 10) / 10;
}

export function inferStateFromPostcode(postcode = '') {
  const n = parseInt(String(postcode).trim(), 10);
  if (!Number.isFinite(n)) return 'NSW';
  if ((n >= 2600 && n <= 2618) || (n >= 2900 && n <= 2920)) return 'ACT';
  if (n >= 1000 && n <= 2999) return 'NSW';
  if ((n >= 3000 && n <= 3999) || (n >= 8000 && n <= 8999)) return 'VIC';
  if ((n >= 4000 && n <= 4999) || (n >= 9000 && n <= 9999)) return 'QLD';
  if (n >= 5000 && n <= 5999) return 'SA';
  if (n >= 6000 && n <= 6999) return 'WA';
  if (n >= 7000 && n <= 7999) return 'TAS';
  if (n >= 800 && n <= 999) return 'NT';
  return 'NSW';
}

export async function searchSuburbs(query) {
  const q = String(query || '').trim();
  if (!q) return [];

  const url = `https://www.woolworths.com.au/apis/ui/StoreLocator/Suburbs?SearchTerm=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Suburb lookup HTTP ${res.status}`);
  const json = await res.json();
  const list = Array.isArray(json?.Suburbs) ? json.Suburbs : Array.isArray(json) ? json : [];

  const out = [];
  const seen = new Set();
  for (const s of list) {
    const postcode = String(s?.PostCode || '').trim();
    const suburb = cleanText(s?.SuburbName || '');
    const state = cleanText(s?.State || '') || inferStateFromPostcode(postcode);
    const latitude = Number(s?.Latitude);
    const longitude = Number(s?.Longitude);
    if (!postcode || !suburb || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }
    const key = `${suburb.toLowerCase()}-${state}-${postcode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      postcode,
      suburb,
      state,
      latitude,
      longitude,
      display: `${suburb}, ${state} ${postcode}`,
    });
    if (out.length >= 12) break;
  }
  return out;
}

async function fetchWoolworthsNearbyStores({ postcode, latitude, longitude }, max = 8) {
  const params = new URLSearchParams({
    Max: String(max),
    Division: 'SUPERMARKETS',
  });
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    params.set('Latitude', String(latitude));
    params.set('Longitude', String(longitude));
  } else if (postcode) {
    params.set('Postcode', String(postcode));
  } else {
    return [];
  }

  const url = `https://www.woolworths.com.au/apis/ui/StoreLocator/Stores?${params.toString()}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) return [];
  const json = await res.json();

  const stores = [];
  for (const s of json?.Stores || []) {
    if (!s?.StoreNo || !s?.Name) continue;
    const dist = Number(s.Distance);
    const todayHours =
      (s.TradingHours || []).find((t) => t.Day === 'Today')?.OpenHour ||
      s.TradingHours?.[0]?.OpenHour ||
      null;
    const addrParts = [s.AddressLine1, s.Suburb, s.State, s.Postcode]
      .map((x) => cleanText(x || ''))
      .filter(Boolean);

    stores.push({
      store: 'woolworths',
      storeId: String(s.StoreNo),
      name: `Woolworths ${cleanText(s.Name)}`,
      address: addrParts.join(', '),
      suburb: cleanText(s.Suburb || ''),
      state: cleanText(s.State || ''),
      postcode: String(s.Postcode || ''),
      latitude: Number(s.Latitude),
      longitude: Number(s.Longitude),
      distanceKm: Number.isFinite(dist)
        ? Math.round(dist * 10) / 10
        : haversineKm(latitude, longitude, Number(s.Latitude), Number(s.Longitude)),
      isOpen: typeof s.IsOpen === 'boolean' ? s.IsOpen : null,
      tradingHours: todayHours ? cleanText(todayHours) : null,
    });
  }
  return stores;
}

async function getAllIgaStores() {
  if (cachedIgaStores && Date.now() - cachedIgaFetchedAt < STORE_DIRECTORY_TTL_MS) {
    return cachedIgaStores;
  }
  const res = await fetch('https://www.igashop.com.au/api/storefront/stores', {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`IGA stores HTTP ${res.status}`);
  const json = await res.json();
  const list = [];
  for (const s of json?.items || []) {
    if (!s?.retailerStoreId || s?.status !== 'Active') continue;
    const lat = Number(s.location?.latitude);
    const lon = Number(s.location?.longitude);
    const suburb = cleanText(s.city || '');
    const state = cleanText(s.countyProvinceState || '');
    const postcode = String(s.postCode || '').trim();
    const addr = [cleanText(s.addressLine1 || ''), suburb, state, postcode]
      .filter(Boolean)
      .join(', ');
    list.push({
      store: 'iga',
      storeId: String(s.retailerStoreId),
      name: cleanText(s.name || `IGA ${suburb}`),
      address: addr,
      suburb,
      state,
      postcode,
      latitude: lat,
      longitude: lon,
      isOpen: null,
      tradingHours: s.openingHours ? cleanText(s.openingHours) : null,
    });
  }
  cachedIgaStores = list;
  cachedIgaFetchedAt = Date.now();
  return list;
}

async function getAllAldiStores() {
  if (cachedAldiStores && Date.now() - cachedAldiFetchedAt < STORE_DIRECTORY_TTL_MS) {
    return cachedAldiStores;
  }
  const offsets = [0, 100, 200, 300, 400, 500, 600];
  const pages = await Promise.allSettled(
    offsets.map(async (offset) => {
      const res = await fetch(
        `https://api.aldi.com.au/v2/service-points?limit=100&offset=${offset}`,
        {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
          signal: AbortSignal.timeout(9000),
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    })
  );

  const list = [];
  const seen = new Set();
  for (const p of pages) {
    if (p.status !== 'fulfilled') continue;
    for (const sp of p.value) {
      if (!sp?.id || sp.id === '000-000' || seen.has(sp.id)) continue;
      seen.add(sp.id);
      const addr = sp.address || {};
      const suburb = cleanText(addr.city || addr.district || '');
      const state = cleanText(addr.regionIsoCode || '');
      const postcode = String(addr.zipCode || '').trim();
      const lat = Number(addr.latitude);
      const lon = Number(addr.longitude);
      if (!suburb && !postcode) continue;

      const street = cleanText(addr.address1 || sp.name || '');
      list.push({
        store: 'aldi',
        storeId: String(sp.id),
        name: suburb ? `ALDI ${suburb}` : `ALDI ${street}`,
        address: [street, suburb, state, postcode].filter(Boolean).join(', '),
        suburb,
        state,
        postcode,
        latitude: lat,
        longitude: lon,
        isOpen: typeof sp.isOpenNow === 'boolean' ? sp.isOpenNow : null,
        tradingHours: null,
      });
    }
  }
  if (list.length > 0) {
    cachedAldiStores = list;
    cachedAldiFetchedAt = Date.now();
  }
  return list;
}

function rankStoresByLocation(allStores, { latitude, longitude, postcode, suburb }, max = 8) {
  const scored = allStores.map((s) => {
    const distanceKm = haversineKm(latitude, longitude, s.latitude, s.longitude);
    let fallbackScore = 9999;
    if (distanceKm !== null) {
      fallbackScore = distanceKm;
    } else if (postcode && s.postcode === postcode) {
      fallbackScore = 1;
    } else if (suburb && s.suburb.toLowerCase() === suburb.toLowerCase()) {
      fallbackScore = 2;
    }
    return {
      store: s.store,
      storeId: s.storeId,
      name: s.name,
      address: s.address,
      suburb: s.suburb,
      state: s.state,
      postcode: s.postcode,
      distanceKm,
      isOpen: s.isOpen,
      tradingHours: s.tradingHours,
      _rank: fallbackScore,
    };
  });

  scored.sort((a, b) => a._rank - b._rank);
  return scored
    .filter((s) => s.distanceKm === null || s.distanceKm <= 80 || scored.indexOf(s) < 3)
    .slice(0, max)
    .map(({ _rank, ...rest }) => rest);
}

export async function findNearbyStores({
  query = '',
  postcode = '',
  suburb = '',
  state = '',
  latitude = null,
  longitude = null,
} = {}) {
  let loc = {
    postcode: String(postcode || '').trim(),
    suburb: cleanText(suburb || ''),
    state: cleanText(state || ''),
    latitude: latitude !== null && latitude !== '' ? Number(latitude) : NaN,
    longitude: longitude !== null && longitude !== '' ? Number(longitude) : NaN,
    display: '',
  };

  // Resolve coordinates from suburb/postcode query if needed
  if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) {
    const searchKey = query || loc.postcode || loc.suburb;
    if (searchKey) {
      const matches = await searchSuburbs(searchKey);
      if (matches.length > 0) {
        const exact =
          matches.find(
            (m) =>
              (loc.postcode && m.postcode === loc.postcode) &&
              (!loc.suburb || m.suburb.toLowerCase() === loc.suburb.toLowerCase())
          ) || matches[0];
        loc = { ...exact };
      }
    }
  }

  const [wwRes, igaRes, aldiRes] = await Promise.allSettled([
    fetchWoolworthsNearbyStores(loc, 8),
    getAllIgaStores(),
    getAllAldiStores(),
  ]);

  const wwStoresRaw = wwRes.status === 'fulfilled' ? wwRes.value : [];

  // If GPS coordinates were supplied without suburb/postcode, infer suburb/postcode from closest Woolworths store
  if ((!loc.suburb || !loc.postcode) && wwStoresRaw.length > 0) {
    const nearest = wwStoresRaw[0];
    loc.suburb = loc.suburb || nearest.suburb;
    loc.postcode = loc.postcode || nearest.postcode;
    loc.state = loc.state || nearest.state || inferStateFromPostcode(loc.postcode);
    if (!Number.isFinite(loc.latitude)) loc.latitude = nearest.latitude;
    if (!Number.isFinite(loc.longitude)) loc.longitude = nearest.longitude;
  }

  if (!loc.state) {
    loc.state = inferStateFromPostcode(loc.postcode);
  }
  loc.display = [loc.suburb, `${loc.state} ${loc.postcode}`.trim()]
    .filter(Boolean)
    .join(', ');

  const woolworths = wwStoresRaw.map(({ latitude: _lat, longitude: _lon, ...rest }) => rest);
  const iga =
    igaRes.status === 'fulfilled' ? rankStoresByLocation(igaRes.value, loc, 8) : [];
  const aldi =
    aldiRes.status === 'fulfilled' ? rankStoresByLocation(aldiRes.value, loc, 8) : [];

  return {
    location: loc,
    stores: {
      woolworths,
      iga,
      aldi,
    },
  };
}
