/**
 * Messages Screen - Chat threads list
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import CachedImage from '../../components/CachedImage';
import Icon from '../../components/Icon';
import { useFocusEffect } from '@react-navigation/native';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { IMG_BASE_URL } from '../../constants/config';
import { Toast } from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';

interface Thread {
  _id: string;
  roomId: {
    _id: string;
    title: string;
    images: Array<{ url: string }>;
  };
  userId: {
    _id: string;
    name: string;
  };
  hostId: {
    _id: string;
    displayName: string;
  };
  lastMessageAt: string;
  bookingId?: string;
}

export default function MessagesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isHost = user?.role === 'host';

  // Load threads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [])
  );

  const loadThreads = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const response = await api.chat.getThreads({ page: 1, limit: 50 });
      
      if (response.success && response.data) {
        const threadsData = (response.data as any).threads || [];
        setThreads(threadsData);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
      if (!silent) {
        Toast.show({ type: 'error', title: 'Failed to Load Messages', message: getErrorMessage(error) });
      }
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadThreads(true);
  };

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${IMG_BASE_URL}${imageUrl}`;
  };

  const handleThreadPress = (thread: Thread) => {
    navigation.navigate('Chat', {
      roomId: thread.roomId._id,
      roomTitle: thread.roomId.title,
      hostId: thread.hostId._id,
      hostName: thread.hostId.displayName,
      bookingId: thread.bookingId,
      threadId: thread._id,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderThread = ({ item }: { item: Thread }) => {
    const otherPartyName = isHost ? item.userId.name : item.hostId.displayName;
    const imageUrl = item.roomId.images?.[0]?.url;

  return (
      <TouchableOpacity
        style={styles.threadItem}
        onPress={() => handleThreadPress(item)}
        activeOpacity={0.7}
      >
        <CachedImage
          source={{ uri: getImageUrl(imageUrl) }}
          style={styles.threadImage}
        />
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={styles.threadTitle} numberOfLines={1}>
              {item.roomId.title}
            </Text>
            <Text style={styles.threadTime}>
              {formatDate(item.lastMessageAt)}
            </Text>
          </View>
          <Text style={styles.threadSubtitle} numberOfLines={1}>
            {isHost ? `Guest: ${otherPartyName}` : `Host: ${otherPartyName}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
      <View style={styles.emptyContainer}>
        <Icon name="chatbubbles-outline" size={64} color={Colors.gray300} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptyText}>
        {isHost
          ? 'Your booking requests and guest messages will appear here'
          : 'Start a conversation with a host when you book a property'}
        </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={(item) => item._id}
        contentContainerStyle={threads.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.brand]}
            tintColor={Colors.brand}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F4F8' },
  list: { padding: 16, gap: 10 },
  emptyList: { flex: 1 },
  threadItem: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: 18, padding: 14,
    marginBottom: 0, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm,
  },
  threadImage: { width: 64, height: 64, borderRadius: 14, backgroundColor: Colors.gray200 },
  threadContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  threadHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
  },
  threadTitle: {
    flex: 1, fontSize: 15, fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary, marginRight: 8, letterSpacing: -0.2,
  },
  threadTime: { fontSize: 11, color: Colors.textTertiary },
  threadSubtitle: { fontSize: 13, color: Colors.textSecondary },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
