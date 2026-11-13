import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { APP_VERSION_INFO } from '../services/versionChecker';
import { UserStoreLocation } from '../types/specials';

interface HeaderBarProps {
  totalDeals: number;
  lastSyncedAt: string | null;
  syncing: boolean;
  hasAppUpdate?: boolean;
  userLocation: UserStoreLocation | null;
  onLocationPress: () => void;
  onSyncPress: () => void;
  onSettingsPress: () => void;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Not synced yet';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 45) return 'Updated just now';
  if (diffSec < 3600) return `Updated ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `Updated ${Math.floor(diffSec / 3600)}h ago`;
  return `Updated ${new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  })}`;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  totalDeals,
  lastSyncedAt,
  syncing,
  hasAppUpdate = false,
  userLocation,
  onLocationPress,
  onSyncPress,
  onSettingsPress,
}) => {
  const storeNamesSummary = userLocation
    ? [
        userLocation.igaStore?.name,
        userLocation.woolworthsStore?.name,
        userLocation.aldiStore?.name,
      ]
        .filter(Boolean)
        .join(' • ')
    : '';

  return (
    <View style={styles.outerWrap}>
      <View style={styles.container}>
        <View style={styles.titleBlock}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="pricetag" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Aussie Specials</Text>
            <Pressable
              onPress={onSettingsPress}
              hitSlop={6}
              style={[
                styles.versionPill,
                hasAppUpdate && styles.versionPillUpdate,
              ]}
            >
              <Text
                style={[
                  styles.versionPillText,
                  hasAppUpdate && styles.versionPillTextUpdate,
                ]}
              >
                v{APP_VERSION_INFO.version}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {totalDeals > 0 ? `${totalDeals} items • ` : ''}
            {syncing ? 'Downloading items & specials…' : formatRelativeTime(lastSyncedAt)}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onSyncPress}
            disabled={syncing}
            style={({ pressed }) => [
              styles.syncButton,
              pressed && styles.buttonPressed,
              syncing && styles.syncButtonDisabled,
            ]}
            accessibilityLabel="Download latest specials from web"
          >
            {syncing ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Ionicons name="cloud-download-outline" size={17} color={COLORS.accent} />
            )}
            <Text style={styles.syncButtonText}>{syncing ? 'Syncing' : 'Sync'}</Text>
          </Pressable>

          <Pressable
            onPress={onSettingsPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            accessibilityLabel="App version and settings"
          >
            <Ionicons name="settings-outline" size={19} color={COLORS.textSecondary} />
            {hasAppUpdate && <View style={styles.updateDot} />}
          </Pressable>
        </View>
      </View>

      {/* Local Store & Stock Selector Bar */}
      <Pressable
        onPress={onLocationPress}
        style={({ pressed }) => [
          styles.locationBar,
          userLocation ? styles.locationBarActive : styles.locationBarEmpty,
          pressed && styles.buttonPressed,
        ]}
        accessibilityLabel="Set postcode and local supermarket stores"
      >
        <Ionicons
          name={userLocation ? 'location' : 'location-outline'}
          size={15}
          color={userLocation ? COLORS.savingsText : COLORS.accent}
        />
        <Text
          style={[
            styles.locationBarText,
            userLocation && styles.locationBarTextActive,
          ]}
          numberOfLines={1}
        >
          {userLocation
            ? `${userLocation.suburb}, ${userLocation.state} ${userLocation.postcode}${
                storeNamesSummary ? ` • ${storeNamesSummary}` : ''
              }`
            : 'Set postcode / local store to check nearby stock'}
        </Text>
        <View
          style={[
            styles.locationActionChip,
            userLocation && styles.locationActionChipActive,
          ]}
        >
          <Text
            style={[
              styles.locationActionText,
              userLocation && styles.locationActionTextActive,
            ]}
          >
            {userLocation ? 'Change' : 'Set Store'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    backgroundColor: COLORS.surface,
    paddingBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
  },
  titleBlock: {
    flex: 1,
    marginRight: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#178841',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  versionPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSubtle,
  },
  versionPillUpdate: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  versionPillTextUpdate: {
    color: COLORS.accent,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
  },
  syncButtonDisabled: {
    opacity: 0.75,
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  updateDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 16,
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationBarEmpty: {
    backgroundColor: COLORS.accentSoft,
    borderColor: '#CEE0FD',
  },
  locationBarActive: {
    backgroundColor: COLORS.savingsBg,
    borderColor: '#CBEBD6',
  },
  locationBarText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  locationBarTextActive: {
    color: COLORS.textPrimary,
  },
  locationActionChip: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  locationActionChipActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBEBD6',
  },
  locationActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locationActionTextActive: {
    color: COLORS.savingsText,
  },
});
