/**
 * Admin Hosts Screen — Glassmorphism design, Host application management (list, approve, reject)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { api, ApiResponse } from '../../api/client';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { getErrorMessage } from '../../utils/errorMessages';

const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const ADMIN_BG = '#1E293B';
const GLASS_LIGHT = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${IMG_BASE_URL}${imageUrl}`;
};

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface HostItem {
  _id: string;
  displayName: string;
  phone?: string;
  whatsapp?: string;
  locationName?: string;
  profilePictureUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  userId?: { _id: string; name?: string; email?: string; phone?: string };
  createdAt?: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  hasMore?: boolean;
}

interface HostsResponse {
  hosts: HostItem[];
  pagination: Pagination;
}

export default function AdminHostsScreen({ navigation }: any) {
  const [hosts, setHosts] = useState<HostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadHosts = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setError(null);
        setPage(1);
        setHasMore(true);
      }
      const nextPage = reset ? 1 : page;
      const statusParam = filter === 'all' ? undefined : filter;
      const response: ApiResponse<HostsResponse> = await api.admin.hosts<HostsResponse>({
        page: nextPage,
        limit: 20,
        status: statusParam,
      });

      if (response.success && response.data) {
        const { hosts: newHosts, pagination: pag } = response.data;
        setHosts(reset ? newHosts || [] : (prev) => [...prev, ...(newHosts || [])]);
        setHasMore(pag?.hasMore ?? (pag ? (pag.page || 0) < (pag.totalPages || 1) : false));
      } else {
        setError(response.message || 'Failed to load hosts');
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Hosts', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadHosts(true);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHosts(true);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || hosts.length === 0) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (!loadingMore || page === 1) return;
    const fetchMore = async () => {
      try {
        const statusParam = filter === 'all' ? undefined : filter;
        const response: ApiResponse<HostsResponse> = await api.admin.hosts<HostsResponse>({
          page,
          limit: 20,
          status: statusParam,
        });
        if (response.success && response.data) {
          const { hosts: newHosts, pagination: pag } = response.data;
          setHosts((prev) => [...prev, ...(newHosts || [])]);
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

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const response = await api.admin.approveHost(id, {});
      if (response.success) {
        Toast.show({ type: 'success', title: 'Approved', message: 'Host approved successfully' });
        loadHosts(true);
      } else {
        Toast.show({ type: 'error', title: 'Failed', message: response.message || 'Could not approve host' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Failed', message: getErrorMessage(err) });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (id: string) => {
    Alert.alert(
      'Reject Host',
      'Are you sure you want to reject this host application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionId(id);
            try {
              const response = await api.admin.rejectHost(id, {});
              if (response.success) {
                Toast.show({ type: 'success', title: 'Rejected', message: 'Host application rejected' });
                loadHosts(true);
              } else {
                Toast.show({ type: 'error', title: 'Failed', message: response.message || 'Could not reject host' });
              }
            } catch (err: any) {
              Toast.show({ type: 'error', title: 'Failed', message: getErrorMessage(err) });
            } finally {
              setActionId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: Colors.warning + '15', color: Colors.warning };
      case 'approved':
        return { backgroundColor: Colors.success + '15', color: Colors.success };
      case 'rejected':
        return { backgroundColor: Colors.error + '15', color: Colors.error };
      default:
        return { backgroundColor: Colors.gray100, color: Colors.gray600 };
    }
  };

  const filterTabs: Array<{ key: FilterStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const renderHost = ({ item }: { item: HostItem }) => {
    const badge = getStatusBadge(item.status);
    const profileUri = item.profilePictureUrl ? getImageUrl(item.profilePictureUrl) : '';

    return (
      <View style={S.card}>
        <View style={S.cardContent}>
          {profileUri ? (
            <Image source={{ uri: profileUri }} style={S.profilePic} />
          ) : (
            <View style={S.profilePlaceholder}>
              <Icon name="person-outline" size={20} color={Colors.gray400} />
            </View>
          )}
          <View style={S.hostInfo}>
            <Text style={S.displayName} numberOfLines={1}>
              {item.displayName || item.userId?.name || 'Unknown'}
            </Text>
            {item.locationName ? (
              <View style={S.locationRow}>
                <Icon name="location-outline" size={13} color={Colors.textSecondary} />
                <Text style={S.locationText} numberOfLines={1}>
                  {item.locationName}
                </Text>
              </View>
            ) : null}
            <View style={[S.statusBadge, { backgroundColor: badge.backgroundColor }]}>
              <Text style={[S.statusText, { color: badge.color }]}>{item.status}</Text>
            </View>
            {item.status === 'pending' && (
              <View style={S.actionsRow}>
                <TouchableOpacity
                  style={[S.approveBtn, actionId === item._id && S.btnDisabled]}
                  onPress={() => handleApprove(item._id)}
                  disabled={!!actionId}
                >
                  <Icon name="checkmark-circle" size={16} color={Colors.white} />
                  <Text style={S.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.rejectBtn, actionId === item._id && S.btnDisabled]}
                  onPress={() => handleReject(item._id)}
                  disabled={!!actionId}
                >
                  <Icon name="close-circle" size={16} color={Colors.white} />
                  <Text style={S.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
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
          <Text style={S.heroTitle}>Host Management</Text>
          <Text style={S.heroSub}>Approve or reject host applications</Text>
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
        <Icon name="people-outline" size={36} color={Colors.brand} />
      </View>
      <Text style={S.emptyTitle}>No Hosts</Text>
      <Text style={S.emptyText}>
        {filter === 'all' ? 'No host applications found' : `No ${filter} hosts`}
      </Text>
    </View>
  );

  const ListFooter = () =>
    loadingMore ? (
      <View style={S.footerLoader}>
        <Text style={S.footerLoaderText}>Loading more...</Text>
      </View>
    ) : null;

  if (loading) return <Loading message="Loading hosts..." />;
  if (error && hosts.length === 0)
    return <ErrorState title="Failed to Load Hosts" message={error} onRetry={() => loadHosts(true)} />;

  return (
    <View style={S.root}>
      <FlatList
        data={hosts}
        renderItem={renderHost}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={hosts.length === 0 ? S.listEmpty : S.list}
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
  },
  cardContent: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInfo: { flex: 1, marginLeft: 14 },
  displayName: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locationText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, textTransform: 'capitalize' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.success,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.error,
  },
  actionBtnText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
  btnDisabled: { opacity: 0.6 },

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
