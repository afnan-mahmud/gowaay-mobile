/**
 * Room Detail Screen - View room details and book
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import CachedImage from '../../components/CachedImage';
import Icon from '../../components/Icon';
import { RoomDetailSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ErrorState from '../../components/ErrorState';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { getErrorMessage } from '../../utils/errorMessages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to get full image URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${IMG_BASE_URL}${imageUrl}`;
};

// SECURITY: address, locationMapUrl, geo are NOT returned by the public room API (select:false).
// Host phone/whatsapp are also hidden. These are only revealed via booking detail after payment.
interface Room {
  _id: string;
  title: string;
  description: string;
  locationName: string;
  // address is NOT returned by public API (select:false) — payment-gated
  totalPriceTk: number;
  basePriceTk: number;
  maxGuests: number;
  beds: number;
  baths: number;
  placeType: string;
  propertyType: string;
  images: Array<{ url: string; w: number; h: number }>;
  instantBooking: boolean;
  hostId: {
    _id: string;
    displayName: string;
    profilePictureUrl?: string;
    // phone, whatsapp, locationMapUrl are NOT populated in public room endpoint
  };
  unavailableDates: string[];
  averageRating?: number;
  totalReviews?: number;
}

interface RoomReview {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  hostResponse?: string;
  hostResponseAt?: string;
  createdAt: string;
}

export default function RoomDetailScreen({ route, navigation }: any) {
  const { roomId, checkIn, checkOut, guests } = route.params;
  const { isAuthenticated, user, logout } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [reviews, setReviews] = useState<RoomReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    loadRoom();
    loadReviews();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.rooms.get(roomId);
      if (response.success && response.data) {
        setRoom(response.data as Room);
      }
    } catch (err: any) {
      console.error('Failed to load room:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await api.reviews.getRoomReviews(roomId, { page: 1, limit: 5 });
      if (response.success && response.data) {
        const data = response.data as any;
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    let result = '';
    for (let i = 1; i <= 5; i++) {
      result += i <= Math.floor(rating) ? '\u2605' : '\u2606';
    }
    return result;
  };

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to book this property',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => logout() },
        ]
      );
      return;
    }

    // Navigate to BookingFlow - it will handle instant vs request mode
    navigation.navigate('BookingFlow', { 
      room,
      checkIn,
      checkOut,
      guests,
    });
  };

  const handleContactHost = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to contact the host');
      return;
    }

    // Validate required data
    if (!room?._id) {
      Alert.alert('Error', 'Room information not available');
      return;
    }

    if (!room?.hostId?._id) {
      Alert.alert('Error', 'Host information not available');
      return;
    }

    // User._id is always available via AuthContext normalization
    const userId = user?._id;
    if (!userId) {
      console.error('❌ User information not available:', { user });
      Alert.alert('Error', 'User information not available. Please try logging in again.');
      return;
    }

    console.log('📤 Contact Host - Navigating to Chat:', {
      roomId: room._id,
      hostId: room.hostId._id,
      hostName: room.hostId.displayName,
      userId: userId,
      roomTitle: room.title,
    });

    navigation.navigate('Chat', { 
      roomId: room._id,
      hostId: room.hostId._id,
      hostName: room.hostId.displayName,
      roomTitle: room.title,
      userId: userId, // Explicitly pass userId
    });
  };

  const renderImageGallery = () => (
    <Modal visible={showGallery} transparent animationType="fade">
      <View style={styles.galleryModal}>
        <TouchableOpacity
          style={styles.galleryClose}
          onPress={() => setShowGallery(false)}
        >
          <Icon name="close" size={22} color={Colors.black} />
        </TouchableOpacity>
        
        <FlatList
          data={room?.images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          getItemLayout={(_data, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentImageIndex(index);
          }}
          renderItem={({ item }) => (
            <CachedImage
              source={{ uri: getImageUrl(item.url) }}
              style={styles.galleryImage}
              resizeMode="contain"
            />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        
        <View style={styles.galleryCounter}>
          <Text style={styles.galleryCounterText}>
            {currentImageIndex + 1} / {room?.images.length}
          </Text>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return <RoomDetailSkeleton />;
  }

  if (error && !room) {
    return <ErrorState title="Failed to Load Room" message={error} onRetry={loadRoom} />;
  }

  if (!room) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Room not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={room.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialNumToRender={1}
            windowSize={3}
            maxToRenderPerBatch={2}
            removeClippedSubviews
            getItemLayout={(_data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => setShowGallery(true)}
                activeOpacity={0.9}
              >
                <CachedImage
                  source={{ uri: getImageUrl(item.url) }}
                  style={styles.image}
                  resizeMode="cover"
                  priority="high"
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Image Dots */}
          {room.images.length > 1 && (
            <View style={styles.imageDots}>
              {room.images.slice(0, 5).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.imageDot,
                    i === currentImageIndex && styles.imageDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Show All Photos Button */}
          <TouchableOpacity
            style={styles.showAllButton}
            onPress={() => setShowGallery(true)}
            activeOpacity={0.8}
          >
            <Icon name="images-outline" size={16} color={Colors.textPrimary} style={styles.showAllButtonIcon} />
            <Text style={styles.showAllButtonText}>{room.images.length} photos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title and Location */}
          <View style={styles.header}>
            <Text style={styles.title}>{room.title}</Text>
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={16} color={Colors.textSecondary} style={styles.locationIcon} />
              <Text style={styles.location}>{room.locationName}</Text>
            </View>
          </View>

          {/* Property Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoContainer}>
              <Icon name="people-outline" size={16} color={Colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{room.maxGuests} guests</Text>
            </View>
            <View style={styles.infoContainer}>
              <Icon name="bed-outline" size={16} color={Colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{room.beds} beds</Text>
            </View>
            <View style={styles.infoContainer}>
              <Icon family="MaterialCommunityIcons" name="shower" size={16} color={Colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{room.baths} baths</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {room.placeType.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Host Info */}
          <Card style={styles.hostCard}>
            <View style={styles.hostInfo}>
              <View style={styles.hostAvatar}>
                {room.hostId.profilePictureUrl ? (
                  <CachedImage
                    source={{ uri: getImageUrl(room.hostId.profilePictureUrl || '') }}
                    style={styles.hostAvatarImage}
                  />
                ) : (
                  <Text style={styles.hostAvatarText}>
                    {room.hostId.displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.hostDetails}>
                <Text style={styles.hostName}>Hosted by {room.hostId.displayName}</Text>
                <Text style={styles.hostMeta}>Property owner</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactHost}
              activeOpacity={0.7}
            >
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </Card>

          {/* Description */}
          <Card style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>About this place</Text>
            <Text style={styles.description}>{room.description}</Text>
          </Card>

          {/* Property Details */}
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Icon name="home-outline" size={28} color={Colors.brand} />
                </View>
                <Text style={styles.detailLabel}>Property Type</Text>
                <Text style={styles.detailValue}>
                  {room.propertyType.replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Icon name="people-outline" size={28} color={Colors.brand} />
                </View>
                <Text style={styles.detailLabel}>Max Guests</Text>
                <Text style={styles.detailValue}>{room.maxGuests}</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Icon name="bed-outline" size={28} color={Colors.brand} />
                </View>
                <Text style={styles.detailLabel}>Bedrooms</Text>
                <Text style={styles.detailValue}>{room.beds}</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Icon family="MaterialCommunityIcons" name="shower" size={28} color={Colors.brand} />
                </View>
                <Text style={styles.detailLabel}>Bathrooms</Text>
                <Text style={styles.detailValue}>{room.baths}</Text>
              </View>
            </View>
          </Card>

          {/* Reviews Section */}
          <Card style={styles.reviewsCard}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {(room.averageRating != null && room.averageRating > 0) ? (
                <View style={styles.ratingOverview}>
                  <Text style={styles.ratingStarsLarge}>{renderStars(room.averageRating)}</Text>
                  <Text style={styles.ratingAvgText}>
                    {room.averageRating.toFixed(1)} ({room.totalReviews || 0})
                  </Text>
                </View>
              ) : (
                <Text style={styles.noReviewsText}>No reviews yet</Text>
              )}
            </View>

            {reviewsLoading ? (
              <View style={styles.reviewsLoadingContainer}>
                <Text style={styles.reviewsLoadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length > 0 ? (
              <>
                {reviews.map((review) => (
                  <View key={review._id} style={styles.reviewItem}>
                    <View style={styles.reviewItemHeader}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerAvatarText}>
                          {review.userId.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName}>{review.userId.name}</Text>
                        <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
                      </View>
                      <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
                    </View>
                    <Text style={styles.reviewComment} numberOfLines={3}>
                      {review.comment}
                    </Text>
                    {review.hostResponse && (
                      <View style={styles.hostResponseBox}>
                        <Text style={styles.hostResponseLabel}>Host response:</Text>
                        <Text style={styles.hostResponseText} numberOfLines={3}>
                          {review.hostResponse}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                {(room.totalReviews || 0) > reviews.length && (
                  <TouchableOpacity style={styles.seeAllReviewsButton} activeOpacity={0.7}>
                    <Text style={styles.seeAllReviewsText}>
                      See all {room.totalReviews} reviews
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.emptyReviewsText}>
                Be the first to review this property after your stay!
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Sticky Booking Footer */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>৳{room.totalPriceTk.toLocaleString()}</Text>
            <Text style={styles.priceLabel}> / night</Text>
          </View>
          {room.averageRating != null && room.averageRating > 0 && (
            <View style={styles.footerRating}>
              <Icon name="star" size={12} color="#FFC107" />
              <Text style={styles.footerRatingText}>{room.averageRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.bookButton, room.instantBooking && styles.bookButtonInstant]}
          onPress={handleBook}
          activeOpacity={0.8}
        >
          {room.instantBooking && <Icon name="flash" size={16} color={Colors.white} style={{ marginRight: 4 }} />}
          <Text style={styles.bookButtonText}>
            {room.instantBooking ? 'Book Now' : 'Request to Book'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Gallery Modal */}
      {renderImageGallery()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  imageContainer: {
    height: 350,
    backgroundColor: Colors.gray200,
    position: 'relative',
  },
  image: {
    width: SCREEN_WIDTH,
    height: 350,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Theme.shadows.sm,
  },
  imageDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  showAllButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  showAllButtonIcon: {
    marginRight: 4,
  },
  showAllButtonText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  content: { padding: 16 },
  header: { marginBottom: 16 },
  title: {
    fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary,
    marginBottom: 6, lineHeight: 30, letterSpacing: -0.5,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationIcon: {},
  location: { fontSize: 14, color: Colors.textSecondary, fontWeight: Theme.fontWeight.medium },
  infoRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    marginBottom: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100, gap: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  infoIcon: {
    marginRight: Theme.spacing.xs,
  },
  infoText: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Theme.fontWeight.medium,
  },
  badge: {
    backgroundColor: Colors.brand,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    marginLeft: 'auto',
  },
  badgeText: {
    color: Colors.white,
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  hostCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, padding: 16, borderRadius: 18,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm,
  },
  hostInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  hostAvatar: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  hostAvatarImage: { width: 52, height: 52, borderRadius: 18 },
  hostAvatarText: { color: Colors.white, fontSize: 22, fontWeight: Theme.fontWeight.bold },
  hostDetails: { flex: 1 },
  hostName: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 3 },
  hostMeta: { fontSize: 13, color: Colors.textSecondary },
  contactButton: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.brand, backgroundColor: 'transparent',
  },
  contactButtonText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.brand },
  descriptionCard: {
    marginBottom: 20, padding: 16, borderRadius: 18,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm,
  },
  detailsCard: {
    marginBottom: 20, padding: 16, borderRadius: 18,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.3 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  detailItem: { width: '50%', padding: 12, alignItems: 'center', marginBottom: 12 },
  detailIconContainer: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFF1F2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  detailIcon: {},
  detailLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 3, fontWeight: Theme.fontWeight.medium },
  detailValue: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.white,
    ...Theme.shadows.lg,
  },
  priceContainer: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
  },
  priceLabel: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
  },
  footerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  footerRatingText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  bookButton: {
    backgroundColor: Colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  bookButtonInstant: {
    backgroundColor: Colors.brand,
  },
  bookButtonText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
  },
  galleryModal: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  galleryClose: {
    position: 'absolute',
    top: 50,
    right: Theme.spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCloseText: {},
  galleryImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  galleryCounter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
  },
  galleryCounterText: {
    color: Colors.white,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
  },
  reviewsCard: { marginTop: 8, borderRadius: 18, borderWidth: 1, borderColor: Colors.gray100 },
  reviewsHeader: { marginBottom: 12 },
  ratingOverview: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingStarsLarge: { fontSize: 18, color: '#FFC107', marginRight: 8 },
  ratingAvgText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  noReviewsText: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  reviewsLoadingContainer: { paddingVertical: 16, alignItems: 'center' },
  reviewsLoadingText: { fontSize: 13, color: Colors.textTertiary },
  reviewItem: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  reviewItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerAvatar: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  reviewerAvatarText: { color: Colors.white, fontSize: 14, fontWeight: Theme.fontWeight.bold },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  reviewDate: { fontSize: 11, color: Colors.textTertiary },
  reviewStars: { fontSize: 13, color: '#FFC107' },
  reviewComment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  hostResponseBox: { marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: Colors.gray300 },
  hostResponseLabel: { fontSize: 11, fontWeight: Theme.fontWeight.semibold as any, color: Colors.textSecondary, marginBottom: 2 },
  hostResponseText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  seeAllReviewsButton: { paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.gray100 },
  seeAllReviewsText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.brand },
  emptyReviewsText: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', paddingVertical: 12 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { fontSize: 17, color: Colors.textSecondary, marginBottom: 16 },
});
