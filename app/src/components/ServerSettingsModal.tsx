import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import {
  getAutoDetectedBaseUrl,
  getCustomApiBaseUrlRaw,
  getLastActiveDataSource,
  setCustomApiBaseUrl,
} from '../services/api';

interface ServerSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const autoUrl = getAutoDetectedBaseUrl();
  const activeMode = getLastActiveDataSource();

  useEffect(() => {
    if (visible) {
      getCustomApiBaseUrlRaw().then(setCustomUrl);
    }
  }, [visible]);

  const handleSave = async () => {
    await setCustomApiBaseUrl(customUrl);
    onSaved();
    onClose();
  };

  const handleReset = async () => {
    setCustomUrl('');
    await setCustomApiBaseUrl(null);
    onSaved();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Data Source & Sync</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <View
            style={[
              styles.statusBox,
              activeMode === 'on-device'
                ? styles.statusOnDevice
                : styles.statusServer,
            ]}
          >
            <Ionicons
              name={
                activeMode === 'on-device'
                  ? 'phone-portrait-outline'
                  : 'server-outline'
              }
              size={18}
              color={activeMode === 'on-device' ? '#137A36' : COLORS.accent}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {activeMode === 'on-device'
                  ? 'Standalone On-Device Sync Active'
                  : 'Companion Server Connected'}
              </Text>
              <Text style={styles.statusSub}>
                {activeMode === 'on-device'
                  ? 'Downloads Woolworths, Coles & ALDI specials directly on your iPhone (works on 4G/5G & Wi-Fi with no PC needed).'
                  : `Connected to ${customUrl || autoUrl}`}
              </Text>
            </View>
          </View>

          {Platform.OS !== 'web' && (
            <Text style={styles.desc}>
              Leave the field below blank to let your iPhone fetch specials
              standalone anywhere, or enter a companion server URL (e.g.{' '}
              <Text style={styles.code}>http://192.168.1.50:3001</Text>):
            </Text>
          )}

          <Text style={styles.label}>Custom Companion Server URL (Optional)</Text>
          <TextInput
            value={customUrl}
            onChangeText={setCustomUrl}
            placeholder={
              Platform.OS === 'web' ? autoUrl : 'Blank = Standalone On-Device Sync'
            }
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />

          <View style={styles.actions}>
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetText}>
                {Platform.OS === 'web' ? 'Reset Default' : 'Use Standalone / Auto'}
              </Text>
            </Pressable>
            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusOnDevice: {
    backgroundColor: COLORS.savingsBg,
    borderColor: '#B9E2C7',
  },
  statusServer: {
    backgroundColor: COLORS.accentSoft,
    borderColor: '#C5D9FC',
  },
  statusTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  code: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  resetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSubtle,
  },
  resetText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13.5,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
});
