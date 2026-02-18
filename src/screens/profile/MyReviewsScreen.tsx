/**
 * My Reviews Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import CachedImage from '../../components/CachedImage';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { api } from '../../api/client';
import { getErrorMessage } from '../../utils/errorMessages';

// Helper function to get full image URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${IMG_BASE_URL}${imageUrl}`;
};

interface Review {
  _id: string;
  roomId: {
    _id: string;
    title: string;
    images?: Array<{ url: string; w: number; h: number }>;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function MyReviewsScreen({ navigation }: any) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = async () => {
    try {
      const response = await api.reviews.getMyReviews();
      if (response.success && response.data) {
        const data = response.data as any;
        setReviews(data.reviews || data || []);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      Toast.show({ type: 'error', title: 'Failed to Load Reviews', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const renderStars = (rating: number) => {
    const filled = Math.floor(rating);
    const empty = 5 - filled;
    return (
      <View style={{ flexDirection: 'row' }}>
        {Array(filled).fill(0).map((_, i) => (
          <Icon key={`f${i}`} name="star" size={16} color="#FFC107" />
        ))}
        {Array(empty).fill(0).map((_, i) => (
          <Icon key={`e${i}`} name="star-outline" size={16} color="#FFC107" />
        ))}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderReview = ({ item }: { item: Review }) => {
    const roomImageUrl = item.roomId.images?.[0]?.url;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RoomDetail', { roomId: item.roomId._id })}
      >
        <Card style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            {roomImageUrl ? (
              <CachedImage
                source={{ uri: getImageUrl(roomImageUrl) }}
                style={styles.roomThumbnail}
              />
            ) : (
              <View style={[styles.roomThumbnail, styles.roomThumbnailPlaceholder]}>
                <Text style={styles.roomThumbnailPlaceholderText}>No Img</Text>
              </View>
            )}
            <View style={styles.reviewHeaderInfo}>
              <Text style={styles.propertyName} numberOfLines={2}>{item.roomId.title}</Text>
              <View style={styles.ratingContainer}>
                {renderStars(item.rating)}
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
          {item.comment ? (
            <Text style={styles.comment} numberOfLines={3}>
              {item.comment}
            </Text>
          ) : null}
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="create-outline" size={64} color={Colors.gray300} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptyText}>
            You haven't written any reviews yet. Book a property and share your experience!
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
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
  reviewCard: {
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.sm,
  },
  roomThumbnail: {
    width: 60,
    height: 60,
    borderRadius: Theme.borderRadius.md,
    marginRight: 14,
  },
  roomThumbnailPlaceholder: {
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomThumbnailPlaceholderText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  reviewHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  propertyName: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    marginRight: Theme.spacing.xs,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
  },
  comment: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Theme.spacing.sm,
  },
  date: {
    fontSize: 12,
    color: Colors.textTertiary,
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
