import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LocationSearchContext,
  NearbyStoreOption,
  NearbyStoresResponse,
  SuburbSuggestion,
  UserStoreLocation,
} from '../types/specials';
import { getApiBaseUrl, getCustomApiBaseUrlRaw, getLanMetroHost } from './api';
import { decodeHtmlEntities } from './normalizeClient';
import { syncUnifiedBackupSnapshot } from './savedStorage';

const USER_LOCATION_STORAGE_KEY = '@aussie_specials_user_location_v1';
const UNIFIED_BACKUP_KEY = '@aussie_specials_backup_snapshot_v1';

const REQUEST_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-AU,en;q=0.9',
};

let memoryUserLocation: UserStoreLocation | null | undefined = undefined;

let cachedIgaDirectory: Array<NearbyStoreOption & { latitude: number; longitude: number }> | null =
  null;
let cachedAldiDirectory: Array<NearbyStoreOption & { latitude: number; longitude: number }> | null =
  null;

export async function loadSavedUserLocation(
  forceReload = false
): Promise<UserStoreLocation | null> {
  if (!forceReload && memoryUserLocation !== undefined) {
    return memoryUserLocation;
  }
  try {
    const raw = await AsyncStorage.getItem(USER_LOCATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserStoreLocation;
      if (parsed && (parsed.postcode || parsed.suburb)) {
        memoryUserLocation = parsed;
        return parsed;
      }
    }

    // Self-heal from unified backup snapshot if primary key was missing
    const backupRaw = await AsyncStorage.getItem(UNIFIED_BACKUP_KEY);
    if (backupRaw) {
      const backup = JSON.parse(backupRaw) as {
        userLocation?: UserStoreLocation | null;
      };
      if (
        backup?.userLocation &&
        (backup.userLocation.postcode || backup.userLocation.suburb)
      ) {
        await AsyncStorage.setItem(
          USER_LOCATION_STORAGE_KEY,
          JSON.stringify(backup.userLocation)
        );
        memoryUserLocation = backup.userLocation;
        return backup.userLocation;
      }
    }
  } catch {
    // ignore corrupt storage
  }
  memoryUserLocation = null;
  return null;
}

export function getCachedUserLocationSync(): UserStoreLocation | null {
  return memoryUserLocation || null;
}

export async function saveUserLocation(
  loc: UserStoreLocation | null
): Promise<void> {
  memoryUserLocation = loc;
  try {
    if (loc) {
      await AsyncStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(loc));
    } else {
      await AsyncStorage.removeItem(USER_LOCATION_STORAGE_KEY);
    }
    await syncUnifiedBackupSnapshot({ userLocation: loc });
  } catch {
    // ignore storage errors
  }
}

