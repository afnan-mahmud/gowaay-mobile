/**
 * Admin Partial Payments Screen — Glassmorphism design
 * View all partial payments with status filters and date-wise sorting.
 * Accessible by all admin levels (super_admin, admin, moderator).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  ScrollView,
  Clipboard,
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

type FilterStatus = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled';
type SortOrder = 'newest' | 'oldest';

interface PartialPaymentItem {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  amountTk: number;
  note?: string;
  gateway: string;
  sessionId?: string;
  merchantTransactionId?: string;
  gatewayTransactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface StatsMap {
  [key: string]: { count: number; totalAmount: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: '#D97706', icon: 'time-outline' },
  completed: { label: 'Completed', color: '#059669', icon: 'checkmark-circle-outline' },
  failed: { label: 'Failed', color: '#DC2626', icon: 'close-circle-outline' },
  cancelled: { label: 'Cancelled', color: '#6B7280', icon: 'ban-outline' },
};

export default function AdminPartialPaymentsScreen({ navigation }: any) {
  const [payments, setPayments] = useState<PartialPaymentItem[]>([]);
  const [stats, setStats] = useState<StatsMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<PartialPaymentItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadPayments = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setError(null);
        setPage(1);
        setHasMore(true);
      }
      const nextPage = reset ? 1 : page;
      const statusParam = filter === 'all' ? undefined : filter;
      const response = await api.admin.partialPayments({
        page: nextPage,
        limit: 20,
        status: statusParam,
      }) as any;

      if (response.success && response.data) {
        const d = response.data;
        const newPayments = d.payments || [];
        const pag = d.pagination;
        setPayments(reset ? newPayments : (prev: PartialPaymentItem[]) => [...prev, ...newPayments]);
        setTotalCount(pag?.total || 0);
        setHasMore(pag ? pag.page < pag.pages : false);
        if (d.stats) setStats(d.stats);
      } else {
        setError(response.message || 'Failed to load partial payments');
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter, page]);

  useEffect(() => {
    setLoading(true);
    loadPayments(true);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments(true);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || payments.length === 0) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (!loadingMore || page === 1) return;
    const fetchMore = async () => {
      try {
        const statusParam = filter === 'all' ? undefined : filter;
        const response = await api.admin.partialPayments({
          page,
          limit: 20,
          status: statusParam,
        }) as any;
        if (response.success && response.data) {
          const d = response.data;
          const newPayments = d.payments || [];
          const pag = d.pagination;
          setPayments((prev) => [...prev, ...newPayments]);
          setHasMore(pag ? pag.page < pag.pages : false);
        }
      } catch (err: any) {
        Toast.show({ type: 'error', title: 'Failed to Load More', message: getErrorMessage(err) });
      } finally {
        setLoadingMore(false);
      }
    };
    fetchMore();
  }, [page, loadingMore, filter]);

  const sortedPayments = React.useMemo(() => {
    const sorted = [...payments];
    sorted.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return sorted;
  }, [payments, sortOrder]);

  const copyToClipboard = (text: string, field: string) => {
    Clipboard.setString(text);
    setCopiedField(field);
    Toast.show({ type: 'success', title: 'Copied', message: `${field} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const totalCompleted = stats.completed?.totalAmount || 0;
  const countCompleted = stats.completed?.count || 0;
  const countPending = stats.pending?.count || 0;
  const totalAll = Object.values(stats).reduce((sum, s) => sum + s.count, 0);

  const filterTabs: Array<{ key: FilterStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const renderPayment = ({ item }: { item: PartialPaymentItem }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <TouchableOpacity
        style={S.card}
        activeOpacity={0.8}
        onPress={() => setSelectedPayment(item)}
      >
        <View style={S.cardHeader}>
          <View style={S.cardNameWrap}>
            <Text style={S.cardName} numberOfLines={1}>{item.name}</Text>
            {item.email ? <Text style={S.cardEmail} numberOfLines={1}>{item.email}</Text> : null}
          </View>
          <View style={[S.statusBadge, { backgroundColor: cfg.color + '18' }]}>
            <Icon name={cfg.icon} size={13} color={cfg.color} />
            <Text style={[S.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={S.cardRow}>
          <Icon name="call-outline" size={14} color={Colors.textSecondary} />
          <Text style={S.cardRowText}>{item.phone}</Text>
        </View>

        {item.gatewayTransactionId ? (
          <View style={S.cardRow}>
            <Icon name="receipt-outline" size={14} color={Colors.textSecondary} />
            <Text style={S.cardRowText} numberOfLines={1}>Txn: {item.gatewayTransactionId}</Text>
          </View>
        ) : null}

        <View style={S.cardFooter}>
          <Text style={S.cardAmount}>৳{item.amountTk.toLocaleString()}</Text>
          <Text style={S.cardDate}>{format(new Date(item.createdAt), 'dd MMM yyyy, hh:mm a')}</Text>
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
          <Text style={S.heroTitle}>Partial Payments</Text>
          <Text style={S.heroSub}>Track and manage all partial payments</Text>
        </View>

        {/* Stats Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.statsScroll}
        >
          <View style={S.statCard}>
            <Icon name="trending-up-outline" size={20} color="#10B981" />
            <Text style={S.statAmount}>৳{totalCompleted.toLocaleString()}</Text>
            <Text style={S.statLabel}>Received</Text>
          </View>
          <View style={S.statCard}>
            <Icon name="checkmark-circle-outline" size={20} color="#3B82F6" />
            <Text style={S.statAmount}>{countCompleted}</Text>
            <Text style={S.statLabel}>Successful</Text>
          </View>
          <View style={S.statCard}>
            <Icon name="time-outline" size={20} color="#F59E0B" />
            <Text style={S.statAmount}>{countPending}</Text>
            <Text style={S.statLabel}>Pending</Text>
          </View>
          <View style={S.statCard}>
            <Icon name="card-outline" size={20} color="#6B7280" />
            <Text style={S.statAmount}>{totalAll}</Text>
            <Text style={S.statLabel}>Total</Text>
          </View>
        </ScrollView>

        {/* Filter chips */}
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

      {/* Sort toggle */}
      <View style={S.sortRow}>
        <Text style={S.sortLabel}>
          {totalCount} payment{totalCount !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={S.sortButton}
          onPress={() => setSortOrder((o) => (o === 'newest' ? 'oldest' : 'newest'))}
          activeOpacity={0.7}
        >
          <Icon
            name={sortOrder === 'newest' ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={15}
            color={Colors.brand}
          />
          <Text style={S.sortButtonText}>
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const ListEmpty = () => (
    <View style={S.emptyContainer}>
      <View style={S.emptyIconWrap}>
        <Icon name="card-outline" size={36} color={Colors.brand} />
      </View>
      <Text style={S.emptyTitle}>No Payments</Text>
      <Text style={S.emptyText}>
        {filter === 'all' ? 'No partial payments found' : `No ${filter} payments`}
      </Text>
    </View>
  );

  const ListFooter = () =>
    loadingMore ? (
      <View style={S.footerLoader}>
        <Text style={S.footerLoaderText}>Loading more...</Text>
      </View>
    ) : null;

  if (loading) return <Loading message="Loading partial payments..." />;
  if (error && payments.length === 0)
    return <ErrorState title="Failed to Load" message={error} onRetry={() => loadPayments(true)} />;

  return (
    <View style={S.root}>
      <FlatList
        data={sortedPayments}
        renderItem={renderPayment}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={payments.length === 0 ? S.listEmpty : S.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />

      {/* Detail Modal */}
      <Modal visible={!!selectedPayment} transparent animationType="slide" onRequestClose={() => setSelectedPayment(null)}>
        <View style={S.modalOverlay}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />

            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Payment Details</Text>
              <TouchableOpacity onPress={() => setSelectedPayment(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="close-outline" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <ScrollView showsVerticalScrollIndicator={false} style={S.modalBody}>
                {/* Status & Amount */}
                <View style={S.detailRow}>
                  <Text style={S.detailLabel}>Status</Text>
                  <View style={[S.statusBadge, { backgroundColor: STATUS_CONFIG[selectedPayment.status].color + '18' }]}>
                    <Icon name={STATUS_CONFIG[selectedPayment.status].icon} size={13} color={STATUS_CONFIG[selectedPayment.status].color} />
                    <Text style={[S.statusBadgeText, { color: STATUS_CONFIG[selectedPayment.status].color }]}>
                      {STATUS_CONFIG[selectedPayment.status].label}
                    </Text>
                  </View>
                </View>

                <View style={S.detailRow}>
                  <Text style={S.detailLabel}>Amount</Text>
                  <Text style={S.detailAmountValue}>৳{selectedPayment.amountTk.toLocaleString()}</Text>
                </View>

                <View style={S.detailDivider} />

                {/* Customer Info */}
                <Text style={S.detailSectionTitle}>Customer Info</Text>
                <View style={S.detailRow}>
                  <Text style={S.detailLabel}>Name</Text>
                  <Text style={S.detailValue}>{selectedPayment.name}</Text>
                </View>
                <View style={S.detailRow}>
                  <Text style={S.detailLabel}>Phone</Text>
                  <Text style={S.detailValue}>{selectedPayment.phone}</Text>
                </View>
                {selectedPayment.email ? (
                  <View style={S.detailRow}>
                    <Text style={S.detailLabel}>Email</Text>
                    <Text style={S.detailValue}>{selectedPayment.email}</Text>
                  </View>
                ) : null}

                {selectedPayment.note ? (
                  <>
                    <View style={S.detailDivider} />
                    <Text style={S.detailSectionTitle}>Note / Reference</Text>
                    <View style={S.noteBox}>
                      <Text style={S.noteText}>{selectedPayment.note}</Text>
                    </View>
                  </>
                ) : null}

                <View style={S.detailDivider} />

                {/* Transaction Info */}
                <Text style={S.detailSectionTitle}>Transaction Info</Text>

                {selectedPayment.gatewayTransactionId ? (
                  <View style={S.detailRow}>
                    <Text style={S.detailLabel}>EPS Txn ID</Text>
                    <TouchableOpacity
                      style={S.copyRow}
                      onPress={() => copyToClipboard(selectedPayment.gatewayTransactionId!, 'EPS Txn ID')}
                    >
                      <Text style={S.detailValueMono} numberOfLines={1}>{selectedPayment.gatewayTransactionId}</Text>
                      <Icon
                        name={copiedField === 'EPS Txn ID' ? 'checkmark-outline' : 'copy-outline'}
                        size={14}
                        color={copiedField === 'EPS Txn ID' ? '#059669' : Colors.gray400}
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {selectedPayment.merchantTransactionId ? (
                  <View style={S.detailRow}>
                    <Text style={S.detailLabel}>Merchant Txn</Text>
                    <TouchableOpacity
                      style={S.copyRow}
                      onPress={() => copyToClipboard(selectedPayment.merchantTransactionId!, 'Merchant Txn')}
                    >
                      <Text style={[S.detailValueMono, { fontSize: 11 }]} numberOfLines={1}>{selectedPayment.merchantTransactionId}</Text>
                      <Icon
                        name={copiedField === 'Merchant Txn' ? 'checkmark-outline' : 'copy-outline'}
                        size={14}
                        color={copiedField === 'Merchant Txn' ? '#059669' : Colors.gray400}
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={S.detailRow}>
                  <Text style={S.detailLabel}>Payment ID</Text>
                  <TouchableOpacity
                    style={S.copyRow}
                    onPress={() => copyToClipboard(selectedPayment._id, 'Payment ID')}
                  >
                    <Text style={[S.detailValueMono, { fontSize: 11 }]} numberOfLines={1}>{selectedPayment._id}</Text>
                    <Icon
                      name={copiedField === 'Payment ID' ? 'checkmark-outline' : 'copy-outline'}
                      size={14}
                      color={copiedField === 'Payment ID' ? '#059669' : Colors.gray400}
                    />
                  </TouchableOpacity>
                </View>

                <View style={S.detailRow}>
                  <Text style={S.detailLabel}>Gateway</Text>
                  <Text style={[S.detailValue, { textTransform: 'uppercase' }]}>{selectedPayment.gateway}</Text>
                </View>

                <View style={S.detailRow}>
                  <Text style={S.detailLabel}>Created</Text>
                  <Text style={S.detailValue}>{format(new Date(selectedPayment.createdAt), 'dd MMM yyyy, hh:mm:ss a')}</Text>
                </View>

                {selectedPayment.updatedAt !== selectedPayment.createdAt ? (
                  <View style={S.detailRow}>
                    <Text style={S.detailLabel}>Updated</Text>
                    <Text style={S.detailValue}>{format(new Date(selectedPayment.updatedAt), 'dd MMM yyyy, hh:mm:ss a')}</Text>
                  </View>
                ) : null}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  heroWrapper: { paddingBottom: 0, overflow: 'visible' },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: ADMIN_BG,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(139,92,246,0.12)', top: -50, right: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(59,130,246,0.10)', top: 30, left: -40,
  },
  heroContent: {
    paddingTop: STATUS_H + 20, paddingHorizontal: 22, paddingBottom: 16,
  },
  heroEyebrow: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: Theme.fontWeight.medium, marginBottom: 2 },
  heroTitle: {
    fontSize: 28, fontWeight: Theme.fontWeight.bold, color: Colors.white,
    letterSpacing: -0.5, marginBottom: 2,
  },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 8 },

  // Stats
  statsScroll: { paddingHorizontal: 22, paddingBottom: 14, gap: 10 },
  statCard: {
    backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    alignItems: 'center', minWidth: 100, gap: 4,
  },
  statAmount: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: Theme.fontWeight.medium },

  // Filters
  filterWrapper: { paddingBottom: 16 },
  filterScroll: { paddingHorizontal: 22, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER,
    marginRight: 10,
  },
  filterChipActive: { backgroundColor: Colors.white, borderColor: Colors.gray200 },
  filterText: { fontSize: 14, fontWeight: Theme.fontWeight.medium, color: 'rgba(255,255,255,0.9)' },
  filterTextActive: { color: ADMIN_BG },

  // Sort
  sortRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6,
  },
  sortLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: Theme.fontWeight.medium },
  sortButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.gray200,
    ...Theme.shadows.sm,
  },
  sortButtonText: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.brand },

  // List
  list: { padding: 16, paddingTop: 4, paddingBottom: 40 },
  listEmpty: { flexGrow: 1, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: Colors.white, borderRadius: 20, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm, padding: 16,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 10, gap: 10,
  },
  cardNameWrap: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 2 },
  cardEmail: { fontSize: 12, color: Colors.textSecondary },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cardRowText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.gray100, marginTop: 4,
  },
  cardAmount: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  cardDate: { fontSize: 12, color: Colors.textSecondary },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 12, fontWeight: Theme.fontWeight.semibold },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.brand + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  // Footer
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  footerLoaderText: { fontSize: 13, color: Colors.textSecondary },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray300,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  modalTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  modalBody: { paddingHorizontal: 20, paddingTop: 16 },

  // Detail rows
  detailRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, gap: 12,
  },
  detailLabel: { fontSize: 13, color: Colors.textSecondary, minWidth: 90 },
  detailValue: { fontSize: 14, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary, textAlign: 'right', flex: 1 },
  detailAmountValue: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  detailValueMono: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  detailSectionTitle: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 4, marginTop: 4 },
  detailDivider: { height: 1, backgroundColor: Colors.gray100, marginVertical: 12 },

  copyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },

  noteBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginTop: 4 },
  noteText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
