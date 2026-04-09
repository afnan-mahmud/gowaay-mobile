import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import SpInAppUpdates, {
  NeedsUpdateResponse,
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';
import { Colors } from '../constants/colors';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gowaay';
const APP_STORE_URL = 'https://apps.apple.com/app/gowaay/id__YOUR_APP_ID__';

const inAppUpdates = new SpInAppUpdates(false);

export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [storeVersion, setStoreVersion] = useState('');

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      const result: NeedsUpdateResponse = await inAppUpdates.checkNeedsUpdate();

      if (result.shouldUpdate) {
        setStoreVersion(result.storeVersion);

        if (Platform.OS === 'android') {
          const updateOptions: StartUpdateOptions = {
            updateType: IAUUpdateKind.FLEXIBLE,
          };
          try {
            await inAppUpdates.startUpdate(updateOptions);
          } catch {
            // If the native in-app update flow is dismissed or fails,
            // fall back to showing our custom modal
            setUpdateAvailable(true);
          }
        } else {
          setUpdateAvailable(true);
        }
      }
    } catch (err) {
      console.log('Update check failed:', err);
    }
  };

  const handleUpdate = () => {
    const url = Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
    Linking.openURL(url);
    setUpdateAvailable(false);
  };

  const handleLater = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <Modal transparent animationType="fade" visible={updateAvailable}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🚀</Text>
          </View>

          <Text style={styles.title}>নতুন আপডেট এসেছে!</Text>
          <Text style={styles.subtitle}>
            GoWaay এর নতুন ভার্সন {storeVersion} পাওয়া যাচ্ছে। আরও ভালো
            অভিজ্ঞতার জন্য এখনই আপডেট করুন।
          </Text>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
            activeOpacity={0.85}>
            <Text style={styles.updateButtonText}>এখনই আপডেট করুন</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={handleLater}
            activeOpacity={0.7}>
            <Text style={styles.laterButtonText}>পরে করবো</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brandLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  updateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  laterButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
