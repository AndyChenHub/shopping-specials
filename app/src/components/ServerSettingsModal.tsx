import React, { useEffect, useState } from 'react';
import {
  Modal,
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
            <Text style={styles.title}>Companion Server</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.desc}>
            On local Wi-Fi, the app automatically connects to your PC running{' '}
            <Text style={styles.code}>npm run server</Text>:
          </Text>

          <View style={styles.autoBox}>
            <Ionicons name="wifi" size={16} color={COLORS.accent} />
            <Text style={styles.autoUrlText}>{autoUrl}</Text>
          </View>

          <Text style={styles.label}>Custom Backend URL (Optional)</Text>
          <TextInput
            value={customUrl}
            onChangeText={setCustomUrl}
            placeholder={autoUrl}
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />

          <View style={styles.actions}>
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetText}>Use Auto-Detect</Text>
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
  desc: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  code: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  autoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
  },
  autoUrlText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    fontSize: 14.5,
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
