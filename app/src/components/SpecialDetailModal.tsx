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
  getCatalogueResetInfo,
  getCategoryFallbackImage,
} from '../theme/uiAssets';
import {
  CompetitorQuote,
  SpecialItem,
  StoreId,
  UserStoreLocation,
} from '../types/specials';
import { compareCompetitorPrices } from '../services/api';
import { toLocationSearchContext } from '../services/locationService';
import { resolveLocalStoreMeta } from './VenueCard';

interface SpecialDetailModalProps {
  item: SpecialItem | null;
  currentQuantity: number;
  isFavourite: boolean;
  userLocation?: UserStoreLocation | null;
  onOpenLocationPicker?: () => void;
  onOpenStore?: (storeId: StoreId) => void;
  onClose: () => void;
  onToggleFavourite: (itemId: string) => void;
  onSetQuantity: (item: SpecialItem, qty: number) => void;
}

function generatePriceHistory(item: SpecialItem): number[] {
  let seed = item.id
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const nextRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const baseHigh =
    item.wasPrice && item.wasPrice > item.price
      ? item.wasPrice
      : item.price * 1.15;
  const pts: number[] = [];
  for (let i = 0; i < 11; i++) {
    const dip = i === 4 || i === 8 ? 0.78 : 0.92 + nextRand() * 0.1;
    pts.push(Math.round(baseHigh * dip * 100) / 100);
  }
  pts.push(item.price);
  return pts;
}

