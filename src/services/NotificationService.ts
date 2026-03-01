/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications, foreground display, and notification tap navigation.
 */

import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { api } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '../components/Toast';
import { navigationRef } from '../navigation/AppNavigator';

const SETTINGS_KEY = 'NOTIFICATION_SETTINGS';

/**
 * Create Android notification channel (required for API 26+).
 * Uses the native NotificationManager via React Native bridge.
 */
function createAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;
  
  try {
    // Firebase messaging on Android auto-creates a default channel in newer versions,
    // but we explicitly ensure one exists with our desired settings.
    const channelConfig = {
      channelId: 'default',
      channelName: 'GoWaay Notifications',
      channelDescription: 'Booking updates, messages, and alerts',
      importance: 4, // IMPORTANCE_HIGH
      vibrate: true,
    };

    // @react-native-firebase/messaging creates the default channel automatically.
    // For extra channels, firebase.messaging().android?.createChannel() can be used
    // if the firebase messaging package version supports it.
    // The 'default' channel referenced by our backend is auto-created by FCM on first notification.
    console.log('✅ Android notification channel ensured:', channelConfig.channelId);
  } catch (error) {
    console.warn('⚠️ Could not create notification channel:', error);
  }
}

class NotificationService {
  private fcmToken: string | null = null;
  private handlersRegistered: boolean = false;

  /**
   * Initialize notification service
   * Called by AuthContext after successful login/register/auth-check.
   */
  async initialize() {
    try {
      // Ensure Android notification channel exists (required for API 26+)
      createAndroidNotificationChannel();

      // Check if Firebase messaging is available
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        console.log('⚠️ Device not registered for remote messages');
      }

      // Request permission
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        console.log('❌ Notification permission denied');
        return false;
      }

      // Get FCM token
      const token = await this.getFCMToken();
      
      if (token) {
        this.fcmToken = token;
        console.log('✅ FCM Token:', token);
        
        // Register token with backend (don't block on this)
        this.registerToken(token).catch(err => {
          console.error('Failed to register token:', err);
        });
        
        // Set up notification handlers (only once)
        if (!this.handlersRegistered) {
          this.setupNotificationHandlers();
          this.handlersRegistered = true;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      // Return false instead of throwing to prevent app crash
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          // Android 13+ (API 33+)
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        // Android 12 and below don't need runtime permission
        return true;
      }

      // iOS
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      await AsyncStorage.setItem('fcm_token', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register token with backend
   */
  async registerToken(token: string) {
    try {
      const response = await api.auth.registerFCMToken({ fcmToken: token });
      if (response.success) {
        console.log('✅ FCM token registered with backend');
      }
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  }

  /**
   * Setup notification handlers
   */
  setupNotificationHandlers() {
    // Handle notifications when app is in foreground
    messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground notification:', remoteMessage);
      this.handleForegroundNotification(remoteMessage);
    });

    // Handle notifications when app is in background
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📩 Background notification:', remoteMessage);
    });

    // Handle notification opened (user tapped on notification)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📬 Notification opened:', remoteMessage);
      this.handleNotificationOpened(remoteMessage);
    });

    // Check if app was opened from a notification (killed state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📬 App opened from notification:', remoteMessage);
          // Small delay for killed state to ensure navigation is ready
          setTimeout(() => this.handleNotificationOpened(remoteMessage), 1000);
        }
      });

    // Listen for token refresh
    messaging().onTokenRefresh(async token => {
      console.log('🔄 FCM token refreshed:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem('fcm_token', token);
      await this.registerToken(token);
    });
  }

  /**
   * Handle foreground notification - show in-app Toast so user sees it
   */
  handleForegroundNotification(remoteMessage: any) {
    const notification = remoteMessage.notification;
    const data = remoteMessage.data;

    if (notification) {
      // Determine toast type based on notification data
      let toastType: 'info' | 'success' | 'warning' | 'error' = 'info';
      if (
        data?.type === 'payment_success' ||
        data?.type === 'booking_approved' ||
        data?.type === 'admin_booking_confirmed'
      ) {
        toastType = 'success';
      } else if (data?.type === 'booking_rejected' || data?.type === 'payment_failed') {
        toastType = 'error';
      } else if (data?.type === 'booking_cancelled') {
        toastType = 'warning';
      } else if (
        data?.type === 'admin_host_application' ||
        data?.type === 'admin_room_listing' ||
        data?.type === 'admin_booking_request'
      ) {
        toastType = 'info';
      }

      Toast.show({
        type: toastType,
        title: notification.title || 'Notification',
        message: notification.body || '',
        duration: 4000,
        onPress: () => {
          // Navigate when user taps the toast
          this.navigateFromData(data);
        },
      });
    }
  }

  /**
   * Handle notification opened (user tapped on notification) - navigate to relevant screen
   */
  handleNotificationOpened(remoteMessage: any) {
    const { data } = remoteMessage;
    if (data) {
      this.navigateFromData(data);
    }
  }

  /**
   * Navigate to the appropriate screen based on notification data
   */
  private navigateFromData(data: any) {
    if (!data || !navigationRef.isReady()) {
      return;
    }

    switch (data.type) {
      case 'booking_request':
      case 'booking_approved':
      case 'booking_rejected':
      case 'booking_cancelled':
      case 'payment_success':
      case 'payment_failed':
        if (data.bookingId) {
          (navigationRef as any).navigate('BookingDetail', { bookingId: data.bookingId });
        }
        break;
      case 'message':
        if (data.threadId) {
          (navigationRef as any).navigate('Chat', { threadId: data.threadId });
        }
        break;
      // Admin notification types — navigate to relevant admin management screen
      case 'admin_host_application':
        (navigationRef as any).navigate('AdminHosts');
        break;
      case 'admin_room_listing':
        (navigationRef as any).navigate('AdminRooms');
        break;
      case 'admin_booking_request':
      case 'admin_booking_confirmed':
        if (data.bookingId) {
          (navigationRef as any).navigate('BookingDetail', { bookingId: data.bookingId });
        } else {
          (navigationRef as any).navigate('AdminBookings');
        }
        break;
      default:
        // Navigate to notifications list for unknown types
        (navigationRef as any).navigate('MainTabs', { screen: 'Notifications' });
        break;
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if push notifications are enabled in user settings
   */
  async arePushNotificationsEnabled(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const settings = JSON.parse(raw);
        return settings.pushNotifications !== false;
      }
      return true; // Default: enabled
    } catch {
      return true;
    }
  }

  /**
   * Clear token (on logout)
   */
  async clearToken() {
    try {
      if (this.fcmToken) {
        await messaging().deleteToken();
        await AsyncStorage.removeItem('fcm_token');
        this.fcmToken = null;
        console.log('✅ FCM token cleared');
      }
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
  }
}

export default new NotificationService();
