import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SortOption, SpecialsResponse, StoreFilter } from '../types/specials';

const CUSTOM_API_URL_KEY = '@aussie_specials_custom_api_url';
const DEFAULT_BACKEND_PORT = 3001;

/**
 * Automatically detect the Windows/Mac host IP running the companion server
 * when scanning the QR code on a physical iPhone with Expo Go!
 */
export function getAutoDetectedBaseUrl(): string {
  if (Platform.OS === 'web') {
    const host =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : 'localhost';
    return `http://${host}:${DEFAULT_BACKEND_PORT}`;
  }

  // Expo SDK 50+ exposes the Metro bundler LAN host in expoConfig.hostUri (e.g. "192.168.1.42:8081")
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    // Avoid tunnel domains (.exp.direct) when inferring port 3001
    if (host && !host.includes('exp.direct') && !host.includes('ngrok')) {
      return `http://${host}:${DEFAULT_BACKEND_PORT}`;
    }
  }

  return `http://localhost:${DEFAULT_BACKEND_PORT}`;
}

let cachedCustomUrl: string | null | undefined = undefined;

export async function getApiBaseUrl(): Promise<string> {
  if (cachedCustomUrl === undefined) {
    try {
      const saved = await AsyncStorage.getItem(CUSTOM_API_URL_KEY);
      cachedCustomUrl = saved ? saved.trim().replace(/\/+$/, '') : null;
    } catch {
      cachedCustomUrl = null;
    }
  }
  return cachedCustomUrl || getAutoDetectedBaseUrl();
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

export async function getCustomApiBaseUrlRaw(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(CUSTOM_API_URL_KEY)) || '';
  } catch {
    return '';
  }
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
  const baseUrl = await getApiBaseUrl();
  const query = new URLSearchParams();

  if (params.store && params.store !== 'all') query.set('store', params.store);
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.halfPrice) query.set('halfPrice', 'true');
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.live) query.set('live', 'true');
  if (params.sort) query.set('sort', params.sort);

  const res = await fetch(`${baseUrl}/api/specials?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Server returned HTTP ${res.status}`);
  }
  return res.json();
}

export async function triggerWebSync(): Promise<{
  ok: boolean;
  total: number;
  lastSyncedAt: string;
}> {
  const baseUrl = await getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Sync failed with HTTP ${res.status}`);
  }
  return res.json();
}
