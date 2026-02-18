/**
 * Favorites Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Card from '../../components/Card';
import CachedImage from '../../components/CachedImage';
import Icon from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/errorMessages';

interface Room {
  _id: string;
  title: string;
  pricePerNight: number;
  location: string;
  images: { url: string }[];
  rating?: number;
  reviewCount?: number;
}

export default function FavoritesScreen({ navigation }: any) {
  const [favorites, setFavorites] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${IMG_BASE_URL}${imageUrl}`;
  };

  const loadFavorites = useCallback(async () => {
    try {
      const response = await api.get('/favorites');
      if (response.success && response.data) {
        setFavorites(response.data);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      Toast.show({ type: 'error', title: 'Failed to Load Favorites', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });
    return unsubscribe;
  }, [navigation, loadFavorites]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (roomId: string) => {
    try {
      await api.delete(`/favorites/${roomId}`);
      setFavorites(favorites.filter(room => room._id !== roomId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('RoomDetail', { roomId: item._id })}
    >
      <Card style={styles.roomCard}>
        <View style={styles.roomImageContainer}>
          <CachedImage
            source={{ uri: getImageUrl(item.images[0]?.url) }}
            style={styles.roomImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleRemoveFavorite(item._id)}
          >
            <Icon name="heart" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.roomLocation}>{item.location}</Text>
          </View>
          {item.rating ? (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={13} color="#FFC107" style={{ marginRight: 3 }} />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({item.reviewCount || 0} reviews)</Text>
            </View>
          ) : null}
          <Text style={styles.roomPrice}>
            ৳{item.pricePerNight.toLocaleString()}/night
          </Text>
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

  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={64} color={Colors.gray300} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Start adding properties to your favorites by tapping the heart icon on any listing!
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderRoom}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  roomCard: {
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  roomImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    ...Theme.shadows.sm,
  },
  favoriteIcon: {},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  roomInfo: {
    padding: 14,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  roomLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
    marginRight: Theme.spacing.xs,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.brand,
    letterSpacing: -0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
