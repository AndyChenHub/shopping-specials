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

interface HeaderBarProps {
  totalDeals: number;
  lastSyncedAt: string | null;
  syncing: boolean;
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
  onSyncPress,
  onSettingsPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="pricetag" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Aussie Specials</Text>
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {totalDeals > 0 ? `${totalDeals} specials • ` : ''}
          {syncing ? 'Downloading catalogues from web…' : formatRelativeTime(lastSyncedAt)}
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
          accessibilityLabel="Server connection settings"
        >
          <Ionicons name="server-outline" size={19} color={COLORS.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: COLORS.surface,
  },
  titleBlock: {
    flex: 1,
    marginRight: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
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
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