export function toLocationSearchContext(
  loc: UserStoreLocation | null | undefined
): LocationSearchContext {
  if (!loc) return {};
  return {
    postcode: loc.postcode || undefined,
    suburb: loc.suburb || undefined,
    state: loc.state || undefined,
    wwStoreId: loc.woolworthsStore?.storeId || undefined,
    wwStoreName: loc.woolworthsStore?.name || undefined,
    igaStoreId: loc.igaStore?.storeId || undefined,
    igaStoreName: loc.igaStore?.name || undefined,
    aldiStoreId: loc.aldiStore?.storeId || undefined,
    aldiStoreName: loc.aldiStore?.name || undefined,
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 9000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: REQUEST_HEADERS,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function shouldUseServerFirst(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const custom = await getCustomApiBaseUrlRaw();
  if (custom) return true;
  return Boolean(getLanMetroHost());
}

export function inferStateFromPostcode(postcode = ''): string {
  const n = parseInt(postcode.trim(), 10);
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

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number | null {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
}

export async function lookupSuburbs(query: string): Promise<SuburbSuggestion[]> {
  const q = query.trim();
  if (!q) return [];

  if (await shouldUseServerFirst()) {
    try {
      const baseUrl = await getApiBaseUrl();
      const res = await fetchWithTimeout(
        `${baseUrl}/api/locations/suburbs?q=${encodeURIComponent(q)}`,
        Platform.OS === 'web' ? 10000 : 3500
      );
      if (res.ok) {
        const json = (await res.json()) as { suburbs?: SuburbSuggestion[] };
        return json.suburbs || [];
      }
    } catch (err) {
      if (Platform.OS === 'web') {
        throw err instanceof Error ? err : new Error('Failed to look up suburbs');
      }
    }
  }

  // On-device direct lookup via Woolworths public Suburbs API
  const res = await fetchWithTimeout(
    `https://www.woolworths.com.au/apis/ui/StoreLocator/Suburbs?SearchTerm=${encodeURIComponent(
      q
    )}`,
    8500
  );
  if (!res.ok) return [];
  const json = await res.json();
  const rawList = Array.isArray(json?.Suburbs)
    ? json.Suburbs
    : Array.isArray(json)
    ? json
    : [];

  const out: SuburbSuggestion[] = [];
  const seen = new Set<string>();
  for (const s of rawList) {
    const postcode = String(s?.PostCode || '').trim();
    const suburb = decodeHtmlEntities(String(s?.SuburbName || ''));
    const state =
      decodeHtmlEntities(String(s?.State || '')) ||
      inferStateFromPostcode(postcode);
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

async function loadIgaDirectoryOnDevice() {
  if (cachedIgaDirectory) return cachedIgaDirectory;
  const res = await fetchWithTimeout(
    'https://www.igashop.com.au/api/storefront/stores',
    10000
  );
  if (!res.ok) return [];
  const json = await res.json();
  const list: Array<NearbyStoreOption & { latitude: number; longitude: number }> = [];
  for (const s of json?.items || []) {
    if (!s?.retailerStoreId || s?.status !== 'Active') continue;
    const suburb = decodeHtmlEntities(String(s.city || ''));
    const state = decodeHtmlEntities(String(s.countyProvinceState || ''));
    const postcode = String(s.postCode || '').trim();
    const street = decodeHtmlEntities(String(s.addressLine1 || ''));
    list.push({
      store: 'iga',
      storeId: String(s.retailerStoreId),
      name: decodeHtmlEntities(String(s.name || `IGA ${suburb}`)),
      address: [street, suburb, state, postcode].filter(Boolean).join(', '),
      suburb,
      state,
      postcode,
      distanceKm: null,
      isOpen: null,
      tradingHours: s.openingHours ? decodeHtmlEntities(String(s.openingHours)) : null,
      latitude: Number(s.location?.latitude),
      longitude: Number(s.location?.longitude),
    });
  }
  if (list.length > 0) cachedIgaDirectory = list;
  return list;
}

async function loadAldiDirectoryOnDevice() {
  if (cachedAldiDirectory) return cachedAldiDirectory;
  const offsets = [0, 100, 200, 300, 400, 500, 600];
  const pages = await Promise.allSettled(
    offsets.map(async (offset) => {
      const res = await fetchWithTimeout(
        `https://api.aldi.com.au/v2/service-points?limit=100&offset=${offset}`,
        9000
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    })
  );

  const list: Array<NearbyStoreOption & { latitude: number; longitude: number }> = [];
  const seen = new Set<string>();
  for (const p of pages) {
    if (p.status !== 'fulfilled') continue;
    for (const sp of p.value) {
      if (!sp?.id || sp.id === '000-000' || seen.has(sp.id)) continue;
      seen.add(sp.id);
      const addr = sp.address || {};
      const suburb = decodeHtmlEntities(String(addr.city || addr.district || ''));
      const state = decodeHtmlEntities(String(addr.regionIsoCode || ''));
      const postcode = String(addr.zipCode || '').trim();
      if (!suburb && !postcode) continue;
      const street = decodeHtmlEntities(String(addr.address1 || sp.name || ''));
      list.push({
        store: 'aldi',
        storeId: String(sp.id),
        name: suburb ? `ALDI ${suburb}` : `ALDI ${street}`,
        address: [street, suburb, state, postcode].filter(Boolean).join(', '),
        suburb,
        state,
        postcode,
        distanceKm: null,
        isOpen: typeof sp.isOpenNow === 'boolean' ? sp.isOpenNow : null,
        tradingHours: null,
        latitude: Number(addr.latitude),
        longitude: Number(addr.longitude),
      });
    }
  }
  if (list.length > 0) cachedAldiDirectory = list;
  return list;
}

export async function lookupNearbyStores(params: {
  query?: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<NearbyStoresResponse> {
  if (await shouldUseServerFirst()) {
    try {
      const baseUrl = await getApiBaseUrl();
      const qs = new URLSearchParams();
      if (params.query) qs.set('q', params.query);
      if (params.postcode) qs.set('postcode', params.postcode);
      if (params.suburb) qs.set('suburb', params.suburb);
      if (params.state) qs.set('state', params.state);
      if (typeof params.latitude === 'number' && Number.isFinite(params.latitude)) {
        qs.set('lat', String(params.latitude));
      }
      if (typeof params.longitude === 'number' && Number.isFinite(params.longitude)) {
        qs.set('lon', String(params.longitude));
      }

      const res = await fetchWithTimeout(
        `${baseUrl}/api/locations/stores?${qs.toString()}`,
        Platform.OS === 'web' ? 15000 : 4500
      );
      if (res.ok) {
        return (await res.json()) as NearbyStoresResponse;
      }
    } catch (err) {
      if (Platform.OS === 'web') {
        throw err instanceof Error ? err : new Error('Failed to find nearby stores');
      }
    }
  }

  // Standalone On-Device Store Lookup
  let loc: SuburbSuggestion = {
    postcode: (params.postcode || '').trim(),
    suburb: (params.suburb || '').trim(),
    state: (params.state || '').trim(),
    latitude:
      typeof params.latitude === 'number' && Number.isFinite(params.latitude)
        ? params.latitude
        : NaN,
    longitude:
      typeof params.longitude === 'number' && Number.isFinite(params.longitude)
        ? params.longitude
        : NaN,
    display: '',
  };

  if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) {
    const key = params.query || loc.postcode || loc.suburb;
    if (key) {
      const subs = await lookupSuburbs(key);
      if (subs.length > 0) {
        loc = { ...subs[0] };
      }
    }
  }

  const wwParams = new URLSearchParams({ Max: '8', Division: 'SUPERMARKETS' });
  if (Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) {
    wwParams.set('Latitude', String(loc.latitude));
    wwParams.set('Longitude', String(loc.longitude));
  } else if (loc.postcode) {
    wwParams.set('Postcode', loc.postcode);
  }

  const [wwRes, igaDir, aldiDir] = await Promise.all([
    fetchWithTimeout(
      `https://www.woolworths.com.au/apis/ui/StoreLocator/Stores?${wwParams.toString()}`,
      9000
    )
      .then((r) => (r.ok ? r.json() : { Stores: [] }))
      .catch(() => ({ Stores: [] })),
    loadIgaDirectoryOnDevice().catch(() => []),
    loadAldiDirectoryOnDevice().catch(() => []),
  ]);

  const woolworths: NearbyStoreOption[] = [];
  for (const s of wwRes?.Stores || []) {
    if (!s?.StoreNo || !s?.Name) continue;
    if (!loc.suburb && s.Suburb) loc.suburb = decodeHtmlEntities(String(s.Suburb));
    if (!loc.postcode && s.Postcode) loc.postcode = String(s.Postcode);
    if (!loc.state && s.State) loc.state = String(s.State);
    if (!Number.isFinite(loc.latitude) && s.Latitude) loc.latitude = Number(s.Latitude);
    if (!Number.isFinite(loc.longitude) && s.Longitude) {
      loc.longitude = Number(s.Longitude);
    }

    const dist = Number(s.Distance);
    const todayHours =
      (s.TradingHours || []).find((t: { Day?: string }) => t.Day === 'Today')
        ?.OpenHour || null;
    woolworths.push({
      store: 'woolworths',
      storeId: String(s.StoreNo),
      name: `Woolworths ${decodeHtmlEntities(String(s.Name))}`,
      address: [s.AddressLine1, s.Suburb, s.State, s.Postcode]
        .filter(Boolean)
        .join(', '),
      suburb: decodeHtmlEntities(String(s.Suburb || '')),
      state: String(s.State || ''),
      postcode: String(s.Postcode || ''),
      distanceKm: Number.isFinite(dist) ? Math.round(dist * 10) / 10 : null,
      isOpen: typeof s.IsOpen === 'boolean' ? s.IsOpen : null,
      tradingHours: todayHours ? String(todayHours) : null,
    });
  }

  if (!loc.state) loc.state = inferStateFromPostcode(loc.postcode);
  loc.display = [loc.suburb, `${loc.state} ${loc.postcode}`.trim()]
    .filter(Boolean)
    .join(', ');

  const rankDir = (
    dir: Array<NearbyStoreOption & { latitude: number; longitude: number }>
  ): NearbyStoreOption[] => {
    return dir
      .map((s) => {
        const d = haversineKm(loc.latitude, loc.longitude, s.latitude, s.longitude);
        const rank =
          d !== null
            ? d
            : loc.postcode && s.postcode === loc.postcode
            ? 1
            : 9999;
        return { ...s, distanceKm: d, _rank: rank };
      })
      .sort((a, b) => a._rank - b._rank)
      .slice(0, 8)
      .map(({ latitude: _la, longitude: _lo, _rank, ...rest }) => rest);
  };

  return {
    location: loc,
    stores: {
      woolworths,
      iga: rankDir(igaDir),
      aldi: rankDir(aldiDir),
    },
  };
}

export function detectDeviceCoordinates(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    const geo =
      typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geo || typeof geo.getCurrentPosition !== 'function') {
      reject(new Error('Location services are not available on this device'));
      return;
    }
    geo.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        reject(
          new Error(
            err?.message || 'Permission denied or unable to detect GPS location'
          )
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    );
  });
}
