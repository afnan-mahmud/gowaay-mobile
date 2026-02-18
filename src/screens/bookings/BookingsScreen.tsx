/**
 * Bookings Screen - View all bookings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { api } from '../../api/client';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loading from '../../components/Loading';
import Icon from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

interface Booking {
  _id: string;
  roomId: {
    _id: string;
    title: string;
    locationName: string;
    images?: Array<{ url: string; w: number; h: number }>;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  amountTk: number;
  status: string;
  paymentStatus: string;
  hasReview?: boolean;
}

export default function BookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  // Refresh when coming back to this screen (e.g., after writing a review)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBookings = async () => {
    try {
      setError(null);
      const response = await api.bookings.list();
      if (response.success && response.data) {
        const bookingsData = response.data as any;
        setBookings(bookingsData.bookings || bookingsData || []);
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Bookings', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.success;
      case 'completed':
        return Colors.completed;
      case 'pending':
        return Colors.warning;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  // Check if a booking is eligible for review.
  // Only 'completed' bookings can be reviewed. The cron job ensures a booking
  // reaches 'completed' only after it was confirmed, paid, and checkout passed.
  const isReviewEligible = (booking: Booking): boolean => {
    return booking.status === 'completed' && !booking.hasReview;
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
      activeOpacity={0.7}
    >
      <Card style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.roomId.title}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <Icon name="location-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.location}>{item.roomId.locationName}</Text>
        </View>
        
        <View style={styles.bookingDetails}>
          <Text style={styles.detailText}>
            Check-in: {new Date(item.checkIn).toLocaleDateString()}
          </Text>
          <Text style={styles.detailText}>
            Check-out: {new Date(item.checkOut).toLocaleDateString()}
          </Text>
          <Text style={styles.detailText}>Guests: {item.guests}</Text>
        </View>
        
        <View style={styles.bookingFooter}>
          <Text style={styles.price}>৳{item.amountTk.toLocaleString()}</Text>
          <View style={styles.paymentRow}>
            <Icon
              name={item.paymentStatus === 'paid' ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={item.paymentStatus === 'paid' ? Colors.success : Colors.warning}
            />
            <Text style={[
              styles.paymentStatus,
              { color: item.paymentStatus === 'paid' ? Colors.success : Colors.warning }
            ]}>
              {item.paymentStatus === 'paid' ? ' Paid' : ' Unpaid'}
            </Text>
          </View>
        </View>

        {/* Write Review Button */}
        {isReviewEligible(item) && (
          <TouchableOpacity
            style={styles.reviewButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation?.();
              navigation.navigate('WriteReview', {
                bookingId: item._id,
                roomTitle: item.roomId.title,
                roomImage: item.roomId.images?.[0]?.url || '',
                roomLocation: item.roomId.locationName,
              });
            }}
          >
            <Icon name="star-outline" size={16} color={Colors.brand} style={{ marginRight: 4 }} />
            <Text style={styles.reviewButtonText}>Write a Review</Text>
          </TouchableOpacity>
        )}

        {/* Already Reviewed Badge */}
        {item.hasReview && (
          <View style={styles.reviewedBadge}>
            <Icon name="checkmark-circle" size={14} color={Colors.success} style={{ marginRight: 4 }} />
            <Text style={styles.reviewedBadgeText}>Reviewed</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading message="Loading bookings..." />;
  }

  if (error && bookings.length === 0) {
    return <ErrorState title="Failed to Load Bookings" message={error} onRetry={loadBookings} />;
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon="map-outline"
        title="Time for an Adventure!"
        message="Discover amazing places to stay across Bangladesh. Your next memorable experience is just a tap away."
        ctaText="Browse Rooms"
        onCtaPress={() => navigation.navigate('Search')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  list: { padding: 16, gap: 12 },
  bookingCard: {
    marginBottom: 0,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  bookingHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  roomTitle: {
    flex: 1, fontSize: 16, fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary, marginRight: 8, letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: {
    color: Colors.white, fontSize: 11,
    fontWeight: Theme.fontWeight.semibold, textTransform: 'capitalize',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 4 },
  location: { fontSize: 13, color: Colors.textSecondary },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookingDetails: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  detailText: {
    fontSize: 12, color: Colors.textSecondary,
    backgroundColor: Colors.gray50, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.gray100,
  },
  bookingFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  price: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  paymentStatus: { fontSize: 13, fontWeight: Theme.fontWeight.semibold },
  reviewButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, marginTop: 10, backgroundColor: '#FFFBEB',
    borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', gap: 6,
  },
  reviewButtonText: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: '#D97706' },
  reviewedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, marginTop: 8, gap: 4,
    backgroundColor: Colors.successLight, borderRadius: 10,
  },
  reviewedBadgeText: { fontSize: 13, color: Colors.success, fontWeight: Theme.fontWeight.semibold },
});
