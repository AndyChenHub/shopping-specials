import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import {
  NearbyStoreOption,
  SuburbSuggestion,
  UserStoreLocation,
} from '../types/specials';
import {
  detectDeviceCoordinates,
  lookupNearbyStores,
  lookupSuburbs,
} from '../services/locationService';

interface LocationStoreModalProps {
  visible: boolean;
  currentLocation: UserStoreLocation | null;
  onClose: () => void;
  onSaveLocation: (loc: UserStoreLocation | null) => Promise<void> | void;
}

const QUICK_LOCATIONS: Array<{ label: string; postcode: string; suburb: string; state: string }> = [
  { label: 'Sydney 2000', postcode: '2000', suburb: 'Sydney', state: 'NSW' },
  { label: 'Parramatta 2150', postcode: '2150', suburb: 'Parramatta', state: 'NSW' },
  { label: 'Melbourne 3000', postcode: '3000', suburb: 'Melbourne', state: 'VIC' },
  { label: 'Brisbane 4000', postcode: '4000', suburb: 'Brisbane', state: 'QLD' },
  { label: 'Perth 6000', postcode: '6000', suburb: 'Perth', state: 'WA' },
  { label: 'Adelaide 5000', postcode: '5000', suburb: 'Adelaide', state: 'SA' },
];

