import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SortOption, SpecialsResponse, StoreFilter } from '../types/specials';
import { downloadAllSpecialsOnDevice, fetchAldiDirect } from './directFetcher';

const CUSTOM_API_URL_KEY = '@aussie_specials_custom_api_url';
const CACHED_FEED_KEY = '@aussie_specials_feed_cache_v1';
const DEFAULT_BACKEND_PORT = 3001;

export type DataSourceMode = 'on-device' | 'companion-server';

let lastActiveSource: DataSourceMode =
  Platform.OS === 'web' ? 'companion-server' : 'on-device';

export function getLastActiveDataSource(): DataSourceMode {
  return lastActiveSource;
}

/**
 * Check if running inside Expo Go / dev client attached to a LAN Metro host.
 * In a compiled standalone .ipa, hostUri is undefined!
 */
export function getLanMetroHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (
      Constants as unknown as {
        manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
      }
    ).manifest2?.extra?.expoGo?.debuggerHost;

  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host || host.includes('exp.direct') || host.includes('ngrok')) {
    return null;
  }
  return host;
}

export function getAutoDetectedBaseUrl(): string {
  if (Platform.OS === 'web') {
    const host =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : 'localhost';
    return `http://${host}:${DEFAULT_BACKEND_PORT}`;
  }
  const lanHost = getLanMetroHost();
  return lanHost
    ? `http://${lanHost}:${DEFAULT_BACKEND_PORT}`
    : `http://localhost:${DEFAULT_BACKEND_PORT}`;
}

let cachedCustomUrl: string | null | undefined = undefined;

export async function getCustomApiBaseUrlRaw(): Promise<string> {
  if (cachedCustomUrl === undefined) {
    try {
      const saved = await AsyncStorage.getItem(CUSTOM_API_URL_KEY);
      cachedCustomUrl = saved ? saved.trim().replace(/\/+$/, '') : null;
    } catch {
      cachedCustomUrl = null;
    }
  }
  return cachedCustomUrl || '';
}

export async function getApiBaseUrl(): Promise<string> {
  const custom = await getCustomApiBaseUrlRaw();
  return custom || getAutoDetectedBaseUrl();
}

export async function setCustomApiBaseUrl(url: string | null): Promise<string> {
  const cleaned = url ? url.trim().replace(/\/+$/, '') : '';
  if (cleaned) {
    cachedCustomUrl = cleaned;
    await AsyncStorage.setItem(CUSTOM_API_URL_KEY, cleaned);
  } else {
    cachedCustomUrl = null;
    await AsyncStorage.removeItem(CUSTOM_API_URL_KEY);
  }
  return getApiBaseUrl();
}

export async function loadCachedFeedFromDevice(): Promise<SpecialsResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_FEED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpecialsResponse;
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed;
    }
  } catch {
    // ignore corrupt cache
  }
  return null;
}

export async function saveCachedFeedToDevice(feed: SpecialsResponse): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHED_FEED_KEY, JSON.stringify(feed));
  } catch {
    // ignore quota errors
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 3000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function shouldTryCompanionServerFirst(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const custom = await getCustomApiBaseUrlRaw();
  if (custom) return true;
  // In Expo Go on Wi-Fi, try LAN PC server briefly; in standalone .ipa, go straight on-device!
  return Boolean(getLanMetroHost());
}

export interface FetchSpecialsParams {
  store?: StoreFilter;
  category?: string;
  halfPrice?: boolean;
  q?: string;
  live?: boolean;
  sort?: SortOption;
}

export async function fetchSpecials(
  params: FetchSpecialsParams = {}
): Promise<SpecialsResponse> {
  const tryServer = await shouldTryCompanionServerFirst();

  if (tryServer) {
    try {
      const baseUrl = await getApiBaseUrl();
      const query = new URLSearchParams();
      if (params.store && params.store !== 'all') query.set('store', params.store);
      if (params.category && params.category !== 'All') {
        query.set('category', params.category);
      }
      if (params.halfPrice) query.set('halfPrice', 'true');
      if (params.q?.trim()) query.set('q', params.q.trim());
      if (params.live) query.set('live', 'true');
      if (params.sort) query.set('sort', params.sort);

      const timeout = Platform.OS === 'web' ? 20000 : 2800;
      const res = await fetchWithTimeout(
        `${baseUrl}/api/specials?${query.toString()}`,
        {},
        timeout
      );
      if (res.ok) {
        const json: SpecialsResponse = await res.json();
        lastActiveSource = 'companion-server';
        if (!params.q && (!params.store || params.store === 'all')) {
          saveCachedFeedToDevice(json);
        }
        return json;
      }
    } catch (err) {
      if (Platform.OS === 'web') {
        throw err instanceof Error
          ? err
          : new Error('Cannot reach companion server on localhost:3001');
      }
      // On native iOS (.ipa / Expo Go), fall through seamlessly to on-device direct fetching!
    }
  }

  // Native iOS On-Device Direct Fetching (works anywhere on 4G/5G/Wi-Fi with zero server!)
  lastActiveSource = 'on-device';

  if (params.live && params.q?.trim()) {
    const liveAldi = await fetchAldiDirect(params.q.trim());
    return {
      items: liveAldi,
      total: liveAldi.length,
      categories: [],
      storeStats: {
        woolworths: { count: 0, halfPriceCount: 0, status: 'ok' },
        coles: { count: 0, halfPriceCount: 0, status: 'ok' },
        aldi: { count: liveAldi.length, halfPriceCount: 0, status: 'ok' },
      },
      catalogues: { woolworths: null, coles: null, aldi: null },
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'ready',
    };
  }

  // Return device cache if fresh (< 4 hours old), else download fresh catalogues on-device
  const cached = await loadCachedFeedFromDevice();
  if (cached?.lastSyncedAt) {
    const ageMs = Date.now() - new Date(cached.lastSyncedAt).getTime();
    if (ageMs < 4 * 60 * 60 * 1000) {
      return cached;
    }
  }

  const fresh = await downloadAllSpecialsOnDevice();
  await saveCachedFeedToDevice(fresh);
  return fresh;
}

export async function triggerWebSync(): Promise<SpecialsResponse> {
  const tryServer = await shouldTryCompanionServerFirst();

  if (tryServer) {
    try {
      const baseUrl = await getApiBaseUrl();
      const timeout = Platform.OS === 'web' ? 30000 : 3500;
      const refreshRes = await fetchWithTimeout(
        `${baseUrl}/api/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        timeout
      );
      if (refreshRes.ok) {
        const listRes = await fetchWithTimeout(
          `${baseUrl}/api/specials`,
          {},
          10000
        );
        if (listRes.ok) {
          const json: SpecialsResponse = await listRes.json();
          lastActiveSource = 'companion-server';
          await saveCachedFeedToDevice(json);
          return json;
        }
      }
    } catch (err) {
      if (Platform.OS === 'web') {
        throw err instanceof Error ? err : new Error('Refresh failed');
      }
    }
  }

  // Direct on-device web scrape & download
  lastActiveSource = 'on-device';
  const fresh = await downloadAllSpecialsOnDevice();
  await saveCachedFeedToDevice(fresh);
  return fresh;
}
