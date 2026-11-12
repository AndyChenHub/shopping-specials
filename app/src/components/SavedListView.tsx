import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import { SpecialItem, StoreId } from '../types/specials';

interface SavedListViewProps {
  savedItems: SpecialItem[];
  onSelectItem: (item: SpecialItem) => void;
  onRemoveItem: (item: SpecialItem) => void;
  onClearAll: () => void;
}

const STORE_ORDER: StoreId[] = ['woolworths', 'coles', 'aldi'];

export const SavedListView: React.FC<SavedListViewProps> = ({
  savedItems,
  onSelectItem,
  onRemoveItem,
  onClearAll,
}) => {
  if (savedItems.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="bookmark-outline" size={34} color={COLORS.accent} />
        </View>
        <Text style={styles.emptyTitle}>No Saved Specials Yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the bookmark icon on any Woolworths, Coles, or ALDI deal to build your
          weekly shopping shortlist grouped by store.
        </Text>
      </View>
    );
  }

  const totalCost = savedItems.reduce((sum, i) => sum + (i.price || 0), 0);
  const totalSaved = savedItems.reduce((sum, i) => sum + (i.saveAmount || 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Summary Banner */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>
            {savedItems.length} Saved {savedItems.length === 1 ? 'Item' : 'Items'}
          </Text>
          <Text style={styles.summaryPrice}>Est. Total ${totalCost.toFixed(2)}</Text>
          {totalSaved > 0 && (
            <Text style={styles.summarySavings}>
              You save ${totalSaved.toFixed(2)} off regular prices
            </Text>
          )}
        </View>

        <Pressable onPress={onClearAll} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          <Text style={styles.clearBtnText}>Clear</Text>
        </Pressable>
      </View>

      {/* Store Sections */}
      {STORE_ORDER.map((storeKey) => {
        const group = savedItems.filter((i) => i.store === storeKey);
        if (group.length === 0) return null;

        const theme = STORE_THEMES[storeKey];
        const storeSubtotal = group.reduce((s, i) => s + (i.price || 0), 0);

        return (
          <View key={storeKey} style={styles.storeSection}>
            <View style={[styles.storeHeader, { backgroundColor: theme.softBg }]}>
              <View style={styles.storeTitleRow}>
                <View style={[styles.storeDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.storeHeaderTitle, { color: theme.primary }]}>
                  {theme.name} ({group.length})
                </Text>
              </View>
              <Text style={styles.storeSubtotal}>${storeSubtotal.toFixed(2)}</Text>
            </View>

            {group.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelectItem(item)}
                style={styles.row}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.thumb}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="basket-outline" size={20} color={COLORS.textMuted} />
                  </View>
                )}

                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.rowMeta}>
                    <Text style={styles.rowPrice}>${item.price.toFixed(2)}</Text>
                    {item.isHalfPrice && (
                      <View style={styles.miniHalfBadge}>
                        <Text style={styles.miniHalfText}>½ PRICE</Text>
                      </View>
                    )}
                    {item.saveAmount !== null && item.saveAmount > 0 && (
                      <Text style={styles.rowSave}>
                        Save ${item.saveAmount.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={() => onRemoveItem(item)}
                  hitSlop={10}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  summaryPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  summarySavings: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.savingsText,
    marginTop: 3,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  clearBtnText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  storeSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storeHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  storeSubtotal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowPrice: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  miniHalfBadge: {
    backgroundColor: COLORS.halfPriceBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniHalfText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.halfPriceText,
  },
  rowSave: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.savingsText,
  },
  removeBtn: {
    padding: 2,
  },
});
