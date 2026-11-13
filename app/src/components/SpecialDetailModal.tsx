import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import {
  CompetitorQuote,
  SpecialItem,
  UserStoreLocation,
} from '../types/specials';
import { compareCompetitorPrices } from '../services/api';
import { toLocationSearchContext } from '../services/locationService';

interface SpecialDetailModalProps {
  item: SpecialItem | null;
  isSaved: boolean;
  userLocation?: UserStoreLocation | null;
  onOpenLocationPicker?: () => void;
  onClose: () => void;
  onToggleSave: (item: SpecialItem) => void;
}

export const SpecialDetailModal: React.FC<SpecialDetailModalProps> = ({
  item,
  isSaved,
  userLocation = null,
  onOpenLocationPicker,
  onClose,
  onToggleSave,
}) => {
  const [quotes, setQuotes] = useState<CompetitorQuote[] | null>(null);
  const [queryUsed, setQueryUsed] = useState<string>('');
  const [comparing, setComparing] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const loadCompetitors = useCallback(
    async (target: SpecialItem) => {
      setComparing(true);
      setCompareError(null);
      try {
        const res = await compareCompetitorPrices(
          target,
          toLocationSearchContext(userLocation)
        );
        setQuotes(res.quotes);
        setQueryUsed(res.queryUsed);
      } catch (err) {
        setCompareError(
          err instanceof Error ? err.message : 'Unable to fetch competitor prices'
        );
      } finally {
        setComparing(false);
      }
    },
    [userLocation]
  );

  useEffect(() => {
    let cancelled = false;
    if (!item) {
      setQuotes(null);
      setQueryUsed('');
      setCompareError(null);
      setComparing(false);
      return;
    }

    setQuotes(null);
    setQueryUsed('');
    setCompareError(null);
    setComparing(true);

    compareCompetitorPrices(item, toLocationSearchContext(userLocation))
      .then((res) => {
        if (!cancelled) {
          setQuotes(res.quotes);
          setQueryUsed(res.queryUsed);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCompareError(
            err instanceof Error ? err.message : 'Unable to fetch competitor prices'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setComparing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [item, userLocation]);

  const lowestQuote = useMemo(() => {
    if (!quotes) return null;
    const matchedWithPrice = quotes.filter(
      (q) => q.matched && typeof q.price === 'number' && q.price > 0
    );
    if (matchedWithPrice.length === 0) return null;
    const inStockCandidates = matchedWithPrice.filter((q) => q.inStock !== false);
    const pool =
      inStockCandidates.length > 0 ? inStockCandidates : matchedWithPrice;
    return pool.reduce((min, cur) =>
      (cur.price as number) < (min.price as number) ? cur : min
    );
  }, [quotes]);

  const currentItemLiveQuote = useMemo(() => {
    if (!quotes) return null;
    return quotes.find((q) => q.isCurrentItem) || null;
  }, [quotes]);

  if (!item) return null;

  const storeTheme = STORE_THEMES[item.store] || STORE_THEMES.woolworths;
  const isItemOnSale = Boolean(
    item.isOnSale ??
      (item.isHalfPrice ||
        (item.saveAmount !== null && item.saveAmount > 0) ||
        item.promoText)
  );

  const effectiveInStock =
    typeof currentItemLiveQuote?.inStock === 'boolean'
      ? currentItemLiveQuote.inStock
      : typeof item.inStock === 'boolean'
      ? item.inStock
      : null;

  const effectiveStockLabel =
    currentItemLiveQuote?.stockLabel ||
    item.stockLabel ||
    (effectiveInStock === true
      ? 'In Stock'
      : effectiveInStock === false
      ? 'Out of Stock'
      : null);

  const handleOpenWeb = () => {
    if (item.productUrl) {
      Linking.openURL(item.productUrl);
    }
  };

  return (
    <Modal
      visible={Boolean(item)}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      transparent={Platform.OS !== 'ios'}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.storePill, { backgroundColor: storeTheme.primary }]}>
              <Text style={styles.storePillText}>{storeTheme.name}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="basket-outline" size={64} color={COLORS.textMuted} />
              )}
            </View>

            {/* Promo & Category Badges */}
            <View style={styles.badgesRow}>
              {item.isHalfPrice && (
                <View style={styles.halfPriceBadge}>
                  <Ionicons name="flash" size={14} color={COLORS.halfPriceText} />
                  <Text style={styles.halfPriceBadgeText}>
                    {item.promoText || '½ Price Special'}
                  </Text>
                </View>
              )}
              {!item.isHalfPrice && isItemOnSale && (
                <View style={styles.standardBadge}>
                  <Text style={styles.standardBadgeText}>
                    {item.promoText || 'On Sale'}
                  </Text>
                </View>
              )}
              {!isItemOnSale && (
                <View style={styles.everydayBadge}>
                  <Text style={styles.everydayBadgeText}>Everyday Price</Text>
                </View>
              )}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
              {typeof effectiveInStock === 'boolean' && (
                <View
                  style={[
                    styles.mainStockBadge,
                    effectiveInStock
                      ? styles.mainStockBadgeIn
                      : styles.mainStockBadgeOut,
                  ]}
                >
                  <Ionicons
                    name={
                      effectiveInStock ? 'checkmark-circle' : 'close-circle'
                    }
                    size={14}
                    color={effectiveInStock ? COLORS.savingsText : COLORS.danger}
                  />
                  <Text
                    style={[
                      styles.mainStockBadgeText,
                      {
                        color: effectiveInStock
                          ? COLORS.savingsText
                          : COLORS.danger,
                      },
                    ]}
                  >
                    {effectiveStockLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>

            {item.packageSize && (
              <Text style={styles.packageSize}>Pack size: {item.packageSize}</Text>
            )}

            {/* Price Summary Card */}
            <View style={styles.priceCard}>
              <View>
                <Text style={styles.priceLabel}>
                  {isItemOnSale ? 'Sale Price' : 'Current Price'}
                </Text>
                <Text style={styles.priceBig}>${item.price.toFixed(2)}</Text>
                {item.unitPrice && (
                  <Text style={styles.unitPrice}>{item.unitPrice}</Text>
                )}
              </View>

              <View style={styles.savingsColumn}>
                {item.wasPrice !== null && item.wasPrice > item.price && (
                  <Text style={styles.wasText}>Was ${item.wasPrice.toFixed(2)}</Text>
                )}
                {item.saveAmount !== null && item.saveAmount > 0 && (
                  <View style={styles.savePill}>
                    <Text style={styles.savePillText}>
                      Save ${item.saveAmount.toFixed(2)}
                      {item.discountPercent ? ` (${item.discountPercent}%)` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Live Competitor Price Comparison Section */}
            <View style={styles.compareSection}>
              <View style={styles.compareHeaderRow}>
                <View style={styles.compareTitleWrap}>
                  <Ionicons
                    name="swap-horizontal"
                    size={18}
                    color={COLORS.accent}
                  />
                  <Text style={styles.compareSectionTitle}>
                    Competitor Prices
                  </Text>
                </View>

                <Pressable
                  onPress={() => loadCompetitors(item)}
                  disabled={comparing}
                  hitSlop={8}
                  style={styles.refreshCompareBtn}
                >
                  <Ionicons
                    name="refresh"
                    size={14}
                    color={COLORS.accent}
                  />
                  <Text style={styles.refreshCompareText}>Refresh</Text>
                </Pressable>
              </View>

              <Text style={styles.compareSubtitle}>
                Live price & stock check across Amazon AU, Woolworths, Coles, ALDI & IGA
                {queryUsed ? ` • "${queryUsed}"` : ''}
              </Text>

              {onOpenLocationPicker && (
                <Pressable
                  onPress={onOpenLocationPicker}
                  style={({ pressed }) => [
                    styles.locationContextPill,
                    userLocation
                      ? styles.locationContextPillActive
                      : styles.locationContextPillEmpty,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons
                    name={userLocation ? 'location' : 'location-outline'}
                    size={15}
                    color={userLocation ? COLORS.savingsText : COLORS.accent}
                  />
                  <Text
                    style={[
                      styles.locationContextText,
                      userLocation && styles.locationContextTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {userLocation
                      ? `Checking ${userLocation.suburb}, ${userLocation.state} ${userLocation.postcode} local stores`
                      : 'Set postcode / local store to check nearby in-store stock'}
                  </Text>
                  <Text
                    style={[
                      styles.locationContextAction,
                      userLocation && { color: COLORS.savingsText },
                    ]}
                  >
                    {userLocation ? 'Change' : 'Set Store'}
                  </Text>
                </Pressable>
              )}

              {/* Cheapest Store Callout */}
              {!comparing &&
                lowestQuote &&
                lowestQuote.price !== null &&
                lowestQuote.price < item.price - 0.009 && (
                  <Pressable
                    onPress={() => Linking.openURL(lowestQuote.productUrl)}
                    style={styles.cheaperBanner}
                  >
                    <Ionicons
                      name="trending-down"
                      size={18}
                      color={COLORS.savingsText}
                    />
                    <Text style={styles.cheaperBannerText}>
                      Cheaper at {lowestQuote.storeName}: $
                      {lowestQuote.price.toFixed(2)} (save $
                      {(item.price - lowestQuote.price).toFixed(2)})
                    </Text>
                    <Ionicons
                      name="open-outline"
                      size={15}
                      color={COLORS.savingsText}
                    />
                  </Pressable>
                )}

              {comparing && (
                <View style={styles.compareLoadingCard}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.compareLoadingText}>
                    Checking live prices on Amazon AU, Coles, Woolworths, ALDI & IGA…
                  </Text>
                </View>
              )}

              {!comparing && compareError && (
                <View style={styles.compareErrorCard}>
                  <Text style={styles.compareErrorText}>{compareError}</Text>
                  <Pressable
                    onPress={() => loadCompetitors(item)}
                    style={styles.retryCompareBtn}
                  >
                    <Text style={styles.retryCompareBtnText}>Try Again</Text>
                  </Pressable>
                </View>
              )}

              {!comparing && quotes && (
                <View style={styles.quotesList}>
                  {quotes.map((quote) => {
                    const qTheme =
                      STORE_THEMES[quote.store] || STORE_THEMES.woolworths;
                    const isBestPrice =
                      quote.matched &&
                      quote.price !== null &&
                      lowestQuote?.price !== null &&
                      lowestQuote !== null &&
                      Math.abs(quote.price - (lowestQuote.price as number)) < 0.005;

                    return (
                      <Pressable
                        key={quote.store}
                        onPress={() => {
                          if (quote.productUrl) {
                            Linking.openURL(quote.productUrl);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.quoteRow,
                          isBestPrice && styles.quoteRowBest,
                          pressed && { opacity: 0.82 },
                        ]}
                      >
                        {/* Thumbnail */}
                        {quote.imageUrl ? (
                          <Image
                            source={{ uri: quote.imageUrl }}
                            style={styles.quoteThumb}
                            resizeMode="contain"
                          />
                        ) : (
                          <View
                            style={[
                              styles.quoteThumb,
                              styles.quoteThumbFallback,
                              { backgroundColor: qTheme.softBg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.quoteThumbInitials,
                                { color: qTheme.primary },
                              ]}
                            >
                              {qTheme.shortName.slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}

                        {/* Store + Matched Item Info */}
                        <View style={styles.quoteCenter}>
                          <View style={styles.quoteBadgesLine}>
                            <View
                              style={[
                                styles.quoteStoreChip,
                                { backgroundColor: qTheme.primary },
                              ]}
                            >
                              <Text style={styles.quoteStoreChipText}>
                                {qTheme.name}
                              </Text>
                            </View>

                            {isBestPrice && (
                              <View style={styles.bestPriceBadge}>
                                <Text style={styles.bestPriceBadgeText}>
                                  BEST PRICE
                                </Text>
                              </View>
                            )}

                            {quote.isCurrentItem && (
                              <View style={styles.currentItemTag}>
                                <Text style={styles.currentItemTagText}>
                                  VIEWING
                                </Text>
                              </View>
                            )}

                            {quote.isHalfPrice ? (
                              <View style={styles.quoteMiniHalf}>
                                <Text style={styles.quoteMiniHalfText}>½ PRICE</Text>
                              </View>
                            ) : quote.isOnSale ? (
                              <View style={styles.quoteMiniSale}>
                                <Text style={styles.quoteMiniSaleText}>
                                  {quote.promoText || 'SALE'}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text
                            style={[
                              styles.quoteTitle,
                              !quote.matched && styles.quoteTitleUnmatched,
                            ]}
                            numberOfLines={2}
                          >
                            {quote.title}
                          </Text>

                          {quote.matched && quote.unitPrice && (
                            <Text style={styles.quoteUnitPrice} numberOfLines={1}>
                              {quote.unitPrice}
                            </Text>
                          )}

                          {quote.matched && typeof quote.inStock === 'boolean' && (
                            <View style={styles.quoteStockLine}>
                              <View
                                style={[
                                  styles.quoteStockDot,
                                  {
                                    backgroundColor: quote.inStock
                                      ? COLORS.savingsText
                                      : COLORS.danger,
                                  },
                                ]}
                              />
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.quoteStockText,
                                  {
                                    color: quote.inStock
                                      ? COLORS.savingsText
                                      : COLORS.danger,
                                  },
                                ]}
                              >
                                {quote.stockLabel ||
                                  (quote.inStock ? 'In Stock' : 'Out of Stock')}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Right Price / Search Action */}
                        <View style={styles.quoteRight}>
                          {quote.matched && quote.price !== null ? (
                            <>
                              <Text
                                style={[
                                  styles.quotePrice,
                                  isBestPrice && styles.quotePriceBest,
                                ]}
                              >
                                ${quote.price.toFixed(2)}
                              </Text>
                              {quote.wasPrice !== null &&
                                quote.wasPrice > quote.price && (
                                  <Text style={styles.quoteWasPrice}>
                                    ${quote.wasPrice.toFixed(2)}
                                  </Text>
                                )}
                              <Ionicons
                                name="open-outline"
                                size={13}
                                color={COLORS.textMuted}
                                style={{ marginTop: 2 }}
                              />
                            </>
                          ) : (
                            <View style={styles.searchStorePill}>
                              <Text style={styles.searchStorePillText}>Search</Text>
                              <Ionicons
                                name="open-outline"
                                size={12}
                                color={COLORS.accent}
                              />
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Catalogue Metadata */}
            <View style={styles.metaBox}>
              {item.catalogueName && (
                <View style={styles.metaRow}>
                  <Ionicons
                    name="book-outline"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.metaText}>{item.catalogueName}</Text>
                </View>
              )}
              {item.validDates && (
                <View style={styles.metaRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.metaText}>{item.validDates}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => onToggleSave(item)}
              style={[
                styles.primaryButton,
                isSaved ? styles.savedActiveBtn : { backgroundColor: storeTheme.primary },
              ]}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.primaryButtonText}>
                {isSaved ? 'Saved in Shortlist' : 'Save Item'}
              </Text>
            </Pressable>

            {item.productUrl && (
              <Pressable onPress={handleOpenWeb} style={styles.secondaryButton}>
                <Ionicons name="open-outline" size={18} color={COLORS.textPrimary} />
                <Text style={styles.secondaryButtonText}>
                  Open on {storeTheme.name}
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
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: Platform.OS === 'ios' ? 1 : undefined,
    maxHeight: Platform.OS === 'ios' ? '100%' : '92%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: Platform.OS === 'ios' ? 0 : 24,
    borderTopRightRadius: Platform.OS === 'ios' ? 0 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  storePillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
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
    padding: 20,
    gap: 14,
  },
  imageContainer: {
    height: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  halfPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.halfPriceBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  halfPriceBadgeText: {
    fontWeight: '800',
    fontSize: 12.5,
    color: COLORS.halfPriceText,
  },
  standardBadge: {
    backgroundColor: COLORS.savingsBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  standardBadgeText: {
    fontWeight: '700',
    fontSize: 12.5,
    color: COLORS.savingsText,
  },
  everydayBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  everydayBadgeText: {
    fontWeight: '700',
    fontSize: 12.5,
    color: COLORS.accent,
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontWeight: '600',
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  mainStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  mainStockBadgeIn: {
    backgroundColor: COLORS.savingsBg,
    borderColor: '#CBEBD6',
  },
  mainStockBadgeOut: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  mainStockBadgeText: {
    fontWeight: '800',
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  packageSize: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: -6,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceBig: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  unitPrice: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  savingsColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  wasText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  savePill: {
    backgroundColor: COLORS.savingsBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  savePillText: {
    color: COLORS.savingsText,
    fontWeight: '800',
    fontSize: 13,
  },
  compareSection: {
    marginTop: 4,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  compareHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compareSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  refreshCompareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
  },
  refreshCompareText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  compareSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: -4,
  },
  locationContextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationContextPillEmpty: {
    backgroundColor: COLORS.accentSoft,
    borderColor: '#CEE0FD',
  },
  locationContextPillActive: {
    backgroundColor: COLORS.savingsBg,
    borderColor: '#CBEBD6',
  },
  locationContextText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  locationContextTextActive: {
    color: COLORS.textPrimary,
  },
  locationContextAction: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
  },
  cheaperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.savingsBg,
    borderWidth: 1,
    borderColor: '#B5E4C5',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  cheaperBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.savingsText,
  },
  compareLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compareLoadingText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  compareErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  compareErrorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#991B1B',
    fontWeight: '600',
  },
  retryCompareBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
  },
  retryCompareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quotesList: {
    gap: 8,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quoteRowBest: {
    borderColor: '#137A36',
    borderWidth: 1.5,
    backgroundColor: '#F7FCF9',
  },
  quoteThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  quoteThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteThumbInitials: {
    fontSize: 13,
    fontWeight: '900',
  },
  quoteCenter: {
    flex: 1,
    gap: 3,
  },
  quoteBadgesLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  quoteStoreChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  quoteStoreChipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  bestPriceBadge: {
    backgroundColor: COLORS.savingsText,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  bestPriceBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  currentItemTag: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  currentItemTagText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '800',
  },
  quoteMiniHalf: {
    backgroundColor: COLORS.halfPriceBg,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  quoteMiniHalfText: {
    color: COLORS.halfPriceText,
    fontSize: 9.5,
    fontWeight: '900',
  },
  quoteMiniSale: {
    backgroundColor: COLORS.savingsBg,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  quoteMiniSaleText: {
    color: COLORS.savingsText,
    fontSize: 9.5,
    fontWeight: '800',
  },
  quoteTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 17,
  },
  quoteTitleUnmatched: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  quoteUnitPrice: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  quoteStockLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  quoteStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  quoteStockText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  quoteRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 66,
  },
  quotePrice: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  quotePriceBest: {
    color: COLORS.savingsText,
  },
  quoteWasPrice: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  searchStorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.accentSoft,
  },
  searchStorePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  metaBox: {
    gap: 8,
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  savedActiveBtn: {
    backgroundColor: COLORS.accent,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSubtle,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
  },
});
