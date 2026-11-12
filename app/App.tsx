import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, STORE_THEMES } from './src/theme/colors';
import {
  CatalogueInfo,
  SortOption,
  SpecialItem,
  StoreFilter,
  StoreId,
  StoreStat,
} from './src/types/specials';
import {
  fetchSpecials,
  loadCachedFeedFromDevice,
  triggerWebSync,
} from './src/services/api';
import {
  loadSavedSpecials,
  persistSavedSpecials,
} from './src/services/savedStorage';
import { HeaderBar } from './src/components/HeaderBar';
import { FilterBar } from './src/components/FilterBar';
import { SpecialCard } from './src/components/SpecialCard';
import { SpecialDetailModal } from './src/components/SpecialDetailModal';
import { SavedListView } from './src/components/SavedListView';
import { ServerSettingsModal } from './src/components/ServerSettingsModal';

const DEFAULT_CATEGORIES = [
  'Fruit & Veg',
  'Meat & Seafood',
  'Fridge & Dairy',
  'Bakery',
  'Freezer',
  'Pantry & Snacks',
  'Drinks',
  'Household & Pet',
  'Health & Beauty',
  'Special Buys',
];

type ActiveTab = 'browse' | 'saved';

function MainApp() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 1100 ? 4 : width >= 740 ? 3 : 2;

  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');

  // Data state
  const [allItems, setAllItems] = useState<SpecialItem[]>([]);
  const [liveExtraItems, setLiveExtraItems] = useState<SpecialItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [storeStats, setStoreStats] = useState<Record<StoreId, StoreStat> | null>(null);
  const [catalogues, setCatalogues] = useState<Record<StoreId, CatalogueInfo | null> | null>(
    null
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Loading & error state
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [liveSearching, setLiveSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<StoreFilter>('all');
  const [halfPriceOnly, setHalfPriceOnly] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // Saved shortlist & modals
  const [savedItems, setSavedItems] = useState<SpecialItem[]>([]);
  const [detailItem, setDetailItem] = useState<SpecialItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const savedIdSet = useMemo(
    () => new Set(savedItems.map((i) => i.id)),
    [savedItems]
  );

  // Load saved deals from AsyncStorage
  useEffect(() => {
    loadSavedSpecials().then(setSavedItems);
  }, []);

  const applySpecialsResponse = useCallback(
    (data: Awaited<ReturnType<typeof fetchSpecials>>) => {
      setAllItems(data.items || []);
      setLiveExtraItems([]);
      if (data.categories?.length) setCategories(data.categories);
      setStoreStats(data.storeStats || null);
      setCatalogues(data.catalogues || null);
      setLastSyncedAt(data.lastSyncedAt || null);
    },
    []
  );

  const loadCataloguesFromServer = useCallback(async () => {
    try {
      setErrorMsg(null);
      // Hydrate device cache immediately on cold boot so .ipa opens instantaneously
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
      applySpecialsResponse(updated);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to download specials from web';
      setErrorMsg(msg);
    } finally {
      setRefreshing(false);
    }
  }, [applySpecialsResponse]);

  const handleLiveWebSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    try {
      setLiveSearching(true);
      const res = await fetchSpecials({ q, live: true });
      const baseIds = new Set(allItems.map((i) => i.id));
      const extras = (res.items || []).filter((i) => !baseIds.has(i.id));
      setLiveExtraItems(extras);
    } catch {
      // Keep local instant search results if offline
    } finally {
      setLiveSearching(false);
    }
  }, [searchQuery, allItems]);

  const handleToggleSave = useCallback((item: SpecialItem) => {
    setSavedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      const next = exists ? prev.filter((p) => p.id !== item.id) : [item, ...prev];
      persistSavedSpecials(next);
      return next;
    });
  }, []);

  const handleClearSaved = useCallback(() => {
    setSavedItems([]);
    persistSavedSpecials([]);
  }, []);

  // Instant client-side filtering & sorting across all downloaded specials
  const filteredItems = useMemo(() => {
    const combined =
      searchQuery.trim() && liveExtraItems.length > 0
        ? [...allItems, ...liveExtraItems]
        : allItems;

    const tokens = searchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const matches = combined.filter((item) => {
      if (selectedStore !== 'all' && item.store !== selectedStore) return false;
      if (halfPriceOnly && !item.isHalfPrice) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (tokens.length > 0) {
        const hay = `${item.title} ${item.brand || ''} ${item.category} ${
          item.promoText || ''
        } ${item.storeName}`.toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    if (sortBy === 'featured') return matches;

    return [...matches].sort((a, b) => {
      if (sortBy === 'discount') {
        return (b.discountPercent || 0) - (a.discountPercent || 0);
      }
      if (sortBy === 'savings') {
        return (b.saveAmount || 0) - (a.saveAmount || 0);
      }
      if (sortBy === 'price_asc') {
        return (a.price ?? 9999) - (b.price ?? 9999);
      }
      return 0;
    });
  }, [
    allItems,
    liveExtraItems,
    searchQuery,
    selectedStore,
    halfPriceOnly,
    selectedCategory,
    sortBy,
  ]);

  // Active store catalogue validity banner when viewing a single supermarket
  const activeCatalogueBanner = useMemo(() => {
    if (selectedStore === 'all' || !catalogues) return null;
    const info = catalogues[selectedStore];
    if (!info) return null;
    const theme = STORE_THEMES[selectedStore];
    return { info, theme };
  }, [selectedStore, catalogues]);

  return (
    <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <HeaderBar
        totalDeals={allItems.length}
        lastSyncedAt={lastSyncedAt}
        syncing={refreshing}
        onSyncPress={handleSyncFromWeb}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      {activeTab === 'browse' ? (
        <>
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (!q.trim()) setLiveExtraItems([]);
            }}
            onLiveWebSearch={handleLiveWebSearch}
            liveSearching={liveSearching}
            selectedStore={selectedStore}
            onStoreChange={setSelectedStore}
            halfPriceOnly={halfPriceOnly}
            onToggleHalfPrice={() => setHalfPriceOnly((v) => !v)}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            sortBy={sortBy}
            onSortChange={setSortBy}
            storeStats={storeStats}
          />

          {errorMsg && (
            <View style={styles.errorBanner}>
              <View style={styles.errorTextWrap}>
                <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
                <Text style={styles.errorText} numberOfLines={2}>
                  {Platform.OS === 'web'
                    ? `Cannot reach backend (${errorMsg}). Ensure npm run server is running.`
                    : `Could not sync specials (${errorMsg}). Check connection and retry.`}
                </Text>
              </View>
              <Pressable onPress={loadCataloguesFromServer} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {initialLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingTitle}>
                Downloading Supermarket Specials…
              </Text>
              <Text style={styles.loadingSubtitle}>
                Fetching weekly catalogues from Woolworths, Coles & ALDI
              </Text>
            </View>
          ) : (
            <FlatList
              key={`grid-${numColumns}`}
              data={filteredItems}
              numColumns={numColumns}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleSyncFromWeb}
                  tintColor={COLORS.accent}
                />
              }
              ListHeaderComponent={
                <View style={styles.listHeaderWrap}>
                  {activeCatalogueBanner && (
                    <View
                      style={[
                        styles.catalogueBanner,
                        {
                          backgroundColor: activeCatalogueBanner.theme.softBg,
                          borderColor: activeCatalogueBanner.theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="newspaper-outline"
                        size={16}
                        color={activeCatalogueBanner.theme.primary}
                      />
                      <Text
                        style={[
                          styles.catalogueBannerText,
                          { color: activeCatalogueBanner.theme.primary },
                        ]}
                        numberOfLines={1}
                      >
                        {activeCatalogueBanner.info.name} •{' '}
                        {activeCatalogueBanner.info.validDates}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.resultsCountText}>
                    Showing {filteredItems.length}{' '}
                    {filteredItems.length === 1 ? 'special' : 'specials'}
                    {halfPriceOnly ? ' • ½ Price filter active' : ''}
                  </Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptySearchWrap}>
                  <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptySearchTitle}>No matching specials</Text>
                  <Text style={styles.emptySearchSub}>
                    Try clearing a filter or tap "Web Search" to query live supermarket
                    feeds.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedStore('all');
                      setHalfPriceOnly(false);
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                    style={styles.resetFiltersBtn}
                  >
                    <Text style={styles.resetFiltersText}>Reset All Filters</Text>
                  </Pressable>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.cardCell}>
                  <SpecialCard
                    item={item}
                    isSaved={savedIdSet.has(item.id)}
                    onPress={setDetailItem}
                    onToggleSave={handleToggleSave}
                  />
                </View>
              )}
            />
          )}
        </>
      ) : (
        <SavedListView
          savedItems={savedItems}
          onSelectItem={setDetailItem}
          onRemoveItem={handleToggleSave}
          onClearAll={handleClearSaved}
        />
      )}

      {/* Native-Style iOS Bottom Tab Bar */}
      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab('browse')}
            style={styles.tabItem}
          >
            <Ionicons
              name={activeTab === 'browse' ? 'pricetags' : 'pricetags-outline'}
              size={22}
              color={activeTab === 'browse' ? COLORS.accent : COLORS.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'browse' && styles.tabLabelActive,
              ]}
            >
              Specials
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('saved')}
            style={styles.tabItem}
          >
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={activeTab === 'saved' ? COLORS.accent : COLORS.textMuted}
              />
              {savedItems.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{savedItems.length}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'saved' && styles.tabLabelActive,
              ]}
            >
              Saved List
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <SpecialDetailModal
        item={detailItem}
        isSaved={detailItem ? savedIdSet.has(detailItem.id) : false}
        onClose={() => setDetailItem(null)}
        onToggleSave={handleToggleSave}
      />

      <ServerSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={loadCataloguesFromServer}
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
    backgroundColor: COLORS.background,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  errorTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#991B1B',
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  loadingSubtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listHeaderWrap: {
    marginBottom: 8,
    gap: 8,
  },
  catalogueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  catalogueBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
  },
  resultsCountText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  cardCell: {
    flex: 1,
  },
  emptySearchWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptySearchTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  emptySearchSub: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  resetFiltersBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
  },
  resetFiltersText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 13.5,
  },
  tabBarSafe: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tabBar: {
    flexDirection: 'row',
    height: 54,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    right: -10,
    top: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.accent,
    fontWeight: '800',
  },
});
