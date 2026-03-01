/**
 * Notifications Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../../api/client';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

interface Notification {
  _id: string;
  type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'message' | 'payment_success' | 'payment_failed' | 'review' | 'system';
  title: string;
  body: string;
  data?: {
    bookingId?: string;
    threadId?: string;
    roomId?: string;
    paymentId?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    try {
      console.log('🔄 Loading notifications:', {
        filter,
        unreadOnly: filter === 'unread',
      });

      const response = await api.notifications.list({
        page: 1,
        limit: 100,
        unreadOnly: filter === 'unread',
      });

      console.log('📦 Notifications API response:', {
        success: response.success,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        notificationsCount: (response.data as any)?.notifications?.length || 0,
        unreadCount: (response.data as any)?.unreadCount || 0,
      });

      if (response.success && response.data) {
        const notifications = (response.data as any).notifications || [];
        const unreadCount = (response.data as any).unreadCount || 0;
        
        console.log('✅ Notifications loaded:', {
          count: notifications.length,
          unreadCount,
          sampleNotification: notifications[0],
        });

        setNotifications(notifications);
        setUnreadCount(unreadCount);
      } else {
        console.error('❌ Failed to load notifications:', {
          success: response.success,
          message: (response as any).message,
          error: (response as any).error,
        });
        Alert.alert('Error', (response as any).message || 'Failed to load notifications');
      }
    } catch (error: any) {
      console.error('❌ loadNotifications exception:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await api.notifications.markAsRead(notificationId);
      if (response.success) {
        setNotifications(notifications.map(n =>
          n._id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      Toast.show({ type: 'error', title: 'Could not mark as read', message: getErrorMessage(error) });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.notifications.markAllAsRead();
      if (response.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        Toast.show({ type: 'success', title: 'All Notifications Marked as Read' });
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Toast.show({ type: 'error', title: 'Failed', message: getErrorMessage(error) });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await api.notifications.delete(notificationId);
      if (response.success) {
        setNotifications(notifications.filter(n => n._id !== notificationId));
        if (!notifications.find(n => n._id === notificationId)?.read) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      Toast.show({ type: 'error', title: 'Could not delete notification', message: getErrorMessage(error) });
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    const data = notification.data || {};
    
    switch (notification.type) {
      case 'booking_request':
      case 'booking_approved':
      case 'booking_rejected':
      case 'booking_cancelled':
      case 'payment_success':
      case 'payment_failed':
        if (data.bookingId) {
          navigation.navigate('BookingDetail', { bookingId: data.bookingId });
        }
        break;
      case 'message':
        if (data.threadId) {
          navigation.navigate('Chat', { threadId: data.threadId });
        }
        break;
      // Admin notification types — navigate to relevant admin management screen
      case 'system':
        if (data.type === 'admin_host_application' || data.hostId) {
          navigation.navigate('AdminHosts');
        } else if (data.type === 'admin_room_listing' || data.roomId) {
          navigation.navigate('AdminRooms');
        } else if (
          data.type === 'admin_booking_request' ||
          data.type === 'admin_booking_confirmed'
        ) {
          if (data.bookingId) {
            navigation.navigate('BookingDetail', { bookingId: data.bookingId });
          } else {
            navigation.navigate('AdminBookings');
          }
        }
        break;
      default:
        // For unrecognised types, just mark as read (no navigation)
        break;
    }
  };

  const getNotificationIconName = (type: string, data?: Record<string, any>): { name: string; color: string } => {
    // For system (admin) notifications, pick icon based on sub-type in data
    if (type === 'system' && data?.type) {
      switch (data.type) {
        case 'admin_host_application':
          return { name: 'person-add-outline', color: Colors.brand };
        case 'admin_room_listing':
          return { name: 'home-outline', color: Colors.brand };
        case 'admin_booking_request':
          return { name: 'calendar-outline', color: Colors.brand };
        case 'admin_booking_confirmed':
          return { name: 'card-outline', color: Colors.success };
        default:
          return { name: 'shield-outline', color: Colors.brand };
      }
    }

    switch (type) {
      case 'booking_request':
        return { name: 'home-outline', color: Colors.brand };
      case 'booking_approved':
        return { name: 'checkmark-circle', color: Colors.success };
      case 'booking_rejected':
        return { name: 'close-circle', color: Colors.error };
      case 'booking_cancelled':
        return { name: 'ban-outline', color: Colors.error };
      case 'message':
        return { name: 'chatbubble-outline', color: Colors.info };
      case 'payment_success':
        return { name: 'card-outline', color: Colors.success };
      case 'payment_failed':
        return { name: 'warning-outline', color: Colors.warning };
      case 'review':
        return { name: 'star-outline', color: '#FFC107' };
      case 'system':
        return { name: 'shield-outline', color: Colors.brand };
      default:
        return { name: 'notifications-outline', color: Colors.brand };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => {
        Alert.alert(
          'Delete Notification',
          'Are you sure you want to delete this notification?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => handleDelete(item._id),
            },
          ]
        );
      }}
    >
      <Card style={StyleSheet.flatten([styles.notificationCard, !item.read ? styles.unreadCard : undefined])}>
        <View style={styles.notificationContent}>
          <View style={styles.iconContainer}>
            <Icon
              name={getNotificationIconName(item.type, item.data).name}
              size={24}
              color={getNotificationIconName(item.type, item.data).color}
              style={styles.notificationIcon}
            />
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.notificationTitle, !item.read ? styles.unreadTitle : undefined]}>
              {item.title}
            </Text>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  console.log('📊 Filtered notifications:', {
    filter,
    total: notifications.length,
    filtered: filteredNotifications.length,
    unreadCount,
    sampleNotification: filteredNotifications[0],
  });

  return (
    <View style={styles.container}>
      {/* Header with filters and actions */}
      <View style={styles.header}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title={filter === 'unread' ? 'You\'re All Caught Up!' : 'All Quiet Here'}
          message={
            filter === 'unread'
              ? 'No unread notifications. When you get new booking requests, messages, or updates, they\'ll show up here.'
              : 'We\'ll notify you about new booking requests, payment confirmations, messages from guests or hosts, and important updates.'
          }
        />
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  filterContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterButton: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.gray200,
  },
  filterButtonActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  filterText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  markAllButton: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 8 },
  markAllText: { fontSize: 13, color: Colors.brand, fontWeight: Theme.fontWeight.semibold },
  listContent: { padding: 16, gap: 10 },
  notificationCard: {
    marginBottom: 0, padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm,
  },
  unreadCard: {
    backgroundColor: '#FFF1F2', borderLeftWidth: 3, borderLeftColor: Colors.brand,
    borderColor: '#FECDD3',
  },
  notificationContent: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: { position: 'relative', marginRight: 14 },
  notificationIcon: {},
  unreadDot: {
    position: 'absolute', top: -2, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.brand, borderWidth: 2, borderColor: Colors.white,
  },
  textContainer: { flex: 1 },
  notificationTitle: {
    fontSize: 15, fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary, marginBottom: 3,
  },
  unreadTitle: { fontWeight: Theme.fontWeight.bold },
  notificationBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  notificationTime: { fontSize: 11, color: Colors.textTertiary },
});
