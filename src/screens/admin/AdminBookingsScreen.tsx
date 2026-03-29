/**
 * Admin Bookings Screen — Glassmorphism design, View all bookings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { api } from '../../api/client';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';
import { format } from 'date-fns';

const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const ADMIN_BG = '#1E293B';
const GLASS_LIGHT = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface BookingItem {
  _id: string;
  roomId: {
    _id: string;
    title: string;
    locationName: string;
    images: Array<{ url: string }>;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  amountTk: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  hasMore?: boolean;
}

interface AdminBookingsApiResponse {
  success: boolean;
  data?: BookingItem[];
  pagination?: Pagination;
  message?: string;
}

export default function AdminBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadBookings = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setError(null);
        setPage(1);
        setHasMore(true);
      }
      const nextPage = reset ? 1 : page;
      const statusParam = filter === 'all' ? undefined : filter;
      const response = await api.admin.bookings<BookingItem[]>({
        page: nextPage,
        limit: 20,
        status: statusParam,
      }) as unknown as AdminBookingsApiResponse;

      if (response.success) {
        const newBookings = response.data || [];
        const pag = response.pagination;
        setBookings(reset ? newBookings : (prev) => [...prev, ...newBookings]);
        setHasMore(pag?.hasMore ?? (pag ? (pag.page || 0) < (pag.totalPages || 1) : false));
      } else {
        setError(response.message || 'Failed to load bookings');
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Bookings', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadBookings(true);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings(true);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || bookings.length === 0) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (!loadingMore || page === 1) return;
    const fetchMore = async () => {
      try {
        const statusParam = filter === 'all' ? undefined : filter;
        const response = await api.admin.bookings<BookingItem[]>({
          page,
          limit: 20,
          status: statusParam,
        }) as unknown as AdminBookingsApiResponse;
        if (response.success) {
          const newBookings = response.data || [];
          const pag = response.pagination;
          setBookings((prev) => [...prev, ...newBookings]);
          setHasMore(pag?.hasMore ?? (pag ? (pag.page || 0) < (pag.totalPages || 1) : false));
        }
      } catch (err: any) {
        Toast.show({ type: 'error', title: 'Failed to Load More', message: getErrorMessage(err) });
      } finally {
        setLoadingMore(false);
      }
    };
    fetchMore();
  }, [page, loadingMore, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'confirmed':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      case 'completed':
        return Colors.info;
      default:
        return Colors.gray500;
    }
  };

  const getPaymentColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      case 'refunded':
        return Colors.info;
      default:
        return Colors.gray500;
    }
  };

  const filterTabs: Array<{ key: FilterStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const renderBooking = ({ item }: { item: BookingItem }) => {
    const room = item.roomId || {};
    const user = item.userId || {};
    const statusColor = getStatusColor(item.status);
    const paymentColor = getPaymentColor(item.paymentStatus);

    return (
      <TouchableOpacity
        style={S.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate?.('BookingDetail', { bookingId: item._id })}
      >
        <Text style={S.roomTitle} numberOfLines={2}>
          {(room as any).title || 'Room'}
        </Text>
        <View style={S.userRow}>
          <Icon name="person-outline" size={14} color={Colors.textSecondary} />
          <Text style={S.userText} numberOfLines={1}>
            {(user as any).name || (user as any).email || 'Guest'}
          </Text>
        </View>
        <View style={S.datesRow}>
          <Icon name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={S.datesText}>
            {format(new Date(item.checkIn), 'dd MMM yyyy')} → {format(new Date(item.checkOut), 'dd MMM yyyy')}
          </Text>
        </View>
        <View style={S.guestsRow}>
          <Icon name="people-outline" size={14} color={Colors.textSecondary} />
          <Text style={S.guestsText}>{item.guests || 1} guest{(item.guests || 1) !== 1 ? 's' : ''}</Text>
        </View>
        <View style={S.footerRow}>
          <Text style={S.amountText}>৳{(item.amountTk || 0).toLocaleString()}</Text>
          <View style={S.badgesRow}>
            <View style={[S.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[S.badgeText, { color: statusColor }]}>{item.status}</Text>
            </View>
            <View style={[S.paymentBadge, { backgroundColor: paymentColor + '20' }]}>
              <Text style={[S.badgeText, { color: paymentColor }]}>{item.paymentStatus}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      <View style={S.heroWrapper}>
        <View style={S.heroBg} />
        <View style={S.heroCircle1} />
        <View style={S.heroCircle2} />
        <View style={S.heroContent}>
          <Text style={S.heroEyebrow}>Admin</Text>
          <Text style={S.heroTitle}>All Bookings</Text>
          <Text style={S.heroSub}>View and manage all reservations</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.filterScroll}
          style={S.filterWrapper}
        >
          {filterTabs.map((t) => {
            const active = filter === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[S.filterChip, active && S.filterChipActive]}
                onPress={() => setFilter(t.key)}
              >
                <Text style={[S.filterText, active && S.filterTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={S.body} />
    </>
  );

  const ListEmpty = () => (
    <View style={S.emptyContainer}>
      <View style={S.emptyIconWrap}>
        <Icon name="calendar-outline" size={36} color={Colors.brand} />
      </View>
      <Text style={S.emptyTitle}>No Bookings</Text>
      <Text style={S.emptyText}>
        {filter === 'all' ? 'No bookings found' : `No ${filter} bookings`}
      </Text>
    </View>
  );

  const ListFooter = () =>
    loadingMore ? (
      <View style={S.footerLoader}>
        <Text style={S.footerLoaderText}>Loading more...</Text>
      </View>
    ) : null;

  if (loading) return <Loading message="Loading bookings..." />;
  if (error && bookings.length === 0)
    return <ErrorState title="Failed to Load Bookings" message={error} onRetry={() => loadBookings(true)} />;

  return (
    <View style={S.root}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={bookings.length === 0 ? S.listEmpty : S.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  heroWrapper: { paddingBottom: 0, overflow: 'visible' },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ADMIN_BG,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139,92,246,0.12)',
    top: -50,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(59,130,246,0.10)',
    top: 30,
    left: -40,
  },
  heroContent: {
    paddingTop: STATUS_H + 20,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  heroEyebrow: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: Theme.fontWeight.medium, marginBottom: 2 },
  heroTitle: {
    fontSize: 28,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20 },

  filterWrapper: { paddingBottom: 16 },
  filterScroll: { paddingHorizontal: 22, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: GLASS_LIGHT,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    marginRight: 10,
  },
  filterChipActive: { backgroundColor: Colors.white, borderColor: Colors.gray200 },
  filterText: { fontSize: 14, fontWeight: Theme.fontWeight.medium, color: 'rgba(255,255,255,0.9)' },
  filterTextActive: { color: ADMIN_BG },

  body: { paddingHorizontal: 16, paddingTop: 4 },

  list: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  listEmpty: { flexGrow: 1, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
    padding: 16,
  },
  roomTitle: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  userText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  datesText: { fontSize: 13, color: Colors.textSecondary },
  guestsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  guestsText: { fontSize: 13, color: Colors.textSecondary },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  amountText: {
    fontSize: 18,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
  },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, textTransform: 'capitalize' },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.brand + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  footerLoaderText: { fontSize: 13, color: Colors.textSecondary },
});
