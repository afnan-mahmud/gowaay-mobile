/**
 * Write Review Screen - Submit a review for a completed booking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CachedImage from '../../components/CachedImage';
import Button from '../../components/Button';
import Card from '../../components/Card';
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

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function WriteReviewScreen({ route, navigation }: any) {
  const { bookingId, roomTitle, roomImage, roomLocation } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    if (comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write at least 10 characters in your review.');
      return;
    }
    if (comment.trim().length > 1000) {
      Alert.alert('Comment Too Long', 'Your review cannot exceed 1000 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.reviews.create({
        bookingId,
        rating,
        comment: comment.trim(),
      });

      if (response.success) {
        Toast.show({
          type: 'success',
          title: 'Review Submitted',
          message: 'Thank you for your review!',
        });
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to submit review');
      }
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          activeOpacity={0.7}
          style={styles.starButton}
        >
          <Text style={[styles.star, i <= rating && styles.starFilled]}>
            {i <= rating ? '\u2605' : '\u2606'}
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Room Info Header */}
        <Card style={styles.roomCard}>
          <View style={styles.roomRow}>
            {roomImage ? (
              <CachedImage
                source={{ uri: getImageUrl(roomImage) }}
                style={styles.roomImage}
              />
            ) : (
              <View style={[styles.roomImage, styles.roomImagePlaceholder]}>
                <Text style={styles.roomImagePlaceholderText}>No Image</Text>
              </View>
            )}
            <View style={styles.roomInfo}>
              <Text style={styles.roomTitle} numberOfLines={2}>
                {roomTitle || 'Property'}
              </Text>
              {roomLocation ? (
                <Text style={styles.roomLocation} numberOfLines={1}>
                  {roomLocation}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        {/* Rating Section */}
        <Card style={styles.ratingCard}>
          <Text style={styles.sectionTitle}>How was your stay?</Text>
          <View style={styles.starsContainer}>{renderStars()}</View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{STAR_LABELS[rating]}</Text>
          )}
        </Card>

        {/* Comment Section */}
        <Card style={styles.commentCard}>
          <Text style={styles.sectionTitle}>Write your review</Text>
          <Text style={styles.commentHint}>
            Share your experience to help other guests (min 10 characters)
          </Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={6}
            placeholder="What did you like? What could be improved?"
            placeholderTextColor={Colors.textTertiary}
            value={comment}
            onChangeText={setComment}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {comment.length}/1000
          </Text>
        </Card>

        {/* Submit Button */}
        <Button
          title="Submit Review"
          onPress={handleSubmit}
          loading={submitting}
          disabled={rating === 0 || comment.trim().length < 10}
          fullWidth
          size="large"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: Theme.spacing.xl * 2,
  },
  roomCard: {
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    backgroundColor: Colors.white,
    ...Theme.shadows.sm,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  roomImagePlaceholder: {
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomImagePlaceholderText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  roomInfo: {
    flex: 1,
    marginLeft: 16,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  roomLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  ratingCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    backgroundColor: Colors.white,
    ...Theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textTertiary,
    marginBottom: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    paddingHorizontal: 8,
  },
  star: {
    fontSize: 40,
    color: Colors.gray300,
  },
  starFilled: {
    color: '#FFC107',
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.brand,
    marginTop: 4,
  },
  commentCard: {
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    backgroundColor: Colors.white,
    ...Theme.shadows.sm,
  },
  commentHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 16,
    padding: 14,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 120,
    backgroundColor: Colors.gray50,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
});
