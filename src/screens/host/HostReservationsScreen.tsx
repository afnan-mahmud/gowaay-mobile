/**
 * Host Reservations Screen - Manage booking requests and reservations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { api } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import ErrorState from '../../components/ErrorState';
import Loading from '../../components/Loading';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

interface Booking {
  _id: string;
  roomId: {
    _id: string;
    title: string;
  };
  guestId: {
    _id: string;
    name: string;
    email: string;
  };
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  totalPriceTk: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: string;
}

export default function HostReservationsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setError(null);
      console.log('📥 loadReservations: Fetching host reservations...');
      const response = await api.hosts.reservations();
      
      console.log('📦 loadReservations: API response:', {
        success: response.success,
        hasData: !!response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      });

      if (response.success && response.data) {
        const reservations = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).reservations || (response.data as any).bookings || [];
        
        console.log(`✅ loadReservations: Loaded ${reservations.length} reservations`);
        setBookings(reservations as Booking[]);
      } else {
        console.warn('⚠️ loadReservations: API returned success=false:', response.message || response.error);
        setBookings([]);
      }
    } catch (err: any) {
      console.error('❌ loadReservations: Failed to load reservations:', err);
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Reservations', message: msg });
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  const handleAccept = async (bookingId: string) => {
    try {
      const response = await api.hosts.acceptBooking(bookingId);
      if (response.success) {
        Alert.alert('Success', 'Booking accepted');
        loadReservations();
      } else {
        Alert.alert('Error', response.message || 'Failed to accept booking');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept booking');
    }
  };

  const handleReject = async (bookingId: string) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.hosts.rejectBooking(bookingId);
              if (response.success) {
                Alert.alert('Success', 'Booking rejected');
                loadReservations();
              } else {
                Alert.alert('Error', response.message || 'Failed to reject booking');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject booking');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'cancelled':
        return Colors.error;
      case 'completed':
        return Colors.info;
      default:
        return Colors.gray500;
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid':
        return Colors.success;
      case 'unpaid':
        return Colors.warning;
      case 'refunded':
        return Colors.info;
      default:
        return Colors.gray500;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const renderBooking = ({ item }: { item: Booking }) => {
    const nights = calculateNights(item.checkInDate, item.checkOutDate);

    return (
      <Card style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingHeaderLeft}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {item.roomId.title}
            </Text>
            <Text style={styles.guestName}>Guest: {item.guestId.name}</Text>
          </View>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getPaymentColor(item.paymentStatus) }]}>
              <Text style={styles.badgeText}>{item.paymentStatus}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Icon name="calendar-outline" size={14} color={Colors.textSecondary} style={styles.detailLabelIcon} />
              <Text style={styles.detailLabel}>Check-in:</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(item.checkInDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Icon name="calendar-outline" size={14} color={Colors.textSecondary} style={styles.detailLabelIcon} />
              <Text style={styles.detailLabel}>Check-out:</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(item.checkOutDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Icon name="moon-outline" size={14} color={Colors.textSecondary} style={styles.detailLabelIcon} />
              <Text style={styles.detailLabel}>Nights:</Text>
            </View>
            <Text style={styles.detailValue}>{nights}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Icon name="people-outline" size={14} color={Colors.textSecondary} style={styles.detailLabelIcon} />
              <Text style={styles.detailLabel}>Guests:</Text>
            </View>
            <Text style={styles.detailValue}>{item.totalGuests}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Icon name="cash-outline" size={14} color={Colors.textSecondary} style={styles.detailLabelIcon} />
              <Text style={styles.detailLabel}>Total:</Text>
            </View>
            <Text style={styles.detailPrice}>৳{item.totalPriceTk.toLocaleString()}</Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actions}>
            <Button
              title="Accept"
              onPress={() => handleAccept(item._id)}
              style={styles.actionButton}
              size="small"
            />
            <Button
              title="Reject"
              variant="outline"
              onPress={() => handleReject(item._id)}
              style={styles.actionButton}
              size="small"
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.viewDetails}
          onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
        >
          <Text style={styles.viewDetailsText}>View Full Details →</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return <Loading message="Loading reservations..." />;
  }

  if (error && bookings.length === 0) {
    return <ErrorState title="Failed to Load Reservations" message={error} onRetry={loadReservations} />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({bookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending ({bookings.filter((b) => b.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'confirmed' && styles.filterTabActive]}
          onPress={() => setFilter('confirmed')}
        >
          <Text style={[styles.filterText, filter === 'confirmed' && styles.filterTextActive]}>
            Confirmed ({bookings.filter((b) => b.status === 'confirmed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed ({bookings.filter((b) => b.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={filter === 'all' ? 'Ready for Your First Guest?' : `No ${filter} reservations`}
          message={
            filter === 'all'
              ? 'Start accepting bookings to see reservations here. Make sure your rooms are published and visible to guests!'
              : `You don't have any ${filter} reservations at the moment.`
          }
          ctaText={filter === 'all' ? 'View My Listings' : undefined}
          onCtaPress={filter === 'all' ? () => navigation.navigate('HostListings') : undefined}
        />
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
  filterContainer: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
    alignItems: 'center',
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: Colors.brand,
  },
  filterText: {
    fontSize: 12,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    padding: 14,
  },
  bookingCard: {
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
    padding: 14,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  bookingHeaderLeft: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  guestName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badges: {
    alignItems: 'flex-end',
    gap: Theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: Theme.fontWeight.medium,
    textTransform: 'capitalize',
  },
  bookingDetails: {
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabelIcon: {
    marginRight: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: Theme.fontWeight.medium,
  },
  detailPrice: {
    fontSize: 15,
    color: Colors.brand,
    fontWeight: Theme.fontWeight.bold,
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  viewDetails: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: Theme.fontWeight.medium,
  },
});
