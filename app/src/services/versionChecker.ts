import versionData from '../versionInfo.json';

export interface LocalVersionInfo {
  version: string;
  buildNumber: string;
  tagName: string;
  gitSha: string;
  builtAt: string;
  repo: string;
}

export const APP_VERSION_INFO: LocalVersionInfo = {
  version: versionData.version || '1.0.0',
  buildNumber: versionData.buildNumber || '1',
  tagName: versionData.tagName || `v${versionData.version || '1.0.0'}`,
  gitSha: versionData.gitSha || 'dev',
  builtAt: versionData.builtAt || '',
  repo: versionData.repo || 'AndyChenHub/shopping-specials',
};

export interface IpaReleaseCheckResult {
  checkedAt: string;
  hasUpdate: boolean;
  noReleasesYet?: boolean;
  currentVersion: string;
  currentBuild: string;
  latestVersion: string | null;
  latestBuild: string | null;
  latestTag: string | null;
  releaseUrl: string;
  allReleasesUrl: string;
  ipaDownloadUrl: string | null;
  ipaFileName: string | null;
  ipaSizeMb: string | null;
  publishedAt: string | null;
  releaseNotes: string | null;
}

function parseSemverTuple(ver: string): [number, number, number] {
  const cleaned = ver.trim().replace(/^v/i, '');
  const parts = cleaned.split(/[.-]/).map((n) => parseInt(n, 10));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
    Number.isFinite(parts[2]) ? parts[2] : 0,
  ];
}

export function compareSemver(a: string, b: string): number {
  const [aMaj, aMin, aPat] = parseSemverTuple(a);
  const [bMaj, bMin, bPat] = parseSemverTuple(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPat - bPat;
}

export async function checkLatestIpaRelease(): Promise<IpaReleaseCheckResult> {
  const repo = APP_VERSION_INFO.repo;
  const allReleasesUrl = `https://github.com/${repo}/releases`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AussieSpecials-iOS',
      },
      signal: controller.signal,
    });

    if (res.status === 404) {
      return {
        checkedAt: new Date().toISOString(),
        hasUpdate: false,
        noReleasesYet: true,
        currentVersion: APP_VERSION_INFO.version,
        currentBuild: APP_VERSION_INFO.buildNumber,
        latestVersion: null,
        latestBuild: null,
        latestTag: null,
        releaseUrl: allReleasesUrl,
        allReleasesUrl,
        ipaDownloadUrl: null,
        ipaFileName: null,
        ipaSizeMb: null,
        publishedAt: null,
        releaseNotes: null,
      };
    }

    if (!res.ok) {
      throw new Error(`GitHub Releases HTTP ${res.status}`);
    }

    const json = await res.json();
    const latestTag: string = String(json.tag_name || '').trim();
    const latestVersion = latestTag.replace(/^v/i, '') || APP_VERSION_INFO.version;

    const assets: Array<{
      name?: string;
      browser_download_url?: string;
      size?: number;
    }> = Array.isArray(json.assets) ? json.assets : [];

    const ipaAsset = assets.find((a) =>
      String(a.name || '').toLowerCase().endsWith('.ipa')
    );

    const buildMatch = ipaAsset?.name?.match(/-b(\d+)\.ipa$/i);
    const latestBuild = buildMatch ? buildMatch[1] : null;

    const semverDiff = compareSemver(latestVersion, APP_VERSION_INFO.version);
    const buildDiff =
      semverDiff === 0 &&
      latestBuild !== null &&
      APP_VERSION_INFO.gitSha !== 'dev'
        ? (parseInt(latestBuild, 10) || 0) -
          (parseInt(APP_VERSION_INFO.buildNumber, 10) || 0)
        : 0;

    const hasUpdate = semverDiff > 0 || buildDiff > 0;

    return {
      checkedAt: new Date().toISOString(),
      hasUpdate,
      currentVersion: APP_VERSION_INFO.version,
      currentBuild: APP_VERSION_INFO.buildNumber,
      latestVersion,
      latestBuild,
      latestTag,
      releaseUrl: json.html_url || allReleasesUrl,
      allReleasesUrl,
      ipaDownloadUrl: ipaAsset?.browser_download_url || null,
      ipaFileName: ipaAsset?.name || null,
      ipaSizeMb:
        typeof ipaAsset?.size === 'number'
          ? (ipaAsset.size / (1024 * 1024)).toFixed(1)
          : null,
      publishedAt: json.published_at || null,
      releaseNotes: json.body ? String(json.body).trim() : null,
    };
  } finally {
    clearTimeout(timer);
  }
}
