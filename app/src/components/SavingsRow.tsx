import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, STORE_THEMES } from '../theme/colors';
import { getCategoryFallbackImage } from '../theme/uiAssets';
import { SpecialItem } from '../types/specials';

interface SavingsRowProps {
  item: SpecialItem;
  rank?: number;
  isLast?: boolean;
  onPress: (item: SpecialItem) => void;
}

export const SavingsRow: React.FC<SavingsRowProps> = React.memo(
  ({ item, rank, isLast = false, onPress }) => {
    const [imgError, setImgError] = useState(false);
    const storeTheme = STORE_THEMES[item.store] || STORE_THEMES.woolworths;

    const saveDollars =
      item.saveAmount && item.saveAmount > 0
        ? item.saveAmount
        : item.wasPrice && item.wasPrice > item.price
        ? item.wasPrice - item.price
        : 0;

    return (
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [
          styles.row,
          !isLast && styles.rowBorder,
          pressed && { opacity: 0.78 },
        ]}
      >
        {typeof rank === 'number' && <Text style={styles.rank}>{rank}</Text>}

        <View style={styles.thumbBox}>
          {item.imageUrl && !imgError ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbContain}
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <Image
              source={getCategoryFallbackImage(item.category)}
              style={styles.thumbCover}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={styles.mid}>
          <Text style={styles.name} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.subLine}>
            <View
              style={[styles.storeDot, { backgroundColor: storeTheme.primary }]}
            >
              <Text style={styles.storeDotText}>{storeTheme.mono[0]}</Text>
            </View>
            <Text style={styles.subText} numberOfLines={1}>
              {storeTheme.shortName}
              {item.packageSize ? ` · ${item.packageSize}` : ''}
              {item.inStock === true
                ? ' · In Stock'
                : item.inStock === false
                ? ' · Out of Stock'
                : ''}
            </Text>
          </View>
          {saveDollars > 0 ? (
            <View style={styles.savePill}>
              <Text style={styles.savePillText}>
                Save ${saveDollars.toFixed(2)}
              </Text>
            </View>
          ) : item.promoText ? (
            <View style={styles.savePill}>
              <Text style={styles.savePillText}>{item.promoText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightPrice}>
          <Text style={styles.priceNow}>${item.price.toFixed(2)}</Text>
          {item.wasPrice !== null && item.wasPrice > item.price && (
            <Text style={styles.wasPrice}>${item.wasPrice.toFixed(2)}</Text>
          )}
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  rank: {
    width: 24,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.faint,
    fontVariant: ['tabular-nums'],
  },
  thumbBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbContain: {
    width: '84%',
    height: '84%',
  },
  thumbCover: {
    width: '100%',
    height: '100%',
  },
  mid: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  subLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  storeDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeDotText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  subText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.muted,
  },
  savePill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    marginTop: 4,
  },
  savePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.green,
  },
  rightPrice: {
    alignItems: 'flex-end',
  },
  priceNow: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  wasPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.faint,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
});