export const LocationStoreModal: React.FC<LocationStoreModalProps> = ({
  visible,
  currentLocation,
  onClose,
  onSaveLocation,
}) => {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuburbSuggestion[]>([]);
  const [loadingSuburbs, setLoadingSuburbs] = useState<boolean>(false);
  const [loadingStores, setLoadingStores] = useState<boolean>(false);
  const [detectingGps, setDetectingGps] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedLoc, setSelectedLoc] = useState<SuburbSuggestion | null>(null);
  const [wwOptions, setWwOptions] = useState<NearbyStoreOption[]>([]);
  const [igaOptions, setIgaOptions] = useState<NearbyStoreOption[]>([]);
  const [aldiOptions, setAldiOptions] = useState<NearbyStoreOption[]>([]);

  const [selectedWw, setSelectedWw] = useState<NearbyStoreOption | null>(null);
  const [selectedIga, setSelectedIga] = useState<NearbyStoreOption | null>(null);
  const [selectedAldi, setSelectedAldi] = useState<NearbyStoreOption | null>(null);

  const suppressAutocompleteRef = useRef<boolean>(false);

  const fetchStoresForParams = useCallback(
    async (
      params: {
        query?: string;
        postcode?: string;
        suburb?: string;
        state?: string;
        latitude?: number | null;
        longitude?: number | null;
      },
      preserveExistingSelection?: UserStoreLocation | null
    ) => {
      try {
        setLoadingStores(true);
        setErrorMsg(null);
        setSuggestions([]);
        const res = await lookupNearbyStores(params);

        if (!res.location?.postcode && !res.location?.suburb) {
          setErrorMsg('No Australian suburb or stores found for that search.');
          return;
        }

        setSelectedLoc(res.location);
        const ww = res.stores.woolworths || [];
        const iga = res.stores.iga || [];
        const aldi = res.stores.aldi || [];

        setWwOptions(ww);
        setIgaOptions(iga);
        setAldiOptions(aldi);

        const matchSaved = (
          list: NearbyStoreOption[],
          saved: NearbyStoreOption | null | undefined
        ): NearbyStoreOption | null => {
          if (saved) {
            const found = list.find((s) => s.storeId === saved.storeId);
            if (found) return found;
          }
          return list[0] || null;
        };

        setSelectedWw(matchSaved(ww, preserveExistingSelection?.woolworthsStore));
        setSelectedIga(matchSaved(iga, preserveExistingSelection?.igaStore));
        setSelectedAldi(matchSaved(aldi, preserveExistingSelection?.aldiStore));

        suppressAutocompleteRef.current = true;
        setQuery(
          res.location.display ||
            `${res.location.suburb}, ${res.location.state} ${res.location.postcode}`.trim()
        );
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Unable to look up nearby stores'
        );
      } finally {
        setLoadingStores(false);
      }
    },
    []
  );

  // Hydrate when modal opens
  useEffect(() => {
    if (!visible) return;
    setErrorMsg(null);
    setSuggestions([]);

    if (currentLocation) {
      const display = `${currentLocation.suburb}, ${currentLocation.state} ${currentLocation.postcode}`.trim();
      suppressAutocompleteRef.current = true;
      setQuery(display);
      setSelectedLoc({
        postcode: currentLocation.postcode,
        suburb: currentLocation.suburb,
        state: currentLocation.state,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        display,
      });
      setSelectedWw(currentLocation.woolworthsStore);
      setSelectedIga(currentLocation.igaStore);
      setSelectedAldi(currentLocation.aldiStore);

      fetchStoresForParams(
        {
          postcode: currentLocation.postcode,
          suburb: currentLocation.suburb,
          state: currentLocation.state,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        currentLocation
      );
    } else {
      setQuery('');
      setSelectedLoc(null);
      setWwOptions([]);
      setIgaOptions([]);
      setAldiOptions([]);
      setSelectedWw(null);
      setSelectedIga(null);
      setSelectedAldi(null);
    }
  }, [visible, currentLocation, fetchStoresForParams]);

  // Debounced suburb / postcode autocomplete
  useEffect(() => {
    if (!visible) return;
    if (suppressAutocompleteRef.current) {
      suppressAutocompleteRef.current = false;
      return;
    }

    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoadingSuburbs(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoadingSuburbs(true);
        const list = await lookupSuburbs(q);
        if (!cancelled) {
          setSuggestions(list);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuburbs(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, visible]);

  const handleSelectSuggestion = (sub: SuburbSuggestion) => {
    fetchStoresForParams({
      postcode: sub.postcode,
      suburb: sub.suburb,
      state: sub.state,
      latitude: sub.latitude,
      longitude: sub.longitude,
    });
  };

  const handleManualFind = () => {
    const q = query.trim();
    if (!q) return;
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }
    const isPostcode = /^\d{4}$/.test(q);
    fetchStoresForParams(isPostcode ? { postcode: q, query: q } : { query: q });
  };

  const handleUseGps = async () => {
    try {
      setDetectingGps(true);
      setErrorMsg(null);
      const coords = await detectDeviceCoordinates();
      await fetchStoresForParams({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not access GPS location. Enter your postcode instead.'
      );
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSave = async () => {
    if (!selectedLoc) return;
    try {
      setSaving(true);
      const payload: UserStoreLocation = {
        postcode: selectedLoc.postcode,
        suburb: selectedLoc.suburb,
        state: selectedLoc.state,
        latitude: selectedLoc.latitude,
        longitude: selectedLoc.longitude,
        woolworthsStore: selectedWw,
        igaStore: selectedIga,
        aldiStore: selectedAldi,
      };
      await onSaveLocation(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setSaving(true);
      await onSaveLocation(null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const renderStoreSection = (
    title: string,
    storeKey: 'iga' | 'woolworths' | 'aldi',
    subtitle: string,
    options: NearbyStoreOption[],
    selected: NearbyStoreOption | null,
    onSelect: (opt: NearbyStoreOption) => void
  ) => {
    const theme = STORE_THEMES[storeKey];
    return (
      <View style={styles.storeSection}>
        <View style={styles.storeSectionHeader}>
          <View style={[styles.chainBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.chainBadgeText}>{theme.name}</Text>
          </View>
          <Text style={styles.storeSectionTitle}>{title}</Text>
        </View>
        <Text style={styles.storeSectionSub}>{subtitle}</Text>

        {options.length === 0 ? (
          <Text style={styles.noStoresText}>
            No nearby {theme.name} stores found in directory.
          </Text>
        ) : (
          <View style={styles.storeList}>
            {options.slice(0, 5).map((opt) => {
              const isSelected = selected?.storeId === opt.storeId;
              return (
                <Pressable
                  key={`${storeKey}-${opt.storeId}`}
                  onPress={() => onSelect(opt)}
                  style={[
                    styles.storeOptionRow,
                    isSelected && {
                      borderColor: theme.primary,
                      backgroundColor: theme.softBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? theme.primary : COLORS.textMuted}
                  />
                  <View style={styles.storeOptionBody}>
                    <View style={styles.storeOptionTopLine}>
                      <Text style={styles.storeOptionName} numberOfLines={1}>
                        {opt.name}
                      </Text>
                      {opt.distanceKm !== null && (
                        <Text style={styles.distancePill}>
                          {opt.distanceKm.toFixed(1)} km
                        </Text>
                      )}
                    </View>
                    <Text style={styles.storeOptionAddress} numberOfLines={1}>
                      {opt.address}
                    </Text>
                    {(typeof opt.isOpen === 'boolean' || opt.tradingHours) && (
                      <View style={styles.hoursRow}>
                        {typeof opt.isOpen === 'boolean' && (
                          <Text
                            style={[
                              styles.openStatusText,
                              { color: opt.isOpen ? COLORS.savingsText : COLORS.danger },
                            ]}
                          >
                            {opt.isOpen ? 'Open now' : 'Closed'}
                          </Text>
                        )}
                        {opt.tradingHours && (
                          <Text style={styles.hoursText} numberOfLines={1}>
                            {typeof opt.isOpen === 'boolean' ? '• ' : ''}
                            {opt.tradingHours}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      transparent={Platform.OS !== 'ios'}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                <Ionicons name="location" size={17} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Local Store & Stock</Text>
                <Text style={styles.headerSub}>
                  Set your postcode to check nearby store stock & regional prices
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search Input + GPS Button */}
            <View style={styles.searchCard}>
              <View style={styles.inputRow}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Enter postcode or suburb (e.g. 2150, Richmond)…"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  returnKeyType="search"
                  onSubmitEditing={handleManualFind}
                  autoCorrect={false}
                />
                {query.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setQuery('');
                      setSuggestions([]);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </Pressable>
                )}
                <Pressable
                  onPress={handleManualFind}
                  disabled={loadingStores || !query.trim()}
                  style={[
                    styles.findBtn,
                    (!query.trim() || loadingStores) && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.findBtnText}>Find</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleUseGps}
                disabled={detectingGps || loadingStores}
                style={({ pressed }) => [
                  styles.gpsButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                {detectingGps ? (
                  <ActivityIndicator size="small" color={COLORS.accent} />
                ) : (
                  <Ionicons name="navigate" size={15} color={COLORS.accent} />
                )}
                <Text style={styles.gpsButtonText}>
                  {detectingGps
                    ? 'Detecting current location…'
                    : 'Use Current GPS Location'}
                </Text>
              </Pressable>

              {/* Quick Australian Capital / Metro Shortcuts */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickRow}
                keyboardShouldPersistTaps="handled"
              >
                {QUICK_LOCATIONS.map((ql) => (
                  <Pressable
                    key={ql.postcode}
                    onPress={() =>
                      fetchStoresForParams({
                        postcode: ql.postcode,
                        suburb: ql.suburb,
                        state: ql.state,
                      })
                    }
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickChipText}>{ql.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Suburb Autocomplete Dropdown */}
            {loadingSuburbs && (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.inlineLoadingText}>Matching suburbs…</Text>
              </View>
            )}

            {suggestions.length > 0 && (
              <View style={styles.suggestionsCard}>
                {suggestions.map((s) => (
                  <Pressable
                    key={`${s.suburb}-${s.state}-${s.postcode}`}
                    onPress={() => handleSelectSuggestion(s)}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      pressed && { backgroundColor: COLORS.surfaceSubtle },
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={17}
                      color={COLORS.accent}
                    />
                    <Text style={styles.suggestionText}>{s.display}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={COLORS.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
            )}

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={17} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {loadingStores && (
              <View style={styles.loadingStoresBox}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingStoresTitle}>
                  Finding nearby supermarkets…
                </Text>
                <Text style={styles.loadingStoresSub}>
                  Locating closest Woolworths, IGA & ALDI stores
                </Text>
              </View>
            )}

            {/* Selected Location & Store Pickers */}
            {!loadingStores && selectedLoc && (
              <>
                <View style={styles.selectedSuburbBanner}>
                  <View style={styles.selectedSuburbLeft}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.savingsText}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedSuburbTitle}>
                        {selectedLoc.suburb}, {selectedLoc.state}{' '}
                        {selectedLoc.postcode}
                      </Text>
                      <Text style={styles.selectedSuburbMeta}>
                        Coles & Weekly Catalogues set to {selectedLoc.state} Region •
                        Amazon AU delivery availability enabled
                      </Text>
                    </View>
                  </View>
                </View>

                {renderStoreSection(
                  'Preferred Local IGA',
                  'iga',
                  'Checks live store-specific inventory & local shelf pricing at this exact IGA.',
                  igaOptions,
                  selectedIga,
                  setSelectedIga
                )}

                {renderStoreSection(
                  'Preferred Local Woolworths',
                  'woolworths',
                  'Checks Woolworths availability & regional specials for your local supermarket.',
                  wwOptions,
                  selectedWw,
                  setSelectedWw
                )}

                {renderStoreSection(
                  'Preferred Local ALDI',
                  'aldi',
                  'Checks ALDI in-store range & Special Buys for this local ALDI store.',
                  aldiOptions,
                  selectedAldi,
                  setSelectedAldi
                )}
              </>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSave}
              disabled={!selectedLoc || loadingStores || saving}
              style={[
                styles.saveBtn,
                (!selectedLoc || loadingStores || saving) && { opacity: 0.5 },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
              )}
              <Text style={styles.saveBtnText}>
                {selectedLoc
                  ? `Save ${selectedLoc.suburb} (${selectedLoc.postcode}) Stores`
                  : 'Select a Suburb or Postcode'}
              </Text>
            </Pressable>

            {currentLocation && (
              <Pressable
                onPress={handleClear}
                disabled={saving}
                style={styles.clearLocationBtn}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                <Text style={styles.clearLocationText}>
                  Clear Location (Use National Default)
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor:
      Platform.OS === 'ios' ? 'transparent' : 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: Platform.OS === 'ios' ? 1 : undefined,
    maxHeight: Platform.OS === 'ios' ? '100%' : '92%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: Platform.OS === 'ios' ? 0 : 24,
    borderTopRightRadius: Platform.OS === 'ios' ? 0 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  headerIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  searchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 6,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  findBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },
  findBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
  },
  gpsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  quickRow: {
    gap: 7,
    paddingTop: 2,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  inlineLoadingText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  suggestionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSubtle,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
  },
  loadingStoresBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingStoresTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  loadingStoresSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  selectedSuburbBanner: {
    backgroundColor: COLORS.savingsBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B8E4C8',
  },
  selectedSuburbLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  selectedSuburbTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.savingsText,
  },
  selectedSuburbMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  storeSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  storeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chainBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  storeSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  storeSectionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  noStoresText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  storeList: {
    gap: 7,
    marginTop: 2,
  },
  storeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  storeOptionBody: {
    flex: 1,
    gap: 2,
  },
  storeOptionTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  storeOptionName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  distancePill: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  storeOptionAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  openStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  hoursText: {
    flex: 1,
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 9,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  clearLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  clearLocationText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
