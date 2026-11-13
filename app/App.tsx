import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, STORE_THEMES } from './src/theme/colors';
import {
  CatalogueInfo,
  DealFilter,
  SortOption,
  SpecialItem,
  StoreFilter,
  StoreId,
  UserStoreLocation,
} from './src/types/specials';
import {
  fetchSpecials,
  loadCachedFeedFromDevice,
  triggerWebSync,
} from './src/services/api';
import {
  isSpecialItemHalfPrice,
  isSpecialItemOnSale,
} from './src/services/normalizeClient';
import {
  loadSavedUserLocation,
  saveUserLocation,
  toLocationSearchContext,
} from './src/services/locationService';
import {
  AussieSpecialsBackupPayload,
  DEFAULT_PREFS,
  loadShoppingList,
  loadUserPrefs,
  persistShoppingList,
  persistUserPrefs,
  ShoppingListEntry,
  SnagUserPrefs,
} from './src/services/savedStorage';
import {
  checkLatestIpaRelease,
  IpaReleaseCheckResult,
} from './src/services/versionChecker';

import { DiscoverView } from './src/components/DiscoverView';
import { StoresView } from './src/components/StoresView';
import { StoreDetailView } from './src/components/StoreDetailView';
import { SearchView } from './src/components/SearchView';
import { SavedListView } from './src/components/SavedListView';
import { SpecialDetailModal } from './src/components/SpecialDetailModal';
import { LocationStoreModal } from './src/components/LocationStoreModal';
import { ServerSettingsModal } from './src/components/ServerSettingsModal';

