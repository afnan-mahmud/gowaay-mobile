/**
 * Host Reservations Screen — Glassmorphism redesign
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
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { api } from '../../api/client';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import ErrorState from '../../components/ErrorState';
import Loading from '../../components/Loading';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const GLASS_LIGHT  = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

interface Booking {
  _id: string;
  roomId: { _id: string; title: string };
  guestId: { _id: string; name: string; email: string };
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

  useEffect(() => { loadReservations(); }, []);

  const loadReservations = async () => {
    try {
      setError(null);
      const response = await api.hosts.reservations();
      if (response.success && response.data) {
        const reservations = Array.isArray(response.data)
          ? response.data
          : (response.data as any).reservations || (response.data as any).bookings || [];
        setBookings(reservations as Booking[]);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Reservations', message: msg });
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadReservations(); };

  const handleAccept = async (bookingId: string) => {
    try {
      const response = await api.hosts.acceptBooking(bookingId);
      if (response.success) { Alert.alert('Success', 'Booking accepted'); loadReservations(); }
      else Alert.alert('Error', response.message || 'Failed to accept booking');
    } catch (error: any) { Alert.alert('Error', error.message || 'Failed to accept booking'); }
  };

  const handleReject = async (bookingId: string) => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          const response = await api.hosts.rejectBooking(bookingId);
          if (response.success) { Alert.alert('Success', 'Booking rejected'); loadReservations(); }
          else Alert.alert('Error', response.message || 'Failed to reject booking');
        } catch (error: any) { Alert.alert('Error', error.message || 'Failed to reject booking'); }
      }},
    ]);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return { color: Colors.success, bg: Colors.success + '18', label: 'Confirmed' };
      case 'pending':   return { color: Colors.warning, bg: Colors.warning + '18', label: 'Pending' };
      case 'cancelled': return { color: Colors.error,   bg: Colors.error   + '18', label: 'Cancelled' };
      case 'completed': return { color: Colors.info,    bg: Colors.info    + '18', label: 'Completed' };
      default:          return { color: Colors.gray500, bg: Colors.gray100, label: status };
    }
  };

  const getPaymentConfig = (status: string) => {
    switch (status) {
      case 'paid':     return { color: Colors.success, bg: Colors.success + '18', label: 'Paid' };
      case 'unpaid':   return { color: Colors.warning, bg: Colors.warning + '18', label: 'Unpaid' };
      case 'refunded': return { color: Colors.info,    bg: Colors.info    + '18', label: 'Refunded' };
      default:         return { color: Colors.gray500, bg: Colors.gray100, label: status };
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const calculateNights = (i: string, o: string) => Math.ceil((new Date(o).getTime() - new Date(i).getTime()) / 86400000);

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);

  const filterTabs: Array<{ key: typeof filter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
  ];

  const renderBooking = ({ item }: { item: Booking }) => {
    const nights = calculateNights(item.checkInDate, item.checkOutDate);
    const sc = getStatusConfig(item.status);
    const pc = getPaymentConfig(item.paymentStatus);

    return (
      <View style={S.card}>
        {/* Card header */}
        <View style={S.cardHeader}>
          <View style={S.cardHeaderLeft}>
            <Text style={S.roomTitle} numberOfLines={1}>{item.roomId.title}</Text>
            <View style={S.guestRow}>
              <Icon name="person-outline" size={13} color={Colors.textSecondary} />
              <Text style={S.guestName}>{item.guestId.name}</Text>
            </View>
          </View>
          <View style={S.badges}>
            <View style={[S.badge, { backgroundColor: sc.bg }]}>
              <Text style={[S.badgeText, { color: sc.color }]}>{sc.label}</Text>
            </View>
            <View style={[S.badge, { backgroundColor: pc.bg }]}>
              <Text style={[S.badgeText, { color: pc.color }]}>{pc.label}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={S.detailsGrid}>
          <View style={S.detailItem}>
            <Icon name="log-in-outline" size={14} color={Colors.brand} />
            <View style={S.detailText}>
              <Text style={S.detailLabel}>Check-in</Text>
              <Text style={S.detailValue}>{formatDate(item.checkInDate)}</Text>
            </View>
          </View>
          <View style={S.detailItem}>
            <Icon name="log-out-outline" size={14} color={Colors.error} />
            <View style={S.detailText}>
              <Text style={S.detailLabel}>Check-out</Text>
              <Text style={S.detailValue}>{formatDate(item.checkOutDate)}</Text>
            </View>
          </View>
          <View style={S.detailItem}>
            <Icon name="moon-outline" size={14} color={Colors.info} />
            <View style={S.detailText}>
              <Text style={S.detailLabel}>Nights</Text>
              <Text style={S.detailValue}>{nights}</Text>
            </View>
          </View>
          <View style={S.detailItem}>
            <Icon name="people-outline" size={14} color={Colors.success} />
            <View style={S.detailText}>
              <Text style={S.detailLabel}>Guests</Text>
              <Text style={S.detailValue}>{item.totalGuests}</Text>
            </View>
          </View>
        </View>

        {/* Price */}
        <View style={S.priceRow}>
          <Text style={S.priceLabel}>Total Amount</Text>
          <Text style={S.priceValue}>৳{item.totalPriceTk.toLocaleString()}</Text>
        </View>

        {/* Actions */}
        {item.status === 'pending' && (
          <View style={S.actionRow}>
            <Button title="Accept" onPress={() => handleAccept(item._id)} style={S.acceptBtn} size="small" />
            <Button title="Reject" variant="outline" onPress={() => handleReject(item._id)} style={S.rejectBtn} size="small" />
          </View>
        )}

        <TouchableOpacity style={S.viewBtn} onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}>
          <Text style={S.viewBtnText}>View Full Details</Text>
          <Icon name="arrow-forward" size={14} color={Colors.brand} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <Loading message="Loading reservations..." />;
  if (error && bookings.length === 0) return <ErrorState title="Failed to Load Reservations" message={error} onRetry={loadReservations} />;

  return (
    <View style={S.root}>
      {/* ── Hero strip ── */}
      <View style={S.hero}>
        <View style={S.heroCircle} />
        <View style={S.heroContent}>
          <Text style={S.heroTitle}>Reservations</Text>
          <Text style={S.heroSub}>{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Filter tabs on hero */}
        <View style={S.filterBar}>
          {filterTabs.map(t => {
            const count = t.key === 'all' ? bookings.length : bookings.filter(b => b.status === t.key).length;
            const active = filter === t.key;
            return (
              <TouchableOpacity key={t.key} style={[S.filterTab, active && S.filterTabActive]} onPress={() => setFilter(t.key)}>
                <Text style={[S.filterText, active && S.filterTextActive]}>{t.label} ({count})</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={filter === 'all' ? 'Ready for Your First Guest?' : `No ${filter} reservations`}
          message={filter === 'all' ? 'Start accepting bookings to see reservations here.' : `You don't have any ${filter} reservations.`}
          ctaText={filter === 'all' ? 'View My Listings' : undefined}
          onCtaPress={filter === 'all' ? () => navigation.navigate('HostListings') : undefined}
        />
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBooking}
          keyExtractor={item => item._id}
          contentContainerStyle={S.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  // Hero
  hero: { backgroundColor: Colors.brand, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', paddingTop: STATUS_H + 16, paddingBottom: 0 },
  heroCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -40 },
  heroContent: { paddingHorizontal: 22, paddingBottom: 14 },
  heroTitle: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Filter bar
  filterBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  filterTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', borderRadius: 20, backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER },
  filterTabActive: { backgroundColor: Colors.white },
  filterText: { fontSize: 11, fontWeight: Theme.fontWeight.medium, color: 'rgba(255,255,255,0.85)' },
  filterTextActive: { color: Colors.brand },

  list: { padding: 16 },

  // Card
  card: { backgroundColor: Colors.white, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingBottom: 12 },
  cardHeaderLeft: { flex: 1, marginRight: 10 },
  roomTitle: { fontSize: 16, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, letterSpacing: -0.2, marginBottom: 4 },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  guestName: { fontSize: 13, color: Colors.textSecondary },
  badges: { gap: 5, alignItems: 'flex-end' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: Theme.fontWeight.semibold, textTransform: 'capitalize' },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, width: '47%' },
  detailText: {},
  detailLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 1 },
  detailValue: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  priceLabel: { fontSize: 13, color: Colors.textSecondary },
  priceValue: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.brand, letterSpacing: -0.3 },

  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  acceptBtn: { flex: 1 },
  rejectBtn: { flex: 1 },

  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 13, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  viewBtnText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.brand },
});
