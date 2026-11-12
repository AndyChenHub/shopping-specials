import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import { SpecialItem } from '../types/specials';

interface SpecialCardProps {
  item: SpecialItem;
  isSaved: boolean;
  onPress: (item: SpecialItem) => void;
  onToggleSave: (item: SpecialItem) => void;
}

export const SpecialCard: React.FC<SpecialCardProps> = React.memo(
  ({ item, isSaved, onPress, onToggleSave }) => {
    const [imgError, setImgError] = useState(false);
    const storeTheme = STORE_THEMES[item.store] || STORE_THEMES.woolworths;

    const badgeLabel = item.isHalfPrice
      ? item.discountPercent && item.discountPercent > 52
        ? `${item.discountPercent}% OFF`
        : '½ PRICE'
      : item.promoText || 'SPECIAL';

    return (
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {/* Top Row: Store Pill + Bookmark Button */}
        <View style={styles.topRow}>
          <View style={[styles.storeBadge, { backgroundColor: storeTheme.primary }]}>
            <Text style={styles.storeBadgeText}>{storeTheme.name}</Text>
          </View>

          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleSave(item);
            }}
            hitSlop={10}
            style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
            accessibilityLabel={isSaved ? 'Remove from saved specials' : 'Save special'}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isSaved ? COLORS.accent : COLORS.textSecondary}
            />
          </Pressable>
        </View>

        {/* Product Image */}
        <View style={styles.imageBox}>
          {item.imageUrl && !imgError ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="basket-outline" size={36} color={COLORS.textMuted} />
            </View>
          )}

          {/* Promo / Half-Price Pill */}
          <View
            style={[
              styles.promoPill,
              item.isHalfPrice ? styles.promoPillHalf : styles.promoPillStandard,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.promoPillText,
                item.isHalfPrice ? styles.promoTextHalf : styles.promoTextStandard,
              ]}
            >
              {badgeLabel.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.body}>
          <Text style={styles.categoryLabel} numberOfLines={1}>
            {item.category}
          </Text>

          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.spacer} />

          {/* Price Block */}
          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              <Text style={styles.priceNow}>${item.price.toFixed(2)}</Text>
              {item.wasPrice !== null && item.wasPrice > item.price && (
                <Text style={styles.wasPrice}>${item.wasPrice.toFixed(2)}</Text>
              )}
            </View>

            {item.saveAmount !== null && item.saveAmount > 0 ? (
              <Text style={styles.saveText}>Save ${item.saveAmount.toFixed(2)}</Text>
            ) : item.unitPrice ? (
              <Text style={styles.unitPriceText} numberOfLines={1}>
                {item.unitPrice}
              </Text>
            ) : null}

            {item.saveAmount !== null && item.saveAmount > 0 && item.unitPrice ? (
              <Text style={styles.unitPriceText} numberOfLines={1}>
                {item.unitPrice}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  storeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  storeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  saveBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: {
    backgroundColor: COLORS.accentSoft,
  },
  imageBox: {
    height: 126,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  promoPill: {
    position: 'absolute',
    left: 10,
    bottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    maxWidth: '88%',
  },
  promoPillHalf: {
    backgroundColor: COLORS.halfPriceBg,
  },
  promoPillStandard: {
    backgroundColor: COLORS.savingsBg,
    borderWidth: 1,
    borderColor: '#CBEBD6',
  },
  promoPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.25,
  },
  promoTextHalf: {
    color: COLORS.halfPriceText,
  },
  promoTextStandard: {
    color: COLORS.savingsText,
  },
  body: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  spacer: {
    flex: 1,
    minHeight: 6,
  },
  priceBlock: {
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  priceNow: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  wasPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  saveText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.savingsText,
    marginTop: 1,
  },
  unitPriceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