type ActiveTab = 'discover' | 'stores' | 'search' | 'list';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [pushedStoreId, setPushedStoreId] = useState<StoreId | null>(null);

  // Live Supermarket Feed State
  const [allItems, setAllItems] = useState<SpecialItem[]>([]);
  const [liveExtraItems, setLiveExtraItems] = useState<SpecialItem[]>([]);
  const [liveSearchedQuery, setLiveSearchedQuery] = useState<string>('');
  const searchSeqRef = useRef<number>(0);

  const [catalogues, setCatalogues] = useState<
    Partial<Record<StoreId, CatalogueInfo | null>> | null
  >(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Loading & Error State
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [liveSearching, setLiveSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search Screen Ephemeral Query & Category
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // User Location & Local Stores
  const [userLocation, setUserLocation] = useState<UserStoreLocation | null>(
    null
  );
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);
  const resumeDetailAfterLocationRef = useRef<SpecialItem | null>(null);

  // Shopping List, Favourites, Filters & Persisted Preferences
  const [storageHydrated, setStorageHydrated] = useState<boolean>(false);
  const [listEntries, setListEntries] = useState<ShoppingListEntry[]>([]);
  const [prefs, setPrefs] = useState<SnagUserPrefs>(DEFAULT_PREFS);

  const selectedStore = prefs.selectedStore;
  const dealFilter = prefs.dealFilter;
  const inStockOnly = prefs.inStockOnly;
  const sortBy = prefs.sortBy;

  const setSelectedStore = useCallback((nextStore: StoreFilter) => {
    setPrefs((prev) => ({ ...prev, selectedStore: nextStore }));
  }, []);

  const setDealFilter = useCallback((nextDeal: DealFilter) => {
    setPrefs((prev) => ({ ...prev, dealFilter: nextDeal }));
  }, []);

  const toggleSearchInStockOnly = useCallback(() => {
    setPrefs((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }));
  }, []);

  const setSortBy = useCallback((nextSort: SortOption) => {
    setPrefs((prev) => ({ ...prev, sortBy: nextSort }));
  }, []);

  const setBrowseDealFilter = useCallback((nextDeal: DealFilter) => {
    setPrefs((prev) => ({ ...prev, browseDealFilter: nextDeal }));
  }, []);

  const toggleBrowseInStockOnly = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      browseInStockOnly: !prev.browseInStockOnly,
    }));
  }, []);

  const setStoresTabFilter = useCallback((nextFilter: string) => {
    setPrefs((prev) => ({ ...prev, storesTabFilter: nextFilter }));
  }, []);

  // Modals
  const [detailItem, setDetailItem] = useState<SpecialItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // IPA Release Checker
  const [releaseCheck, setReleaseCheck] =
    useState<IpaReleaseCheckResult | null>(null);
  const [checkingRelease, setCheckingRelease] = useState<boolean>(false);

  // Toast Banner Animation
  const [toastMsg, setToastMsg] = useState<string>('');
  const toastAnim = useRef(new Animated.Value(-90)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setToastMsg(msg);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      Animated.spring(toastAnim, {
        toValue: 10,
        useNativeDriver: true,
        friction: 7,
        tension: 80,
      }).start();
      toastTimerRef.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: -90,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }, 2200);
    },
    [toastAnim]
  );

  // Hydrate persistent list, preferences & saved postcode/stores before enabling writes
  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadShoppingList(),
      loadUserPrefs(),
      loadSavedUserLocation(),
    ]).then(([savedList, savedPrefs, savedLoc]) => {
      if (!mounted) return;
      setListEntries(savedList);
      setPrefs(savedPrefs);
      setUserLocation(savedLoc);
      setStorageHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!storageHydrated) return;
    persistUserPrefs(prefs);
  }, [prefs, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) return;
    persistShoppingList(listEntries);
  }, [listEntries, storageHydrated]);

  const runReleaseCheck = useCallback(async () => {
    try {
      setCheckingRelease(true);
      const res = await checkLatestIpaRelease();
      setReleaseCheck(res);
    } catch {
      // ignore offline check errors
    } finally {
      setCheckingRelease(false);
    }
  }, []);

  useEffect(() => {
    runReleaseCheck();
  }, [runReleaseCheck]);

  const applySpecialsResponse = useCallback(
    (
      data: Awaited<ReturnType<typeof fetchSpecials>>,
      preserveLiveSearch = false
    ) => {
      setAllItems(data.items || []);
      if (!preserveLiveSearch) {
        setLiveExtraItems([]);
      }
      setCatalogues(data.catalogues || null);
      setLastSyncedAt(data.lastSyncedAt || null);
    },
    []
  );

  const loadCataloguesFromServer = useCallback(async () => {
    try {
      setErrorMsg(null);
      const cached = await loadCachedFeedFromDevice();
      if (cached && cached.items?.length > 0) {
        applySpecialsResponse(cached);
        setInitialLoading(false);
      }
      const data = await fetchSpecials();
      applySpecialsResponse(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to fetch specials';
      setErrorMsg(msg);
    } finally {
      setInitialLoading(false);
    }
  }, [applySpecialsResponse]);

  useEffect(() => {
    loadCataloguesFromServer();
  }, [loadCataloguesFromServer]);

  const handleSyncFromWeb = useCallback(async () => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      const updated = await triggerWebSync();
      applySpecialsResponse(updated, searchQuery.trim().length >= 2);
      showToast('Prices & catalogues updated');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to sync from web';
      setErrorMsg(msg);
    } finally {
      setRefreshing(false);
    }
  }, [applySpecialsResponse, searchQuery, showToast]);

  // Live Full-Range Cross-Retailer Search
  const runLiveSearchForQuery = useCallback(
    async (rawQuery: string, explicitLoc?: UserStoreLocation | null) => {
      const q = rawQuery.trim();
      if (q.length < 2) {
        setLiveSearching(false);
        return;
      }
      const seq = ++searchSeqRef.current;
      const activeLoc =
        explicitLoc !== undefined ? explicitLoc : userLocation;
      try {
        setLiveSearching(true);
        const res = await fetchSpecials({
          q,
          live: true,
          locationCtx: toLocationSearchContext(activeLoc),
        });
        if (seq !== searchSeqRef.current) return;
        setLiveExtraItems(res.items || []);
        setLiveSearchedQuery(q.toLowerCase());
      } catch {
        // keep instant local search results if offline
      } finally {
        if (seq === searchSeqRef.current) {
          setLiveSearching(false);
        }
      }
    },
    [userLocation]
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      searchSeqRef.current += 1;
      setLiveSearching(false);
      if (!q) {
        setLiveExtraItems([]);
        setLiveSearchedQuery('');
      }
      return;
    }
    const timer = setTimeout(() => {
      runLiveSearchForQuery(q);
    }, 340);
    return () => clearTimeout(timer);
  }, [searchQuery, runLiveSearchForQuery]);

  const handleSubmitSearch = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      runLiveSearchForQuery(trimmed);
      setPrefs((prev) => {
        const nextRecent = [
          trimmed,
          ...prev.recentSearches.filter(
            (r) => r.toLowerCase() !== trimmed.toLowerCase()
          ),
        ].slice(0, 6);
        return { ...prev, recentSearches: nextRecent };
      });
    },
    [runLiveSearchForQuery]
  );

  // Location Save Handler
  const handleSaveLocation = useCallback(
    async (nextLoc: UserStoreLocation | null) => {
      await saveUserLocation(nextLoc);
      setUserLocation(nextLoc);
      showToast(
        nextLoc
          ? `Local stores set to ${nextLoc.suburb} ${nextLoc.postcode}`
          : 'Cleared local store filter'
      );

      const q = searchQuery.trim();
      if (q.length >= 2) {
        runLiveSearchForQuery(q, nextLoc);
      }

      try {
        setRefreshing(true);
        const updated = await triggerWebSync(toLocationSearchContext(nextLoc));
        applySpecialsResponse(updated, q.length >= 2);
      } catch {
        // ignore offline refresh error
      } finally {
        setRefreshing(false);
      }
    },
    [applySpecialsResponse, runLiveSearchForQuery, searchQuery, showToast]
  );

  const handleOpenLocationFromDetail = useCallback(() => {
    if (Platform.OS === 'ios' && detailItem) {
      resumeDetailAfterLocationRef.current = detailItem;
      setDetailItem(null);
      setTimeout(() => setLocationModalOpen(true), 280);
    } else {
      setLocationModalOpen(true);
    }
  }, [detailItem]);

  const handleCloseLocationModal = useCallback(() => {
    setLocationModalOpen(false);
    if (resumeDetailAfterLocationRef.current) {
      const target = resumeDetailAfterLocationRef.current;
      resumeDetailAfterLocationRef.current = null;
      setTimeout(() => setDetailItem(target), 280);
    }
  }, []);

  // Shopping List Helpers
  const qtyMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of listEntries) {
      m[e.item.id] = e.quantity;
    }
    return m;
  }, [listEntries]);

  const listSummary = useMemo(() => {
    let totalQty = 0;
    let totalCost = 0;
    let totalSaved = 0;
    for (const { item, quantity } of listEntries) {
      totalQty += quantity;
      totalCost += item.price * quantity;
      const unitSave =
        item.saveAmount && item.saveAmount > 0
          ? item.saveAmount
          : item.wasPrice && item.wasPrice > item.price
          ? item.wasPrice - item.price
          : 0;
      totalSaved += unitSave * quantity;
    }
    return { totalQty, totalCost, totalSaved };
  }, [listEntries]);

  const handleSetQuantity = useCallback(
    (item: SpecialItem, qty: number) => {
      setListEntries((prev) => {
        const idx = prev.findIndex((e) => e.item.id === item.id);
        if (qty <= 0) {
          return prev.filter((e) => e.item.id !== item.id);
        }
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], item, quantity: qty };
          return next;
        }
        return [{ item, quantity: qty, done: false }, ...prev];
      });
      showToast(
        qty > 0 ? `${item.title} · ${qty} on your list` : 'Removed from list'
      );
    },
    [showToast]
  );

  const handleIncrementItem = useCallback((item: SpecialItem) => {
    setListEntries((prev) => {
      const idx = prev.findIndex((e) => e.item.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [{ item, quantity: 1, done: false }, ...prev];
    });
  }, []);

  const handleDecrementItem = useCallback((item: SpecialItem) => {
    setListEntries((prev) => {
      const idx = prev.findIndex((e) => e.item.id === item.id);
      if (idx < 0) return prev;
      const current = prev[idx].quantity;
      return current <= 1
        ? prev.filter((e) => e.item.id !== item.id)
        : prev.map((e, i) =>
            i === idx ? { ...e, quantity: e.quantity - 1 } : e
          );
    });
  }, []);

  const handleToggleDone = useCallback((id: string) => {
    setListEntries((prev) =>
      prev.map((e) => (e.item.id === id ? { ...e, done: !e.done } : e))
    );
  }, []);

  const handleClearTicked = useCallback(() => {
    setListEntries((prev) => prev.filter((e) => !e.done));
    showToast('Ticked items cleared');
  }, [showToast]);

  const handleClearAll = useCallback(() => {
    setListEntries([]);
    showToast('Shopping list cleared');
  }, [showToast]);

  // Favourites Helpers
  const handleToggleFavStore = useCallback(
    (storeId: StoreId) => {
      const currentlyFav = prefs.favStores.includes(storeId);
      setPrefs((prev) => {
        const exists = prev.favStores.includes(storeId);
        const favStores = exists
          ? prev.favStores.filter((s) => s !== storeId)
          : [...prev.favStores, storeId];
        return { ...prev, favStores };
      });
      showToast(
        currentlyFav
          ? 'Removed from favourite stores'
          : `${STORE_THEMES[storeId].name} saved to favourites`
      );
    },
    [prefs.favStores, showToast]
  );

  const handleToggleFavItem = useCallback((itemId: string) => {
    setPrefs((prev) => {
      const exists = prev.favItemIds.includes(itemId);
      const favItemIds = exists
        ? prev.favItemIds.filter((id) => id !== itemId)
        : [...prev.favItemIds, itemId];
      return { ...prev, favItemIds };
    });
  }, []);

  const handleBackupRestored = useCallback(
    async (restored: AussieSpecialsBackupPayload) => {
      await loadSavedUserLocation(true);
      setPrefs(restored.prefs);
      setListEntries(restored.shoppingList);
      setUserLocation(restored.userLocation);
      showToast('Preferences & shopping list restored');
      loadCataloguesFromServer();
    },
    [loadCataloguesFromServer, showToast]
  );

  // Search Pool & Filtering
  const queryMatchedPool = useMemo(() => {
    const qNorm = searchQuery.trim().toLowerCase();
    if (!qNorm) return allItems;

    const tokens = qNorm.split(/\s+/).filter(Boolean);
    const matchesTokens = (item: SpecialItem) => {
      const hay = `${item.title} ${item.brand || ''} ${item.category} ${
        item.promoText || ''
      } ${item.storeName}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    };

    const localMatches = allItems.filter(matchesTokens);
    const primaryLive =
      liveSearchedQuery === qNorm
        ? liveExtraItems
        : liveExtraItems.filter(matchesTokens);

    const out: SpecialItem[] = [];
    const seen = new Set<string>();
    for (const item of [...primaryLive, ...localMatches]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  }, [allItems, liveExtraItems, liveSearchedQuery, searchQuery]);

  const searchCounts = useMemo(() => {
    const catPool = queryMatchedPool.filter((i) =>
      selectedCategory === 'All' ? true : i.category === selectedCategory
    );
    const amazonCount = catPool.filter((i) => i.store === 'amazon').length;
    const storeScoped =
      selectedStore === 'all'
        ? catPool
        : catPool.filter((i) => i.store === selectedStore);

    const dealScoped = inStockOnly
      ? storeScoped.filter((i) => i.inStock === true)
      : storeScoped;

    const stockScoped = storeScoped.filter((i) => {
      if (dealFilter === 'half_price') return isSpecialItemHalfPrice(i);
      if (dealFilter === 'sale') return isSpecialItemOnSale(i);
      return true;
    });

    const aisleCounts: Record<string, number> = {};
    for (const item of queryMatchedPool) {
      if (selectedStore !== 'all' && item.store !== selectedStore) continue;
      if (dealFilter === 'half_price' && !isSpecialItemHalfPrice(item)) continue;
      if (dealFilter === 'sale' && !isSpecialItemOnSale(item)) continue;
      if (inStockOnly && item.inStock !== true) continue;
      aisleCounts[item.category] = (aisleCounts[item.category] || 0) + 1;
    }

    return {
      totalItemsCount: dealScoped.length,
      totalOnSaleCount: dealScoped.filter(isSpecialItemOnSale).length,
      totalHalfPriceCount: dealScoped.filter(isSpecialItemHalfPrice).length,
      inStockCount: stockScoped.filter((i) => i.inStock === true).length,
      amazonCount,
      aisleCounts,
    };
  }, [
    queryMatchedPool,
    selectedCategory,
    selectedStore,
    dealFilter,
    inStockOnly,
  ]);

  const filteredSearchItems = useMemo(() => {
    const matches = queryMatchedPool.filter((item) => {
      if (selectedStore !== 'all' && item.store !== selectedStore) return false;
      if (dealFilter === 'half_price' && !isSpecialItemHalfPrice(item)) {
        return false;
      }
      if (dealFilter === 'sale' && !isSpecialItemOnSale(item)) return false;
      if (inStockOnly && item.inStock !== true) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });

    if (sortBy === 'featured') return matches;

    const getDiscountPct = (it: SpecialItem) =>
      it.discountPercent ??
      (it.wasPrice && it.wasPrice > it.price
        ? Math.round(((it.wasPrice - it.price) / it.wasPrice) * 100)
        : 0);
    const getSaveAmt = (it: SpecialItem) =>
      it.saveAmount ??
      (it.wasPrice && it.wasPrice > it.price ? it.wasPrice - it.price : 0);

    return [...matches].sort((a, b) => {
      if (sortBy === 'discount') {
        return getDiscountPct(b) - getDiscountPct(a);
      }
      if (sortBy === 'savings') {
        return getSaveAmt(b) - getSaveAmt(a);
      }
      if (sortBy === 'price_asc') {
        return (a.price ?? 9999) - (b.price ?? 9999);
      }
      return 0;
    });
  }, [
    queryMatchedPool,
    selectedStore,
    dealFilter,
    inStockOnly,
    selectedCategory,
    sortBy,
  ]);

  const pushedStoreItems = useMemo(() => {
    if (!pushedStoreId) return [];
    const combined = [...allItems, ...liveExtraItems];
    const seen = new Set<string>();
    const out: SpecialItem[] = [];
    for (const it of combined) {
      if (it.store === pushedStoreId && !seen.has(it.id)) {
        seen.add(it.id);
        out.push(it);
      }
    }
    return out;
  }, [allItems, liveExtraItems, pushedStoreId]);

  const handleSelectTab = (tab: ActiveTab) => {
    setPushedStoreId(null);
    setActiveTab(tab);
  };

  const showFloatingCartBar =
    listSummary.totalQty > 0 && (activeTab !== 'list' || pushedStoreId !== null);

  return (
    <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Animated Snag Toast Notification */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toastBanner,
          { transform: [{ translateY: toastAnim }] },
        ]}
      >
        <Ionicons name="pricetag" size={16} color={COLORS.yellow} />
        <Text style={styles.toastText} numberOfLines={1}>
          {toastMsg}
        </Text>
      </Animated.View>

      {/* IPA Release Update Banner */}
      {releaseCheck?.hasUpdate &&
        releaseCheck.latestTag !== prefs.dismissedUpdateTag && (
          <View style={styles.updateBanner}>
            <View style={styles.updateBannerLeft}>
              <Ionicons name="sparkles" size={15} color={COLORS.blue} />
              <Text style={styles.updateBannerText} numberOfLines={1}>
                New iOS .ipa {releaseCheck.latestTag} available
              </Text>
            </View>
            <View style={styles.updateBannerActions}>
              <Pressable
                onPress={() => setSettingsOpen(true)}
                style={styles.updateBannerBtn}
              >
                <Text style={styles.updateBannerBtnText}>Update</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setPrefs((prev) => ({
                    ...prev,
                    dismissedUpdateTag: releaseCheck.latestTag,
                  }))
                }
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={COLORS.muted} />
              </Pressable>
            </View>
          </View>
        )}

      {/* Connection Error Banner */}
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={18} color={COLORS.hot} />
          <Text style={styles.errorText} numberOfLines={2}>
            {Platform.OS === 'web'
              ? `Backend unreachable (${errorMsg}). Run npm run server.`
              : `Could not sync (${errorMsg}).`}
          </Text>
          <Pressable onPress={loadCataloguesFromServer} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.screenArea}>
        {initialLoading ? (
          <View style={styles.loadingState}>
            <Image
              source={require('./assets/icon.png')}
              style={styles.loadingAppIcon}
              resizeMode="cover"
            />
            <Text style={styles.loadingWordmark}>
              Aussie Specials<Text style={{ color: COLORS.yellow }}>.</Text>
            </Text>
            <ActivityIndicator
              size="large"
              color={COLORS.blue}
              style={{ marginTop: 14 }}
            />
            <Text style={styles.loadingTitle}>
              Loading this week's specials & range…
            </Text>
            <Text style={styles.loadingSub}>
              Checking Woolworths, Coles, ALDI & IGA
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'discover' && (
              <DiscoverView
                allItems={allItems}
                qtyMap={qtyMap}
                favStores={prefs.favStores}
                userLocation={userLocation}
                lastSyncedAt={lastSyncedAt}
                refreshing={refreshing}
                hasAppUpdate={Boolean(releaseCheck?.hasUpdate)}
                browseDealFilter={prefs.browseDealFilter}
                onChangeBrowseDealFilter={setBrowseDealFilter}
                browseInStockOnly={prefs.browseInStockOnly}
                onToggleBrowseInStockOnly={toggleBrowseInStockOnly}
                onRefresh={handleSyncFromWeb}
                onOpenLocation={() => setLocationModalOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onSelectProduct={setDetailItem}
                onIncrementItem={handleIncrementItem}
                onDecrementItem={handleDecrementItem}
                onOpenStore={(sid) => setPushedStoreId(sid)}
                onNavigateTab={handleSelectTab}
              />
            )}

            {activeTab === 'stores' && (
              <StoresView
                allItems={allItems}
                favStores={prefs.favStores}
                userLocation={userLocation}
                selectedFilter={prefs.storesTabFilter}
                onSelectFilter={setStoresTabFilter}
                onOpenStore={(sid) => setPushedStoreId(sid)}
                onOpenLocation={() => setLocationModalOpen(true)}
              />
            )}

            {activeTab === 'search' && (
              <SearchView
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                  setSearchQuery(q);
                  if (!q.trim()) setLiveExtraItems([]);
                }}
                onSubmitSearch={handleSubmitSearch}
                liveSearching={liveSearching}
                allItems={allItems}
                filteredItems={filteredSearchItems}
                qtyMap={qtyMap}
                recentSearches={prefs.recentSearches}
                selectedStore={selectedStore}
                onStoreChange={setSelectedStore}
                dealFilter={dealFilter}
                onDealFilterChange={setDealFilter}
                inStockOnly={inStockOnly}
                onToggleInStockOnly={toggleSearchInStockOnly}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                counts={searchCounts}
                onSelectProduct={setDetailItem}
                onIncrementItem={handleIncrementItem}
                onDecrementItem={handleDecrementItem}
              />
            )}

            {activeTab === 'list' && (
              <SavedListView
                entries={listEntries}
                userLocation={userLocation}
                onSelectItem={setDetailItem}
                onToggleDone={handleToggleDone}
                onIncrementItem={handleIncrementItem}
                onDecrementItem={handleDecrementItem}
                onClearTicked={handleClearTicked}
                onClearAll={handleClearAll}
                onBrowsePress={() => handleSelectTab('discover')}
                onShowToast={showToast}
              />
            )}

            {/* Pushed Store Detail Screen */}
            {pushedStoreId && (
              <StoreDetailView
                storeId={pushedStoreId}
                items={pushedStoreItems}
                catalogue={catalogues?.[pushedStoreId] || null}
                qtyMap={qtyMap}
                isFavourite={prefs.favStores.includes(pushedStoreId)}
                userLocation={userLocation}
                onClose={() => setPushedStoreId(null)}
                onToggleFavourite={handleToggleFavStore}
                onSelectProduct={setDetailItem}
                onIncrementItem={handleIncrementItem}
                onDecrementItem={handleDecrementItem}
                onOpenLocation={() => setLocationModalOpen(true)}
              />
            )}
          </>
        )}

        {/* Snag Floating Blue Cart Bar */}
        {showFloatingCartBar && (
          <Pressable
            onPress={() => handleSelectTab('list')}
            style={({ pressed }) => [
              styles.floatingCartBar,
              pressed && { transform: [{ scale: 0.985 }] },
            ]}
          >
            <View style={styles.cartCountBox}>
              <Text style={styles.cartCountText}>{listSummary.totalQty}</Text>
            </View>
            <View style={styles.cartLabelCol}>
              <Text style={styles.cartLabelMain}>View list</Text>
              {listSummary.totalSaved > 0 && (
                <Text style={styles.cartLabelSub}>
                  Saving ${listSummary.totalSaved.toFixed(2)}
                </Text>
              )}
            </View>
            <Text style={styles.cartTotalText}>
              ${listSummary.totalCost.toFixed(2)}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Snag 4-Tab Bottom Navigation Bar */}
      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => handleSelectTab('discover')}
            style={styles.tabBtn}
          >
            <Ionicons
              name={
                activeTab === 'discover' && !pushedStoreId
                  ? 'compass'
                  : 'compass-outline'
              }
              size={25}
              color={
                activeTab === 'discover' && !pushedStoreId
                  ? COLORS.blue
                  : '#9C9DA3'
              }
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'discover' &&
                  !pushedStoreId &&
                  styles.tabLabelActive,
              ]}
            >
              Discover
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelectTab('stores')}
            style={styles.tabBtn}
          >
            <Ionicons
              name={
                activeTab === 'stores' || pushedStoreId
                  ? 'storefront'
                  : 'storefront-outline'
              }
              size={24}
              color={
                activeTab === 'stores' || pushedStoreId
                  ? COLORS.blue
                  : '#9C9DA3'
              }
            />
            <Text
              style={[
                styles.tabLabel,
                (activeTab === 'stores' || pushedStoreId) &&
                  styles.tabLabelActive,
              ]}
            >
              Stores
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelectTab('search')}
            style={styles.tabBtn}
          >
            <Ionicons
              name={
                activeTab === 'search' && !pushedStoreId
                  ? 'search'
                  : 'search-outline'
              }
              size={24}
              color={
                activeTab === 'search' && !pushedStoreId
                  ? COLORS.blue
                  : '#9C9DA3'
              }
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'search' &&
                  !pushedStoreId &&
                  styles.tabLabelActive,
              ]}
            >
              Search
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelectTab('list')}
            style={styles.tabBtn}
          >
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={
                  activeTab === 'list' && !pushedStoreId
                    ? 'list'
                    : 'list-outline'
                }
                size={25}
                color={
                  activeTab === 'list' && !pushedStoreId
                    ? COLORS.blue
                    : '#9C9DA3'
                }
              />
              {listSummary.totalQty > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {listSummary.totalQty}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'list' &&
                  !pushedStoreId &&
                  styles.tabLabelActive,
              ]}
            >
              List
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Modals */}
      <SpecialDetailModal
        item={detailItem}
        currentQuantity={detailItem ? qtyMap[detailItem.id] || 0 : 0}
        isFavourite={
          detailItem ? prefs.favItemIds.includes(detailItem.id) : false
        }
        userLocation={userLocation}
        onOpenLocationPicker={handleOpenLocationFromDetail}
        onOpenStore={(sid) => setPushedStoreId(sid)}
        onClose={() => setDetailItem(null)}
        onToggleFavourite={handleToggleFavItem}
        onSetQuantity={handleSetQuantity}
      />

      <LocationStoreModal
        visible={locationModalOpen}
        currentLocation={userLocation}
        onClose={handleCloseLocationModal}
        onSaveLocation={handleSaveLocation}
      />

      <ServerSettingsModal
        visible={settingsOpen}
        releaseCheck={releaseCheck}
        checkingRelease={checkingRelease}
        onCheckRelease={runReleaseCheck}
        onClose={() => setSettingsOpen(false)}
        onSaved={loadCataloguesFromServer}
        onBackupRestored={handleBackupRestored}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenArea: {
    flex: 1,
    position: 'relative',
  },
  toastBanner: {
    position: 'absolute',
    alignSelf: 'center',
    top: 6,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    maxWidth: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.blueSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  updateBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  updateBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.blueDark,
  },
  updateBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateBannerBtn: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  updateBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.hotSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.hot,
  },
  retryBtn: {
    backgroundColor: COLORS.hot,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingAppIcon: {
    width: 78,
    height: 78,
    borderRadius: 20,
    marginBottom: 12,
  },
  loadingWordmark: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.blue,
    letterSpacing: -1.1,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 14,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  floatingCartBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 45,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 7,
  },
  cartCountBox: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  cartLabelCol: {
    flex: 1,
  },
  cartLabelMain: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cartLabelSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -1,
  },
  cartTotalText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  tabBarSafe: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 4 : 10,
  },
  tabBtn: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -11,
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: COLORS.hot,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9C9DA3',
  },
  tabLabelActive: {
    color: COLORS.blue,
  },
});
