import React from 'react';
import {
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
import { SpecialItem } from '../types/specials';

interface SpecialDetailModalProps {
  item: SpecialItem | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (item: SpecialItem) => void;
}

export const SpecialDetailModal: React.FC<SpecialDetailModalProps> = ({
  item,
  isSaved,
  onClose,
  onToggleSave,
}) => {
  if (!item) return null;

  const storeTheme = STORE_THEMES[item.store] || STORE_THEMES.woolworths;

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

            {/* Promo Badge */}
            <View style={styles.badgesRow}>
              {item.isHalfPrice && (
                <View style={styles.halfPriceBadge}>
                  <Ionicons name="flash" size={14} color={COLORS.halfPriceText} />
                  <Text style={styles.halfPriceBadgeText}>
                    {item.promoText || '½ Price Special'}
                  </Text>
                </View>
              )}
              {!item.isHalfPrice && item.promoText && (
                <View style={styles.standardBadge}>
                  <Text style={styles.standardBadgeText}>{item.promoText}</Text>
                </View>
              )}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>

            {item.packageSize && (
              <Text style={styles.packageSize}>Pack size: {item.packageSize}</Text>
            )}

            {/* Price Summary Card */}
            <View style={styles.priceCard}>
              <View>
                <Text style={styles.priceLabel}>Special Price</Text>
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
                {isSaved ? 'Saved in Shortlist' : 'Save Special'}
              </Text>
            </Pressable>

            {item.productUrl && (
              <Pressable onPress={handleOpenWeb} style={styles.secondaryButton}>
                <Ionicons name="open-outline" size={18} color={COLORS.textPrimary} />
                <Text style={styles.secondaryButtonText}>View Web Listing</Text>
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
    maxHeight: Platform.OS === 'ios' ? '100%' : '90%',
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
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
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
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 27,
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
    fontSize: 32,
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
  metaBox: {
    gap: 8,
    paddingTop: 4,
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
