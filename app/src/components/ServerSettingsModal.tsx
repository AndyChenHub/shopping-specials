import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
import {
  AussieSpecialsBackupPayload,
  exportAllUserSettingsJson,
  importAllUserSettingsJson,
} from '../services/savedStorage';
import {
  APP_VERSION_INFO,
  IpaReleaseCheckResult,
} from '../services/versionChecker';

interface ServerSettingsModalProps {
  visible: boolean;
  releaseCheck: IpaReleaseCheckResult | null;
  checkingRelease: boolean;
  onCheckRelease: () => void;
  onClose: () => void;
  onSaved: () => void;
  onBackupRestored?: (restored: AussieSpecialsBackupPayload) => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  visible,
  releaseCheck,
  checkingRelease,
  onCheckRelease,
  onClose,
  onSaved,
  onBackupRestored,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [showRestoreBox, setShowRestoreBox] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const autoUrl = getAutoDetectedBaseUrl();
  const activeMode = getLastActiveDataSource();

  useEffect(() => {
    if (visible) {
      getCustomApiBaseUrlRaw().then(setCustomUrl);
      setBackupNotice(null);
      setBackupError(null);
      setShowRestoreBox(false);
    }
  }, [visible]);

  const handleExportBackup = async () => {
    try {
      setBackupError(null);
      const json = await exportAllUserSettingsJson();
      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(json);
        setBackupNotice('Settings backup copied to clipboard.');
        return;
      }
      await Share.share({
        title: 'Aussie Specials Preferences Backup',
        message: json,
      });
      setBackupNotice('Backup ready to save or share.');
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : 'Could not export backup'
      );
    }
  };

  const handleImportBackup = async () => {
    if (!restoreJson.trim()) {
      setBackupError('Paste exported backup JSON above first.');
      return;
    }
    try {
      setBackupError(null);
      const restored = await importAllUserSettingsJson(restoreJson);
      await getCustomApiBaseUrlRaw(true);
      setCustomUrl(restored.customApiUrl || '');
      onBackupRestored?.(restored);
      setRestoreJson('');
      setShowRestoreBox(false);
      setBackupNotice('Preferences, local stores & shopping list restored!');
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : 'Invalid backup JSON'
      );
    }
  };

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

  const allReleasesUrl =
    releaseCheck?.allReleasesUrl ||
    `https://github.com/${APP_VERSION_INFO.repo}/releases`;

  const handleDownloadIpa = () => {
    const target = releaseCheck?.ipaDownloadUrl || releaseCheck?.releaseUrl || allReleasesUrl;
    Linking.openURL(target);
  };

  const handleSideStoreInstall = () => {
    if (!releaseCheck?.ipaDownloadUrl) return;
    const encoded = encodeURIComponent(releaseCheck.ipaDownloadUrl);
    Linking.openURL(`sidestore://install?url=${encoded}`).catch(() => {
      Linking.openURL(`altstore://install?url=${encoded}`).catch(() => {
        Linking.openURL(releaseCheck.ipaDownloadUrl!);
      });
    });
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
            <Text style={styles.title}>App Version & Settings</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Version & IPA Release Control */}
            <View style={styles.versionCard}>
              <View style={styles.versionHeaderRow}>
                <View>
                  <Text style={styles.sectionKicker}>INSTALLED IPA VERSION</Text>
                  <Text style={styles.versionTitle}>
                    v{APP_VERSION_INFO.version}{' '}
                    <Text style={styles.buildSub}>
                      (Build {APP_VERSION_INFO.buildNumber})
                    </Text>
                  </Text>
                  <Text style={styles.commitMeta}>
                    Commit: {APP_VERSION_INFO.gitSha}
                  </Text>
                </View>

                <Pressable
                  onPress={onCheckRelease}
                  disabled={checkingRelease}
                  style={styles.checkUpdateBtn}
                >
                  {checkingRelease ? (
                    <ActivityIndicator size="small" color={COLORS.accent} />
                  ) : (
                    <>
                      <Ionicons
                        name="refresh-outline"
                        size={15}
                        color={COLORS.accent}
                      />
                      <Text style={styles.checkUpdateText}>Check Update</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {releaseCheck?.hasUpdate ? (
                <View style={styles.updateAvailableBox}>
                  <View style={styles.updateTitleRow}>
                    <Ionicons name="sparkles" size={16} color={COLORS.accent} />
                    <Text style={styles.updateTitleText}>
                      New Release {releaseCheck.latestTag} Available!
                    </Text>
                  </View>
                  <Text style={styles.updateSubText}>
                    {releaseCheck.ipaFileName || 'Updated iOS .ipa'}
                    {releaseCheck.ipaSizeMb ? ` • ${releaseCheck.ipaSizeMb} MB` : ''}
                  </Text>

                  <View style={styles.updateActionsRow}>
                    <Pressable
                      onPress={handleDownloadIpa}
                      style={styles.downloadIpaBtn}
                    >
                      <Ionicons
                        name="download-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.downloadIpaText}>Download .ipa</Text>
                    </Pressable>

                    {Platform.OS === 'ios' && releaseCheck.ipaDownloadUrl && (
                      <Pressable
                        onPress={handleSideStoreInstall}
                        style={styles.sidestoreBtn}
                      >
                        <Text style={styles.sidestoreText}>
                          SideStore / AltStore
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : releaseCheck ? (
                <View style={styles.upToDateRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={COLORS.savingsText}
                  />
                  <Text style={styles.upToDateText}>
                    {releaseCheck.noReleasesYet
                      ? 'First GitHub Release is building or not published yet.'
                      : `Up to date (latest release: ${releaseCheck.latestTag})`}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={() => Linking.openURL(allReleasesUrl)}
                style={styles.releasesLinkBtn}
              >
                <Ionicons
                  name="git-branch-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.releasesLinkText}>
                  View All Versioned .ipa Releases on GitHub
                </Text>
                <Ionicons
                  name="open-outline"
                  size={14}
                  color={COLORS.textMuted}
                />
              </Pressable>
            </View>

            {/* Preferences & Update Persistence Card */}
            <View style={styles.versionCard}>
              <View style={styles.persistHeaderRow}>
                <Ionicons
                  name="shield-checkmark"
                  size={17}
                  color={COLORS.savingsText}
                />
                <Text style={styles.statusTitle}>
                  Preferences Preserved Across Updates
                </Text>
              </View>
              <Text style={styles.statusSub}>
                Installing a newer .ipa over Aussie Specials keeps your saved
                local stores, favourites, filters, and shopping list intact. You
                can also export or restore a backup anytime:
              </Text>

              <View style={styles.backupActionsRow}>
                <Pressable
                  onPress={handleExportBackup}
                  style={styles.backupBtn}
                >
                  <Ionicons
                    name="share-outline"
                    size={15}
                    color={COLORS.accent}
                  />
                  <Text style={styles.backupBtnText}>Export Backup</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowRestoreBox((v) => !v);
                    setBackupError(null);
                  }}
                  style={styles.backupBtnSecondary}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={15}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.backupBtnSecondaryText}>
                    {showRestoreBox ? 'Cancel' : 'Restore Backup'}
                  </Text>
                </Pressable>
              </View>

              {showRestoreBox && (
                <View style={styles.restoreWrap}>
                  <TextInput
                    value={restoreJson}
                    onChangeText={setRestoreJson}
                    placeholder="Paste exported Aussie Specials backup JSON…"
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.restoreInput}
                  />
                  <Pressable
                    onPress={handleImportBackup}
                    style={styles.saveBtn}
                  >
                    <Text style={[styles.saveText, { textAlign: 'center' }]}>
                      Apply Restored Settings
                    </Text>
                  </Pressable>
                </View>
              )}

              {backupNotice && (
                <Text style={styles.backupSuccessText}>{backupNotice}</Text>
              )}
              {backupError && (
                <Text style={styles.backupErrorText}>{backupError}</Text>
              )}
            </View>

            {/* Data Source Status */}
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
                Leave blank for standalone on-device sync, or enter an optional
                companion server URL:
              </Text>
            )}

            <Text style={styles.label}>Custom Companion Server URL (Optional)</Text>
            <TextInput
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder={
                Platform.OS === 'web'
                  ? autoUrl
                  : 'Blank = Standalone On-Device Sync'
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
          </ScrollView>
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
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
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
  scrollBody: {
    gap: 12,
    paddingBottom: 4,
  },
  versionCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  versionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  versionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  buildSub: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  commitMeta: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
  },
  checkUpdateText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  updateAvailableBox: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C5D9FC',
    gap: 6,
  },
  updateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateTitleText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.accent,
  },
  updateSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  updateActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  downloadIpaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadIpaText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  sidestoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  sidestoreText: {
    color: COLORS.accent,
    fontSize: 12.5,
    fontWeight: '700',
  },
  upToDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upToDateText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.savingsText,
    flex: 1,
  },
  releasesLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  releasesLinkText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
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
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
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
    marginTop: 4,
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
  persistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backupActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: COLORS.accentSoft,
  },
  backupBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.accent,
  },
  backupBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backupBtnSecondaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  restoreWrap: {
    gap: 8,
    marginTop: 4,
  },
  restoreInput: {
    minHeight: 78,
    maxHeight: 130,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    textAlignVertical: 'top',
  },
  backupSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.savingsText,
  },
  backupErrorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
