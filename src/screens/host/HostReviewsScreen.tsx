/**
 * Host Reviews Screen - View and respond to guest reviews
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api } from '../../api/client';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loading from '../../components/Loading';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

interface Review {
  _id: string;
  userId: { _id: string; name: string };
  roomId: { _id: string; title: string };
  rating: number;
  comment: string;
  hostResponse?: string;
  hostResponseAt?: string;
  createdAt: string;
}

export default function HostReviewsScreen({ navigation }: any) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadReviews();
    });
    return unsubscribe;
  }, [navigation]);

  const loadReviews = async () => {
    try {
      setError(null);
      const response = await api.reviews.getHostReviews({ page: 1, limit: 50 });
      if (response.success && response.data) {
        const data = response.data as any;
        setReviews(data.reviews || []);
      }
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.reviews.respondToReview(reviewId, { response: responseText.trim() });
      if (response.success) {
        setRespondingTo(null);
        setResponseText('');
        loadReviews();
      } else {
        Alert.alert('Error', (response as any).message || 'Failed to submit response');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const renderReview = ({ item }: { item: Review }) => (
    <Card style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.userId?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.reviewerInfo}>
            <Text style={styles.reviewerName}>{item.userId?.name || 'Guest'}</Text>
            <Text style={styles.reviewDate}>
              {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
        <Text style={styles.stars}>{renderStars(item.rating)}</Text>
      </View>

      <Text style={styles.roomBadge}>{item.roomId?.title || 'Unknown Room'}</Text>
      <Text style={styles.comment}>{item.comment}</Text>

      {/* Existing host response */}
      {item.hostResponse ? (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Your response</Text>
          <Text style={styles.responseText}>{item.hostResponse}</Text>
        </View>
      ) : (
        <>
          {respondingTo === item._id ? (
            <View style={styles.responseForm}>
              <TextInput
                style={styles.responseInput}
                placeholder="Write your response..."
                value={responseText}
                onChangeText={setResponseText}
                multiline
                maxLength={1000}
                numberOfLines={3}
              />
              <View style={styles.responseActions}>
                <Text style={styles.charCount}>{responseText.length}/1000</Text>
                <View style={styles.responseButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => { setRespondingTo(null); setResponseText(''); }}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, (!responseText.trim() || submitting) && styles.submitButtonDisabled]}
                    onPress={() => handleSubmitResponse(item._id)}
                    disabled={!responseText.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.submitButtonText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.respondButton}
              onPress={() => setRespondingTo(item._id)}
            >
              <Text style={styles.respondButtonText}>Respond</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </Card>
  );

  if (loading) {
    return <Loading message="Loading reviews..." />;
  }

  if (error && reviews.length === 0) {
    return <ErrorState title="Failed to Load Reviews" message={error} onRetry={loadReviews} />;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon="star-outline"
        title="No Reviews Yet"
        message="Once guests review your properties, they will appear here."
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  list: {
    padding: 14,
  },
  reviewCard: {
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: Theme.fontWeight.bold,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stars: {
    fontSize: 14,
    color: '#F59E0B',
  },
  roomBadge: {
    fontSize: 11,
    color: Colors.brand,
    backgroundColor: Colors.brandLight || '#f0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: Theme.spacing.sm,
    overflow: 'hidden',
  },
  comment: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Theme.spacing.sm,
  },
  responseBox: {
    marginLeft: Theme.spacing.md,
    paddingLeft: Theme.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.brand,
    backgroundColor: '#F4F4F8',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    padding: 14,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.brand,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  responseText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  respondButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  respondButtonText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.brand,
  },
  responseForm: {
    marginTop: Theme.spacing.sm,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  cancelButton: {
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 14,
  },
  cancelButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  submitButton: {
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: 14,
    backgroundColor: Colors.brand,
    borderRadius: 14,
    minWidth: 80,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.white,
  },
});
