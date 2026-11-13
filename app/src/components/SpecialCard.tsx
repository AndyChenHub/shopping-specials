import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import { getCategoryFallbackImage } from '../theme/uiAssets';
import { SpecialItem } from '../types/specials';

interface SpecialCardProps {
  item: SpecialItem;
  quantity?: number;
  width?: number;
  onPress: (item: SpecialItem) => void;
  onIncrement: (item: SpecialItem) => void;
  onDecrement: (item: SpecialItem) => void;
}

export const SpecialCard: React.FC<SpecialCardProps> = React.memo(
  ({
    item,
    quantity = 0,
    width,
    onPress,
    onIncrement,
    onDecrement,
  }) => {
    const [imgError, setImgError] = useState(false);
    const storeTheme = STORE_THEMES[item.store] || STORE_THEMES.woolworths;

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
    const badgeLabel = isHalf
      ? '½ price'
      : isOnSale
      ? pctOff
        ? `−${pctOff}%`
        : 'Sale'
      : null;

    const subDetail = item.packageSize || item.unitPrice || item.category;

    return (
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [
          styles.card,
          width ? { width } : { flex: 1 },
          pressed && styles.cardPressed,
        ]}
      >
        {/* Square Rounded Image Box */}
        <View style={styles.imageBox}>
          {item.imageUrl && !imgError ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <Image
              source={getCategoryFallbackImage(item.category)}
              style={styles.fallbackCoverImage}
              resizeMode="cover"
            />
          )}

          {/* Top-left snag discount badge */}
          {badgeLabel && (
            <View
              style={[
                styles.discBadge,
                isHalf ? styles.discBadgeHalf : styles.discBadgeBlue,
              ]}
            >
              <Text
                style={[
                  styles.discBadgeText,
                  isHalf ? styles.discBadgeTextDark : styles.discBadgeTextLight,
                ]}
                numberOfLines={1}
              >
                {badgeLabel}
              </Text>
            </View>
          )}

          {/* Bottom-right floating + / stepper pill */}
          {quantity > 0 ? (
            <View style={[styles.stepperPill, styles.stepperPillActive]}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onDecrement(item);
                }}
                hitSlop={8}
                style={styles.stepIconBtn}
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={16} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.stepQtyText}>{quantity}</Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onIncrement(item);
                }}
                hitSlop={8}
                style={styles.stepIconBtn}
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onIncrement(item);
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.addCircle,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
              accessibilityLabel="Add to shopping list"
            >
              <Ionicons name="add" size={20} color={COLORS.blue} />
            </Pressable>
          )}
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.priceNow}>${item.price.toFixed(2)}</Text>
          {item.wasPrice !== null && item.wasPrice > item.price && (
            <Text style={styles.wasPrice}>${item.wasPrice.toFixed(2)}</Text>
          )}
        </View>

        {/* Product Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Store Monogram Dot + Store Name + Size */}
        <View style={styles.subRow}>
          <View
            style={[styles.storeDot, { backgroundColor: storeTheme.primary }]}
          >
            <Text style={styles.storeDotText}>{storeTheme.mono[0]}</Text>
          </View>
          <Text style={styles.subText} numberOfLines={1}>
            {storeTheme.shortName}
            {subDetail ? ` · ${subDetail}` : ''}
          </Text>
        </View>

        {/* Compact Local Store Stock Indicator */}
        {typeof item.inStock === 'boolean' && (
          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockIndicatorDot,
                {
                  backgroundColor: item.inStock ? COLORS.green : COLORS.hot,
                },
              ]}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.stockLabelText,
                { color: item.inStock ? COLORS.green : COLORS.hot },
              ]}
            >
              {item.stockLabel || (item.inStock ? 'In Stock' : 'Out of Stock')}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '84%',
    height: '84%',
  },
  fallbackCoverImage: {
    width: '100%',
    height: '100%',
  },
  discBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discBadgeBlue: {
    backgroundColor: COLORS.blue,
  },
  discBadgeHalf: {
    backgroundColor: COLORS.yellow,
    transform: [{ rotate: '-4deg' }],
  },
  discBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  discBadgeTextLight: {
    color: '#FFFFFF',
  },
  discBadgeTextDark: {
    color: COLORS.ink,
  },
  addCircle: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  stepperPill: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    height: 36,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  stepperPillActive: {
    backgroundColor: COLORS.blue,
  },
  stepIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQtyText: {
    minWidth: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 9,
  },
  priceNow: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.blue,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  wasPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.faint,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 18.5,
    marginTop: 2,
    letterSpacing: -0.15,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  storeDot: {
    width: 15,
    height: 15,
    borderRadius: 4.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeDotText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  subText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.muted,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    marginTop: 3,
  },
  stockIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockLabelText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
});
