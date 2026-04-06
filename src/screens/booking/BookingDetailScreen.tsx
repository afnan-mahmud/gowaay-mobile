/**
 * Booking Detail Screen - View single booking details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import CachedImage from '../../components/CachedImage';
import Icon from '../../components/Icon';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { getErrorMessage } from '../../utils/errorMessages';

// Helper function to get full image URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${IMG_BASE_URL}${imageUrl}`;
};

interface Booking {
  _id: string;
  roomId: {
    _id: string;
    title: string;
    locationName: string;
    address?: string;
    locationMapUrl?: string;
    images: Array<{ url: string; w: number; h: number }>;
  };
  hostId: {
    _id: string;
    displayName: string;
    phone?: string;
    locationMapUrl?: string;
    locationName?: string;
  };
  userId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  amountTk: number;
  nights?: number;
  basePricePerNightTk?: number;
  commissionPerNightTk?: number;
  couponCode?: string;
  couponDiscountTk?: number;
  originalAmountTk?: number;
  status: string;
  paymentStatus: string;
  hasReview?: boolean;
  createdAt: string;
}

export default function BookingDetailScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isHost = user?.role === 'host';
  const isAdmin = user?.role === 'admin';
  const isGuest = user?.role === 'guest' || (!isHost && !isAdmin);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  // Refresh when coming back (e.g., after writing a review)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBooking();
    });
    return unsubscribe;
  }, [navigation, bookingId]);

  const loadBooking = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.bookings.get(bookingId);
      if (response.success && response.data) {
        setBooking(response.data as Booking);
      }
    } catch (err: any) {
      console.error('Failed to load booking:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getCancellationInfo = () => {
    if (!booking) return '';
    if (booking.status === 'pending' && booking.paymentStatus !== 'paid') {
      return 'This booking has not been paid yet. You can cancel it without any charge.';
    }
    if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
      const now = new Date();
      const checkIn = new Date(booking.checkIn);
      const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilCheckIn >= 24) {
        const refund = Math.round(booking.amountTk * 0.8);
        return `More than 24 hours before check-in. You will receive an 80% refund (approx. ৳${refund.toLocaleString()}).`;
      } else if (hoursUntilCheckIn >= 12) {
        return 'Between 12-24 hours before check-in. The host will receive 50% of the base price. No refund will be issued.';
      } else {
        return 'Less than 12 hours before check-in. The host will receive the full base price. No refund will be issued.';
      }
    }
    return '';
  };

  const canCancel = () => {
    if (!booking) return false;
    return (
      (booking.status === 'pending' && booking.paymentStatus !== 'paid') ||
      (booking.status === 'confirmed' && booking.paymentStatus === 'paid')
    );
  };

  const handleCancel = () => {
    const policyInfo = getCancellationInfo();
    Alert.alert(
      'Cancel Booking',
      policyInfo ? `${policyInfo}\n\nAre you sure you want to cancel?` : 'Are you sure you want to cancel this booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.bookings.cancel(bookingId);
              if (response.success) {
                Alert.alert('Success', 'Booking cancelled successfully');
                loadBooking();
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel booking');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handlePayNow = () => {
    navigation.navigate('Payment', {
      bookingId: booking?._id,
      amount: booking?.amountTk,
    });
  };

  const handleContactHost = () => {
    navigation.navigate('Chat', {
      roomId: booking?.roomId._id,
      hostId: booking?.hostId._id,
      hostName: booking?.hostId.displayName,
    });
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

  // Check if this booking is eligible for a review.
  // Only 'completed' bookings can be reviewed. The cron job ensures a booking
  // reaches 'completed' only after it was confirmed, paid, and checkout passed.
  const isReviewEligible = (): boolean => {
    if (!booking) return false;
    return isGuest && booking.status === 'completed' && !booking.hasReview;
  };

  const handleWriteReview = () => {
    if (!booking) return;
    navigation.navigate('WriteReview', {
      bookingId: booking._id,
      roomTitle: booking.roomId.title,
      roomImage: booking.roomId.images?.[0]?.url || '',
      roomLocation: booking.roomId.locationName,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <Loading message="Loading booking details..." />;
  }

  if (error && !booking) {
    return <ErrorState title="Failed to Load Booking" message={error} onRetry={loadBooking} />;
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Room Image */}
          <TouchableOpacity
            onPress={() => navigation.navigate('RoomDetail', { roomId: booking.roomId._id })}
          >
            <CachedImage
              source={{ uri: getImageUrl(booking.roomId.images[0]?.url) }}
              style={styles.roomImage}
            />
          </TouchableOpacity>

          {/* Status */}
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusLabel}>Booking Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{booking.status}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.statusLabel}>Payment Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        booking.paymentStatus === 'paid' ? Colors.success : Colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>{booking.paymentStatus}</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Room Details */}
          <Card>
            <Text style={styles.roomTitle}>{booking.roomId.title}</Text>
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.roomLocation}>{booking.roomId.locationName}</Text>
            </View>
          </Card>

          {/* Booking Details */}
          <Card>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-in</Text>
              <Text style={styles.detailValue}>{formatDate(booking.checkIn)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-out</Text>
              <Text style={styles.detailValue}>{formatDate(booking.checkOut)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Guests</Text>
              <Text style={styles.detailValue}>{booking.guests}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nights</Text>
              <Text style={styles.detailValue}>{calculateNights()}</Text>
            </View>
          </Card>

          {/* Guest Information - Show for host (when paid) and admin (always) */}
          {((isHost && booking.paymentStatus === 'paid') || isAdmin) && booking.userId && (
            <Card>
              <Text style={styles.sectionTitle}>Guest Information</Text>
              <View style={styles.guestRow}>
                <View style={styles.guestAvatar}>
                  <Text style={styles.guestAvatarText}>
                    {booking.userId.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.guestDetails}>
                  <Text style={styles.guestName}>{booking.userId.name}</Text>
                  {booking.userId.email && (
                    <View style={styles.phoneRow}>
                      <Icon name="mail-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.guestEmail}>{booking.userId.email}</Text>
                    </View>
                  )}
                  {booking.userId.phone && (
                    <View style={styles.phoneRow}>
                      <Icon name="call-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.guestPhone}>{booking.userId.phone}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Host Info - Show when paid (for guests/hosts) or always for admin */}
          {(booking.paymentStatus === 'paid' || isAdmin) && (
          <Card>
            <Text style={styles.sectionTitle}>Host Information</Text>
            <View style={styles.hostRow}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarText}>
                  {booking.hostId.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.hostDetails}>
                <Text style={styles.hostName}>{booking.hostId.displayName}</Text>
                {booking.hostId.phone && (
                  <View style={styles.phoneRow}>
                    <Icon name="call-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.hostPhone}>{booking.hostId.phone}</Text>
                  </View>
                )}
              </View>
            </View>

              {/* Property Location */}
              <View style={styles.propertyInfo}>
                  <View style={styles.propertyRow}>
                    <Icon name="location-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.propertyLabel}>Location:</Text>
                    <Text style={styles.propertyValue}>{booking.hostId.locationName || booking.roomId.locationName}</Text>
                  </View>
                  {booking.roomId.address && (
                  <View style={styles.propertyRow}>
                    <Icon name="home-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.propertyLabel}>Address:</Text>
                    <Text style={styles.propertyValue}>{booking.roomId.address}</Text>
                  </View>
                )}
              </View>

              {/* Map Link Button */}
              {(booking.roomId.locationMapUrl || booking.hostId.locationMapUrl) && (
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => {
                    const mapUrl = booking.roomId.locationMapUrl || booking.hostId.locationMapUrl;
                    if (mapUrl) {
                      Linking.openURL(mapUrl).catch((err: any) => {
                        console.error('Failed to open map URL:', err);
                        Alert.alert('Error', 'Failed to open map');
                      });
                    }
                  }}
                >
                  <Icon name="map-outline" size={18} color={Colors.info} style={{ marginRight: 6 }} />
                  <Text style={styles.mapButtonText}>View on Map</Text>
                </TouchableOpacity>
              )}

            {!isAdmin && (
            <Button
              title="Contact Host"
              onPress={handleContactHost}
              variant="outline"
              fullWidth
              style={styles.hostButton}
            />
            )}
          </Card>
          )}

          {/* Price Breakdown */}
          <Card>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
            {isAdmin && booking.basePricePerNightTk ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base price per night</Text>
                  <Text style={styles.priceSubvalue}>৳{booking.basePricePerNightTk.toLocaleString()}</Text>
                </View>
                {booking.commissionPerNightTk != null && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Commission per night</Text>
                    <Text style={styles.priceSubvalue}>৳{booking.commissionPerNightTk.toLocaleString()}</Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Nights</Text>
                  <Text style={styles.priceSubvalue}>{booking.nights || calculateNights()}</Text>
                </View>
                {booking.originalAmountTk != null && booking.couponDiscountTk != null && booking.couponDiscountTk > 0 && (
                  <>
                    <View style={[styles.priceRow, { marginTop: 4 }]}>
                      <Text style={styles.priceLabel}>Subtotal</Text>
                      <Text style={styles.priceSubvalue}>৳{booking.originalAmountTk.toLocaleString()}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: Colors.success }]}>
                        Coupon ({booking.couponCode})
                      </Text>
                      <Text style={[styles.priceSubvalue, { color: Colors.success }]}>
                        -৳{booking.couponDiscountTk.toLocaleString()}
                      </Text>
                    </View>
                  </>
                )}
                <View style={[styles.priceDivider]} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>Total Amount</Text>
                  <Text style={styles.priceValue}>৳{booking.amountTk.toLocaleString()}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Total Amount</Text>
                  <Text style={styles.priceValue}>৳{booking.amountTk.toLocaleString()}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Price per night</Text>
                  <Text style={styles.priceSubvalue}>
                    ৳{Math.round(booking.amountTk / calculateNights()).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </Card>

          {/* Cancellation Policy Info */}
          {isGuest && canCancel() && (
            <Card>
              <Text style={styles.sectionTitle}>Cancellation Policy</Text>
              <Text style={styles.policyText}>{getCancellationInfo()}</Text>
            </Card>
          )}

          {/* Actions */}
          {/* Pay Now button - Only show for guests */}
          {isGuest && booking.status === 'confirmed' && booking.paymentStatus === 'unpaid' && (
            <Button
              title={`Pay Now - ৳${booking.amountTk.toLocaleString()}`}
              onPress={handlePayNow}
              fullWidth
            />
          )}

          {/* Cancel button - Only show for guests with cancellable bookings */}
          {isGuest && canCancel() && (
            <Button
              title="Cancel Booking"
              onPress={handleCancel}
              variant="outline"
              fullWidth
            />
          )}

          {/* Write Review button - Show for eligible completed bookings */}
          {isReviewEligible() && (
            <Button
              title="Write a Review"
              onPress={handleWriteReview}
              variant="secondary"
              fullWidth
            />
          )}

          {/* Already reviewed indicator */}
          {isGuest && booking.hasReview && (
            <View style={styles.reviewedContainer}>
              <Text style={styles.reviewedText}>You have reviewed this stay</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  content: { padding: 16, gap: 12 },
  roomImage: { width: '100%', height: 200, borderRadius: 18 },
  statusCard: { backgroundColor: Colors.white },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: Colors.white, fontSize: 12, fontWeight: Theme.fontWeight.semibold, textTransform: 'capitalize' },
  roomTitle: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 4, letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  roomLocation: { fontSize: 13, color: Colors.textSecondary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  sectionTitle: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.2 },
  policyText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  priceValue: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  priceSubvalue: { fontSize: 13, color: Colors.textSecondary },
  priceTotalLabel: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  priceDivider: { height: 1, backgroundColor: Colors.gray100, marginVertical: 8 },
  hostRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  hostAvatar: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  hostAvatarText: { color: Colors.white, fontSize: 20, fontWeight: Theme.fontWeight.bold },
  hostDetails: { flex: 1 },
  hostName: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  hostPhone: { fontSize: 13, color: Colors.textSecondary },
  hostButton: { marginTop: 8 },
  propertyInfo: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  propertyRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  propertyLabel: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.textSecondary, width: 80 },
  propertyValue: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  mapButton: {
    marginTop: 12, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#EFF6FF', borderRadius: 14, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#BFDBFE',
  },
  mapButtonText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: '#2563EB' },
  guestRow: { flexDirection: 'row', alignItems: 'center' },
  guestAvatar: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  guestAvatarText: { color: Colors.white, fontSize: 20, fontWeight: Theme.fontWeight.bold },
  guestDetails: { flex: 1 },
  guestName: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  guestEmail: { fontSize: 13, color: Colors.textSecondary },
  guestPhone: { fontSize: 13, color: Colors.textSecondary },
  reviewedContainer: { alignItems: 'center', paddingVertical: 10, backgroundColor: '#ECFDF5', borderRadius: 12, marginTop: 4 },
  reviewedText: { fontSize: 13, color: Colors.success, fontWeight: Theme.fontWeight.semibold },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { fontSize: 17, color: Colors.textSecondary, marginBottom: 16 },
});