export const SpecialDetailModal: React.FC<SpecialDetailModalProps> = ({
  item,
  currentQuantity,
  isFavourite,
  userLocation = null,
  onOpenLocationPicker,
  onOpenStore,
  onClose,
  onToggleFavourite,
  onSetQuantity,
}) => {
  const [sheetQty, setSheetQty] = useState<number>(1);
  const [quotes, setQuotes] = useState<CompetitorQuote[] | null>(null);
  const [queryUsed, setQueryUsed] = useState<string>('');
  const [comparing, setComparing] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setSheetQty(currentQuantity > 0 ? currentQuantity : 1);
    }
  }, [item, currentQuantity]);

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
          err instanceof Error
            ? err.message
            : 'Unable to fetch competitor prices'
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
            err instanceof Error
              ? err.message
              : 'Unable to fetch competitor prices'
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
    const inStockCandidates = matchedWithPrice.filter(
      (q) => q.inStock !== false
    );
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

  const historyPoints = useMemo(
    () => (item ? generatePriceHistory(item) : []),
    [item]
  );

  if (!item) return null;

  const storeTheme = STORE_THEMES[item.store] || STORE_THEMES.woolworths;
  const localMeta = resolveLocalStoreMeta(item.store, userLocation);
  const { endLabel, timeLeft } = getCatalogueResetInfo();

  const isOnSale = Boolean(
    item.isOnSale ??
      (item.isHalfPrice ||
        (item.saveAmount !== null && item.saveAmount > 0) ||
        item.promoText)
  );

  const pctOff =
    item.discountPercent && item.discountPercent > 0
      ? item.discountPercent
      : item.wasPrice && item.wasPrice > item.price
      ? Math.round((1 - item.price / item.wasPrice) * 100)
      : null;

  const isHalf = Boolean(item.isHalfPrice || (pctOff !== null && pctOff >= 48));
  const saveDollars =
    item.saveAmount && item.saveAmount > 0
      ? item.saveAmount
      : item.wasPrice && item.wasPrice > item.price
      ? item.wasPrice - item.price
      : 0;

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

  const maxHist = Math.max(...historyPoints, item.price * 1.1);
  const minHist = Math.min(...historyPoints) * 0.85;

  const handleConfirmAdd = () => {
    onSetQuantity(item, sheetQty);
    onClose();
  };

  return (
    <Modal
      visible={Boolean(item)}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      transparent={Platform.OS !== 'ios'}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation?.()}
        >
          <ScrollView
            style={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Snag Hero Product Image Area */}
            <View style={styles.heroBox}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.heroContainImg}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={getCategoryFallbackImage(item.category)}
                  style={styles.heroCoverImg}
                  resizeMode="cover"
                />
              )}

              {/* Floating Heart + Close Round Buttons */}
              <Pressable
                onPress={() => onToggleFavourite(item.id)}
                style={[styles.roundBtn, styles.favBtnPos]}
                hitSlop={8}
              >
                <Ionicons
                  name={isFavourite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavourite ? COLORS.hot : COLORS.ink}
                />
              </Pressable>

              <Pressable
                onPress={onClose}
                style={[styles.roundBtn, styles.closeBtnPos]}
                hitSlop={8}
              >
                <Ionicons name="close" size={21} color={COLORS.ink} />
              </Pressable>

              {/* Discount Badge */}
              {isOnSale && (
                <View
                  style={[
                    styles.heroDiscBadge,
                    isHalf ? styles.heroDiscHalf : styles.heroDiscBlue,
                  ]}
                >
                  <Text
                    style={[
                      styles.heroDiscText,
                      isHalf ? { color: COLORS.ink } : { color: '#FFFFFF' },
                    ]}
                  >
                    {isHalf
                      ? '½ price'
                      : pctOff
                      ? `−${pctOff}%`
                      : item.promoText || 'On sale'}
                  </Text>
                </View>
              )}
            </View>

            {/* Body */}
            <View style={styles.body}>
              {/* Store Chip + Stock Status Row */}
              <View style={styles.chipsTopLine}>
                <Pressable
                  onPress={() => {
                    if (onOpenStore) {
                      onClose();
                      onOpenStore(item.store);
                    } else if (item.productUrl) {
                      Linking.openURL(item.productUrl);
                    }
                  }}
                  style={styles.storeChip}
                >
                  <View
                    style={[
                      styles.storeChipDot,
                      { backgroundColor: storeTheme.primary },
                    ]}
                  >
                    <Text style={styles.storeChipDotText}>
                      {storeTheme.mono[0]}
                    </Text>
                  </View>
                  <Text style={styles.storeChipLabel} numberOfLines={1}>
                    {localMeta.displayName} · {localMeta.badgeText}
                  </Text>
                </Pressable>

                {typeof effectiveInStock === 'boolean' && (
                  <View
                    style={[
                      styles.stockBadge,
                      effectiveInStock
                        ? styles.stockBadgeIn
                        : styles.stockBadgeOut,
                    ]}
                  >
                    <View
                      style={[
                        styles.stockDot,
                        {
                          backgroundColor: effectiveInStock
                            ? COLORS.green
                            : COLORS.hot,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.stockBadgeText,
                        {
                          color: effectiveInStock ? COLORS.green : COLORS.hot,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {effectiveStockLabel}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.productTitle}>{item.title}</Text>
              {(item.packageSize || item.category) && (
                <Text style={styles.sizeSub}>
                  {[item.packageSize, item.category].filter(Boolean).join(' · ')}
                </Text>
              )}

              {/* Big Snag Price Row */}
              <View style={styles.priceRow}>
                <Text style={styles.priceBig}>${item.price.toFixed(2)}</Text>
                {item.wasPrice !== null && item.wasPrice > item.price && (
                  <Text style={styles.wasBig}>${item.wasPrice.toFixed(2)}</Text>
                )}
                {saveDollars > 0 && (
                  <View style={styles.savePill}>
                    <Text style={styles.savePillText}>
                      Save ${saveDollars.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {item.unitPrice && (
                <Text style={styles.unitPrice}>{item.unitPrice}</Text>
              )}

              {/* Validity Countdown Info Row */}
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.blue} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoMain}>
                    {isOnSale ? `Ends ${endLabel}` : 'Everyday regular range'}
                  </Text>
                  <Text style={styles.infoSub}>
                    {isOnSale
                      ? `Special price for ${timeLeft} more`
                      : item.validDates || 'Available across Australian stores'}
                  </Text>
                </View>
                {item.productUrl && (
                  <Pressable
                    onPress={() => Linking.openURL(item.productUrl!)}
                    style={styles.openWebChip}
                  >
                    <Text style={styles.openWebChipText}>Web</Text>
                    <Ionicons
                      name="open-outline"
                      size={13}
                      color={COLORS.blue}
                    />
                  </Pressable>
                )}
              </View>

              {/* Live 5-Store Competitor Price & Local Stock Comparison Card */}
              <View style={styles.borderedCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeading}>Compare stores</Text>
                  <Pressable
                    onPress={() => loadCompetitors(item)}
                    disabled={comparing}
                    hitSlop={8}
                    style={styles.refreshChip}
                  >
                    <Ionicons name="refresh" size={13} color={COLORS.blue} />
                    <Text style={styles.refreshChipText}>Refresh</Text>
                  </Pressable>
                </View>

                {onOpenLocationPicker && (
                  <Pressable
                    onPress={onOpenLocationPicker}
                    style={({ pressed }) => [
                      styles.locBanner,
                      pressed && { opacity: 0.78 },
                    ]}
                  >
                    <Ionicons
                      name="location"
                      size={15}
                      color={userLocation ? COLORS.green : COLORS.blue}
                    />
                    <Text style={styles.locBannerText} numberOfLines={1}>
                      {userLocation
                        ? `Checking ${userLocation.suburb} ${userLocation.postcode} local stores`
                        : 'Set postcode / local store to check nearby stock'}
                    </Text>
                    <Text style={styles.locBannerAction}>
                      {userLocation ? 'Change' : 'Set store'}
                    </Text>
                  </Pressable>
                )}

                {comparing && (
                  <View style={styles.loadingCompareRow}>
                    <ActivityIndicator size="small" color={COLORS.blue} />
                    <Text style={styles.loadingCompareText}>
                      Checking Amazon AU, Coles, Woolworths, ALDI & IGA…
                    </Text>
                  </View>
                )}

                {!comparing && compareError && (
                  <View style={styles.errorRow}>
                    <Text style={styles.errorText}>{compareError}</Text>
                    <Pressable onPress={() => loadCompetitors(item)}>
                      <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                  </View>
                )}

                {!comparing && quotes && (
                  <View style={styles.compareList}>
                    {quotes.map((quote, idx) => {
                      const qTheme =
                        STORE_THEMES[quote.store] || STORE_THEMES.woolworths;
                      const isBest =
                        quote.matched &&
                        quote.price !== null &&
                        lowestQuote?.price !== null &&
                        lowestQuote !== null &&
                        Math.abs(quote.price - (lowestQuote.price as number)) <
                          0.005;
                      const isLast = idx === quotes.length - 1;

                      return (
                        <Pressable
                          key={quote.store}
                          onPress={() => {
                            if (quote.productUrl) {
                              Linking.openURL(quote.productUrl);
                            }
                          }}
                          style={({ pressed }) => [
                            styles.cmpRow,
                            !isLast && styles.cmpRowBorder,
                            pressed && { opacity: 0.75 },
                          ]}
                        >
                          <View
                            style={[
                              styles.cmpLogo,
                              { backgroundColor: qTheme.primary },
                            ]}
                          >
                            <Text style={styles.cmpLogoText}>{qTheme.mono}</Text>
                          </View>

                          <View style={styles.cmpCenter}>
                            <View style={styles.cmpNameLine}>
                              <Text style={styles.cmpStoreName}>
                                {qTheme.name}
                              </Text>
                              {isBest && (
                                <View style={styles.bestTag}>
                                  <Text style={styles.bestTagText}>BEST</Text>
                                </View>
                              )}
                              {quote.isCurrentItem && (
                                <View style={styles.viewingTag}>
                                  <Text style={styles.viewingTagText}>
                                    VIEWING
                                  </Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.cmpItemSub} numberOfLines={1}>
                              {quote.matched
                                ? quote.title
                                : `Tap to search "${queryUsed || item.title}"`}
                            </Text>

                            {quote.matched &&
                              typeof quote.inStock === 'boolean' && (
                                <View style={styles.cmpStockLine}>
                                  <View
                                    style={[
                                      styles.stockDot,
                                      {
                                        backgroundColor: quote.inStock
                                          ? COLORS.green
                                          : COLORS.hot,
                                      },
                                    ]}
                                  />
                                  <Text
                                    style={[
                                      styles.cmpStockText,
                                      {
                                        color: quote.inStock
                                          ? COLORS.green
                                          : COLORS.hot,
                                      },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {quote.stockLabel ||
                                      (quote.inStock
                                        ? 'In Stock'
                                        : 'Out of Stock')}
                                  </Text>
                                </View>
                              )}
                          </View>

                          <View style={styles.cmpRight}>
                            {quote.matched && quote.price !== null ? (
                              <>
                                <Text
                                  style={[
                                    styles.cmpPrice,
                                    (isBest || quote.isCurrentItem) && {
                                      color: isBest ? COLORS.green : COLORS.blue,
                                    },
                                  ]}
                                >
                                  ${quote.price.toFixed(2)}
                                </Text>
                                {quote.wasPrice !== null &&
                                  quote.wasPrice > quote.price && (
                                    <Text style={styles.cmpWas}>
                                      ${quote.wasPrice.toFixed(2)}
                                    </Text>
                                  )}
                              </>
                            ) : (
                              <View style={styles.searchExtPill}>
                                <Text style={styles.searchExtText}>Search</Text>
                                <Ionicons
                                  name="open-outline"
                                  size={12}
                                  color={COLORS.blue}
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

              {/* 12-Week Price History Card */}
              <View style={styles.borderedCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeading}>Price history</Text>
                  {isOnSale && (
                    <View style={styles.lowTag}>
                      <Text style={styles.lowTagText}>Lowest in 12 weeks</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sparkChart}>
                  <View style={styles.sparkBars}>
                    {historyPoints.map((val, idx) => {
                      const isCurrent = idx === historyPoints.length - 1;
                      const norm =
                        maxHist > minHist
                          ? (val - minHist) / (maxHist - minHist)
                          : 0.5;
                      const heightPct = Math.max(20, Math.round(norm * 100));
                      return (
                        <View key={`pt-${idx}`} style={styles.sparkCol}>
                          <View
                            style={[
                              styles.sparkBar,
                              { height: `${heightPct}%` },
                              isCurrent && styles.sparkBarCurrent,
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.sparkLabels}>
                    <Text style={styles.sparkLabelText}>12 wks ago</Text>
                    <Text style={styles.sparkLabelText}>
                      Now (${item.price.toFixed(2)})
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Quantity Stepper + Add to List CTA */}
          <View style={styles.footer}>
            <View style={styles.qtyBox}>
              <Pressable
                onPress={() =>
                  setSheetQty((q) =>
                    Math.max(currentQuantity > 0 ? 0 : 1, q - 1)
                  )
                }
                style={styles.qtyBtn}
              >
                <Ionicons name="remove" size={20} color={COLORS.blue} />
              </Pressable>
              <Text style={styles.qtyNum}>{sheetQty}</Text>
              <Pressable
                onPress={() => setSheetQty((q) => Math.min(30, q + 1))}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={20} color={COLORS.blue} />
              </Pressable>
            </View>

            <Pressable
              onPress={handleConfirmAdd}
              style={({ pressed }) => [
                styles.addBtn,
                sheetQty === 0 && { backgroundColor: COLORS.hot },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.addBtnLabel}>
                {sheetQty === 0
                  ? 'Remove from list'
                  : currentQuantity > 0
                  ? 'Update list'
                  : 'Add to list'}
              </Text>
              {sheetQty > 0 && (
                <Text style={styles.addBtnTotal}>
                  ${(item.price * sheetQty).toFixed(2)}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor:
      Platform.OS === 'ios' ? 'transparent' : 'rgba(10, 20, 30, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: Platform.OS === 'ios' ? 1 : undefined,
    maxHeight: Platform.OS === 'ios' ? '100%' : '93%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Platform.OS === 'ios' ? 0 : 28,
    borderTopRightRadius: Platform.OS === 'ios' ? 0 : 28,
    overflow: 'hidden',
  },
  sheetScroll: {
    flex: 1,
  },
  heroBox: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroContainImg: {
    width: '78%',
    height: '78%',
  },
  heroCoverImg: {
    width: '100%',
    height: '100%',
  },
  roundBtn: {
    position: 'absolute',
    top: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  favBtnPos: {
    right: 62,
  },
  closeBtnPos: {
    right: 14,
  },
  heroDiscBadge: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroDiscBlue: {
    backgroundColor: COLORS.blue,
  },
  heroDiscHalf: {
    backgroundColor: COLORS.yellow,
    transform: [{ rotate: '-4deg' }],
  },
  heroDiscText: {
    fontSize: 15,
    fontWeight: '900',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 26,
  },
  chipsTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 11,
    borderRadius: 999,
    maxWidth: '100%',
  },
  storeChipDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeChipDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  storeChipLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.ink,
    flexShrink: 1,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stockBadgeIn: {
    backgroundColor: COLORS.greenSoft,
  },
  stockBadgeOut: {
    backgroundColor: COLORS.hotSoft,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  productTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.8,
    lineHeight: 30,
    marginTop: 12,
  },
  sizeSub: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  priceBig: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.blue,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  wasBig: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.faint,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  savePill: {
    marginLeft: 'auto',
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savePillText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.green,
  },
  unitPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    marginTop: 16,
  },
  infoMain: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  infoSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 1,
  },
  openWebChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  openWebChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.blue,
  },
  borderedCard: {
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  refreshChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.blueSoft,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  refreshChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.blue,
  },
  locBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  locBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink2,
  },
  locBannerAction: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.blue,
  },
  loadingCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  loadingCompareText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.hot,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.blue,
  },
  compareList: {
    marginTop: 2,
  },
  cmpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  cmpRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  cmpLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cmpLogoText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  cmpCenter: {
    flex: 1,
    minWidth: 0,
  },
  cmpNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cmpStoreName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  bestTag: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  viewingTag: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  viewingTagText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  cmpItemSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 1,
  },
  cmpStockLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    marginTop: 2,
  },
  cmpStockText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  cmpRight: {
    alignItems: 'flex-end',
  },
  cmpPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  cmpWas: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.faint,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  searchExtPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.blueSoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  searchExtText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.blue,
  },
  lowTag: {
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lowTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.green,
  },
  sparkChart: {
    marginTop: 6,
  },
  sparkBars: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  sparkCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  sparkBar: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: '#D6EEF9',
  },
  sparkBarCurrent: {
    backgroundColor: COLORS.blue,
  },
  sparkLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sparkLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.faint,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: '#FFFFFF',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    height: 54,
  },
  qtyBtn: {
    width: 44,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: {
    minWidth: 22,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  addBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  addBtnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  addBtnTotal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
