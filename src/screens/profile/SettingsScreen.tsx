/**
 * Settings Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';
import Card from '../../components/Card';
import Icon, { IconFamily } from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import NotificationService from '../../services/NotificationService';

const SETTINGS_KEY = 'NOTIFICATION_SETTINGS';

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingReminders: boolean;
  promotionalEmails: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  bookingReminders: true,
  promotionalEmails: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

export default function SettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Load persisted settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        }
      } catch {
        // Use defaults on error
      }
    };
    loadSettings();
  }, []);

  // Persist and apply settings when toggled
  const handleToggle = useCallback(async (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch {
      // Silently fail - settings will work for current session
    }

    // If push notifications toggled, register or clear FCM token
    if (key === 'pushNotifications') {
      if (newSettings.pushNotifications) {
        // Re-enable: re-initialize to get and register token
        const success = await NotificationService.initialize();
        if (success) {
          Toast.show({ type: 'success', title: 'Push notifications enabled' });
        } else {
          Toast.show({ type: 'error', title: 'Could not enable push notifications', message: 'Please check your device notification settings.' });
        }
      } else {
        // Disable: clear FCM token so backend stops sending
        await NotificationService.clearToken();
        Toast.show({ type: 'info', title: 'Push notifications disabled' });
      }
    }
  }, [settings]);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This includes cached images.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              FastImage.clearDiskCache();
              FastImage.clearMemoryCache();
              Toast.show({ type: 'success', title: 'Cache Cleared', message: 'Image cache has been cleared.' });
            } catch {
              Toast.show({ type: 'error', title: 'Failed to clear cache' });
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({
    iconName,
    iconFamily,
    title,
    subtitle,
    value,
    onToggle,
  }: {
    iconName: string;
    iconFamily?: IconFamily;
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Icon name={iconName} family={iconFamily} size={20} color={Colors.brand} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.gray300, true: Colors.brand }}
        thumbColor={Colors.white}
      />
    </View>
  );

  const MenuButton = ({
    iconName,
    iconFamily,
    title,
    subtitle,
    onPress,
    danger,
  }: {
    iconName: string;
    iconFamily?: IconFamily;
    title: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Icon name={iconName} family={iconFamily} size={20} color={danger ? Colors.error : Colors.brand} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <Icon name="chevron-forward-outline" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Notifications */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          iconName="notifications-outline"
          title="Push Notifications"
          subtitle="Receive push notifications"
          value={settings.pushNotifications}
          onToggle={() => handleToggle('pushNotifications')}
        />
        <SettingItem
          iconName="mail-outline"
          title="Email Notifications"
          subtitle="Receive email updates"
          value={settings.emailNotifications}
          onToggle={() => handleToggle('emailNotifications')}
        />
        <SettingItem
          iconName="phone-portrait-outline"
          title="SMS Notifications"
          subtitle="Receive SMS alerts"
          value={settings.smsNotifications}
          onToggle={() => handleToggle('smsNotifications')}
        />
        <SettingItem
          iconName="alarm-outline"
          title="Booking Reminders"
          subtitle="Get reminders for upcoming bookings"
          value={settings.bookingReminders}
          onToggle={() => handleToggle('bookingReminders')}
        />
        <SettingItem
          iconName="gift-outline"
          title="Promotional Emails"
          subtitle="Receive special offers and deals"
          value={settings.promotionalEmails}
          onToggle={() => handleToggle('promotionalEmails')}
        />
      </Card>

      {/* App Settings */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <SettingItem
          iconName="volume-high-outline"
          title="Sound"
          subtitle="Enable notification sounds"
          value={settings.soundEnabled}
          onToggle={() => handleToggle('soundEnabled')}
        />
        <SettingItem
          iconName="phone-portrait-outline"
          title="Vibration"
          subtitle="Enable vibration feedback"
          value={settings.vibrationEnabled}
          onToggle={() => handleToggle('vibrationEnabled')}
        />
      </Card>

      {/* Data & Storage */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>
        <MenuButton
          iconName="trash-outline"
          title="Clear Cache"
          subtitle="Free up storage space"
          onPress={handleClearCache}
        />
        <MenuButton
          iconName="download-outline"
          title="Download Settings"
          subtitle="Manage offline content"
          onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
        />
      </Card>
      
      {/* Privacy & Security */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <MenuButton
          iconName="document-text-outline"
          title="Privacy Policy"
          subtitle="View our privacy policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <MenuButton
          iconName="reader-outline"
          title="Terms of Service"
          subtitle="Read terms and conditions"
          onPress={() => navigation.navigate('TermsOfService')}
        />
        <MenuButton
          iconName="shield-checkmark-outline"
          title="Security"
          subtitle="Manage your security settings"
          onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
        />
      </Card>

      {/* Danger Zone */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <MenuButton
          iconName="warning-outline"
          title="Delete Account"
          subtitle="Permanently delete your account"
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Coming Soon', 'This feature will be available soon');
                  },
                },
              ]
            );
          }}
          danger
        />
      </Card>

      <View style={{ height: Theme.spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  card: { marginHorizontal: 16, marginTop: 20, marginBottom: 0 },
  sectionTitle: {
    fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 0,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  menuButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  dangerText: { color: Colors.error },
});
