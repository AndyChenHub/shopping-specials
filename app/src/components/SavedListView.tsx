import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import { getCategoryFallbackImage, UI_ASSETS } from '../theme/uiAssets';
import { SpecialItem, StoreId, UserStoreLocation } from '../types/specials';
import { ShoppingListEntry } from '../services/savedStorage';
import { resolveLocalStoreMeta } from './VenueCard';

interface SavedListViewProps {
  entries: ShoppingListEntry[];
  userLocation: UserStoreLocation | null;
  onSelectItem: (item: SpecialItem) => void;
  onToggleDone: (id: string) => void;
  onIncrementItem: (item: SpecialItem) => void;
  onDecrementItem: (item: SpecialItem) => void;
  onClearTicked: () => void;
  onClearAll: () => void;
  onBrowsePress: () => void;
  onShowToast: (msg: string) => void;
}

export const SavedListView: React.FC<SavedListViewProps> = ({
  entries,
  userLocation,
  onSelectItem,
  onToggleDone,
  onIncrementItem,
  onDecrementItem,
  onClearTicked,
  onClearAll,
  onBrowsePress,
  onShowToast,
}) => {
  const summary = useMemo(() => {
    let totalQty = 0;
    let totalCost = 0;
    let totalSaved = 0;
    let doneCount = 0;

    const groups: Partial<Record<StoreId, ShoppingListEntry[]>> = {};

    for (const entry of entries) {
      const { item, quantity, done } = entry;
      totalQty += quantity;
      totalCost += item.price * quantity;
      const unitSave =
        item.saveAmount && item.saveAmount > 0
          ? item.saveAmount
          : item.wasPrice && item.wasPrice > item.price
          ? item.wasPrice - item.price
          : 0;
      totalSaved += unitSave * quantity;
      if (done) doneCount += 1;

      if (!groups[item.store]) groups[item.store] = [];
      groups[item.store]!.push(entry);
    }

    const storeKeys = Object.keys(groups) as StoreId[];
    const progressPct =
      entries.length > 0 ? Math.round((doneCount / entries.length) * 100) : 0;

    return {
      totalQty,
      totalCost,
      totalSaved,
      doneCount,
      groups,
      storeKeys,
      progressPct,
    };
  }, [entries]);

  const handleShareList = async () => {
    const lines = entries.map(({ item, quantity, done }) => {
      const st = STORE_THEMES[item.store]?.shortName || item.storeName;
      const mark = done ? '✓' : '•';
      return `${mark} ${quantity}× ${item.title} (${st}) $${(
        item.price * quantity
      ).toFixed(2)}`;
    });
    const text = [
      'My snag shopping list:',
      ...lines,
      `Est. total: $${summary.totalCost.toFixed(2)} (Saving $${summary.totalSaved.toFixed(2)})`,
    ].join('\n');

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        onShowToast('List copied to clipboard');
        return;
      } catch {
        // fallback to Share
      }
    }

    try {
      await Share.share({ message: text });
    } catch {
      onShowToast('Could not share list');
    }
  };

  if (entries.length === 0) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.emptyContainer}
      >
        <Text style={styles.pageTitle}>Your list</Text>

        <View style={styles.emptyCenter}>
          <View style={styles.photoStack}>
            <Image
              source={UI_ASSETS.strawberries}
              style={[styles.stackImg, styles.stackImgLeft]}
              resizeMode="cover"
            />
            <Image
              source={UI_ASSETS.coffee}
              style={[styles.stackImg, styles.stackImgCenter]}
              resizeMode="cover"
            />
            <Image
              source={UI_ASSETS.avocados}
              style={[styles.stackImg, styles.stackImgRight]}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptySub}>
            Add items or specials and we'll total up what you save across stores.
          </Text>

          <Pressable
            onPress={onBrowsePress}
            style={({ pressed }) => [
              styles.browseBtn,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="pricetag" size={18} color="#FFFFFF" />
            <Text style={styles.browseBtnText}>Browse specials</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Your list</Text>

      {/* Snag Blue Savings Hero Card */}
      <View style={styles.saveCard}>
        <View style={styles.saveCardRingDecor} />
        <Text style={styles.saveSmall}>You're saving</Text>
        <Text style={styles.saveBig}>${summary.totalSaved.toFixed(2)}</Text>

        <View style={styles.saveStatsRow}>
          <View>
            <Text style={styles.saveStatVal}>
              ${summary.totalCost.toFixed(2)}
            </Text>
            <Text style={styles.saveStatLbl}>Est. total</Text>
          </View>
          <View>
            <Text style={styles.saveStatVal}>{summary.totalQty}</Text>
            <Text style={styles.saveStatLbl}>Items</Text>
          </View>
          <View>
            <Text style={styles.saveStatVal}>{summary.storeKeys.length}</Text>
            <Text style={styles.saveStatLbl}>Stores</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${summary.progressPct}%` },
            ]}
          />
        </View>
      </View>

      {/* Store-Grouped Checklist */}
      {summary.storeKeys.map((sid) => {
        const groupEntries = summary.groups[sid] || [];
        const theme = STORE_THEMES[sid] || STORE_THEMES.woolworths;
        const meta = resolveLocalStoreMeta(sid, userLocation);
        const storeSub = groupEntries.reduce(
          (sum, e) => sum + e.item.price * e.quantity,
          0
        );

        return (
          <View key={sid} style={styles.storeGroup}>
            <View style={styles.groupHead}>
              <View
                style={[styles.groupLogo, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.groupLogoText}>{theme.mono}</Text>
              </View>
              <Text style={styles.groupStoreName} numberOfLines={1}>
                {meta.displayName}
              </Text>
              <Text style={styles.groupStoreTotal}>
                ${storeSub.toFixed(2)}
              </Text>
            </View>

            {groupEntries.map(({ item, quantity, done }, idx) => {
              const isLast = idx === groupEntries.length - 1;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.listItem,
                    !isLast && styles.listItemBorder,
                    done && styles.listItemDone,
                  ]}
                >
                  <Pressable
                    onPress={() => onToggleDone(item.id)}
                    hitSlop={8}
                    style={[styles.checkbox, done && styles.checkboxDone]}
                    accessibilityLabel={
                      done ? 'Mark item uncollected' : 'Tick off item'
                    }
                  >
                    {done && (
                      <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => onSelectItem(item)}
                    style={styles.itemTapArea}
                  >
                    <View style={styles.thumbBox}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.thumbImg}
                          resizeMode="contain"
                        />
                      ) : (
                        <Image
                          source={getCategoryFallbackImage(item.category)}
                          style={styles.thumbCover}
                          resizeMode="cover"
                        />
                      )}
                    </View>

                    <View style={styles.itemMid}>
                      <Text
                        style={[
                          styles.itemName,
                          done && styles.itemNameDone,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {item.packageSize ? `${item.packageSize} · ` : ''}
                        {item.inStock === false ? 'Out of stock · ' : ''}
                        <Text style={styles.itemLinePrice}>
                          ${(item.price * quantity).toFixed(2)}
                        </Text>
                      </Text>
                    </View>
                  </Pressable>

                  {/* Mini Stepper */}
                  <View style={styles.miniStepper}>
                    <Pressable
                      onPress={() => onDecrementItem(item)}
                      hitSlop={6}
                      style={styles.miniStepBtn}
                    >
                      <Ionicons name="remove" size={15} color={COLORS.blue} />
                    </Pressable>
                    <Text style={styles.miniStepQty}>{quantity}</Text>
                    <Pressable
                      onPress={() => onIncrementItem(item)}
                      hitSlop={6}
                      style={styles.miniStepBtn}
                    >
                      <Ionicons name="add" size={15} color={COLORS.blue} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      {/* Bottom List Actions */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleShareList}
          style={({ pressed }) => [
            styles.softActionBtn,
            pressed && { opacity: 0.78 },
          ]}
        >
          <Ionicons name="share-outline" size={18} color={COLORS.blueDark} />
          <Text style={styles.softActionText}>Share</Text>
        </Pressable>

        {summary.doneCount > 0 ? (
          <Pressable
            onPress={onClearTicked}
            style={({ pressed }) => [
              styles.softActionBtn,
              pressed && { opacity: 0.78 },
            ]}
          >
            <Ionicons
              name="checkmark-done"
              size={18}
              color={COLORS.blueDark}
            />
            <Text style={styles.softActionText}>
              Clear ticked ({summary.doneCount})
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onClearAll}
            style={({ pressed }) => [
              styles.softActionBtn,
              pressed && { opacity: 0.78 },
            ]}
          >
            <Ionicons name="trash-outline" size={17} color={COLORS.blueDark} />
            <Text style={styles.softActionText}>Clear list</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 170,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingBottom: 140,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -1.4,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  emptyCenter: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  photoStack: {
    width: 184,
    height: 132,
    marginBottom: 24,
    position: 'relative',
  },
  stackImg: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  stackImgLeft: {
    left: 0,
    top: 24,
    transform: [{ rotate: '-12deg' }],
  },
  stackImgCenter: {
    left: 44,
    top: 0,
    zIndex: 2,
    transform: [{ rotate: '3deg' }],
  },
  stackImgRight: {
    right: 0,
    top: 28,
    transform: [{ rotate: '14deg' }],
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  emptySub: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
    lineHeight: 21,
  },
  browseBtn: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  saveCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    backgroundColor: COLORS.blue,
    overflow: 'hidden',
    position: 'relative',
  },
  saveCardRingDecor: {
    position: 'absolute',
    right: -40,
    bottom: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 28,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  saveSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.86)',
  },
  saveBig: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.8,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  saveStatsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
  },
  saveStatVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  saveStatLbl: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.yellow,
    borderRadius: 6,
  },
  storeGroup: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  groupLogo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupLogoText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  groupStoreName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  groupStoreTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink2,
    fontVariant: ['tabular-nums'],
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  listItemDone: {
    opacity: 0.5,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D5D6DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  itemTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  thumbBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: {
    width: '84%',
    height: '84%',
  },
  thumbCover: {
    width: '100%',
    height: '100%',
  },
  itemMid: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.ink,
  },
  itemNameDone: {
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 2,
  },
  itemLinePrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  miniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  miniStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStepQty: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 24,
  },
  softActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.blueSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  softActionText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.blueDark,
  },
});
