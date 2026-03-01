/**
 * Admin Users Screen — Glassmorphism design, User management (list, suspend, unsuspend)
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
  Dimensions,
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

type FilterRole = 'all' | 'guest' | 'host' | 'admin';

interface UserItem {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'guest' | 'host' | 'admin';
  suspended: boolean;
  profilePictureUrl?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages?: number;
  pages?: number;
  hasMore?: boolean;
}

interface UsersResponse {
  users: UserItem[];
  pagination: Pagination;
}

export default function AdminUsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterRole>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (reset = true) => {
      try {
        if (reset) {
          setError(null);
          setPage(1);
          setHasMore(true);
        }
        const nextPage = reset ? 1 : page;
        const response: ApiResponse<UsersResponse> = await api.admin.users<UsersResponse>({
          page: nextPage,
          limit: 20,
          role: filter !== 'all' ? filter : undefined,
        });

        if (response.success && response.data) {
          const { users: newUsers, pagination: pag } = response.data;
          const pagination = pag as Pagination & { pages?: number };
          setUsers(reset ? newUsers || [] : (prev) => [...prev, ...(newUsers || [])]);
          const totalPages = pagination?.pages ?? pagination?.totalPages ?? 1;
          setHasMore(
            pagination?.hasMore ?? (pagination ? (pagination.page || 0) < totalPages : false)
          );
        } else {
          setError(response.message || 'Failed to load users');
        }
      } catch (err: any) {
        const msg = getErrorMessage(err);
        setError(msg);
        Toast.show({ type: 'error', title: 'Failed to Load Users', message: msg });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter, page]
  );

  useEffect(() => {
    loadUsers(true);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers(true);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || users.length === 0) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (!loadingMore || page === 1) return;
    const fetchMore = async () => {
      try {
        const response: ApiResponse<UsersResponse> = await api.admin.users<UsersResponse>({
          page,
          limit: 20,
          role: filter !== 'all' ? filter : undefined,
        });
        if (response.success && response.data) {
          const { users: newUsers, pagination: pag } = response.data;
          const pagination = pag as Pagination & { pages?: number };
          setUsers((prev) => [...prev, ...(newUsers || [])]);
          const totalPages = pagination?.pages ?? pagination?.totalPages ?? 1;
          setHasMore(
            pagination?.hasMore ?? (pagination ? (pagination.page || 0) < totalPages : false)
          );
        }
      } catch (err: any) {
        Toast.show({ type: 'error', title: 'Failed to Load More', message: getErrorMessage(err) });
      } finally {
        setLoadingMore(false);
      }
    };
    fetchMore();
  }, [page, loadingMore, filter]);

  const handleSuspend = (user: UserItem) => {
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend ${user.name}? They will not be able to access the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            setActionId(user._id);
            try {
              const response = await api.admin.suspendUser(user._id);
              if (response.success) {
                Toast.show({ type: 'success', title: 'Suspended', message: `${user.name} has been suspended` });
                loadUsers(true);
              } else {
                Toast.show({
                  type: 'error',
                  title: 'Failed',
                  message: response.message || 'Could not suspend user',
                });
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

  const handleUnsuspend = (user: UserItem) => {
    Alert.alert(
      'Unsuspend User',
      `Are you sure you want to unsuspend ${user.name}? They will regain access to the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsuspend',
          onPress: async () => {
            setActionId(user._id);
            try {
              const response = await api.admin.unsuspendUser(user._id);
              if (response.success) {
                Toast.show({ type: 'success', title: 'Unsuspended', message: `${user.name} has been unsuspended` });
                loadUsers(true);
              } else {
                Toast.show({
                  type: 'error',
                  title: 'Failed',
                  message: response.message || 'Could not unsuspend user',
                });
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'guest':
        return Colors.info;
      case 'host':
        return Colors.brand;
      case 'admin':
        return '#8B5CF6';
      default:
        return Colors.gray600;
    }
  };

  const filterTabs: Array<{ key: FilterRole; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'guest', label: 'Guest' },
    { key: 'host', label: 'Host' },
    { key: 'admin', label: 'Admin' },
  ];

  const renderUser = ({ item }: { item: UserItem }) => {
    const roleColor = getRoleBadgeColor(item.role);
    const imageUri = item.profilePictureUrl ? getImageUrl(item.profilePictureUrl) : '';

    return (
      <View style={S.card}>
        <View style={S.userRow}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={S.avatar} />
          ) : (
            <View style={S.avatarPlaceholder}>
              <Icon name="person-outline" size={20} color={Colors.gray400} />
            </View>
          )}
          <View style={S.userInfo}>
            <Text style={S.userName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.email ? (
              <Text style={S.userEmail} numberOfLines={1}>
                {item.email}
              </Text>
            ) : null}
            <View style={S.badgesRow}>
              <View style={[S.roleBadge, { backgroundColor: roleColor + '18' }]}>
                <Text style={[S.roleText, { color: roleColor }]}>{item.role}</Text>
              </View>
              {item.suspended && (
                <View style={[S.suspendedBadge]}>
                  <Text style={S.suspendedText}>Suspended</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={S.actionsRow}>
          {item.suspended ? (
            <TouchableOpacity
              style={[S.unsuspendBtn, actionId === item._id && S.btnDisabled]}
              onPress={() => handleUnsuspend(item)}
              disabled={!!actionId}
            >
              <Icon name="checkmark-circle-outline" size={16} color={Colors.white} />
              <Text style={S.actionBtnText}>Unsuspend</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[S.suspendBtn, actionId === item._id && S.btnDisabled]}
              onPress={() => handleSuspend(item)}
              disabled={!!actionId}
            >
              <Icon name="ban-outline" size={16} color={Colors.white} />
              <Text style={S.actionBtnText}>Suspend</Text>
            </TouchableOpacity>
          )}
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
          <Text style={S.heroTitle}>User Management</Text>
          <Text style={S.heroSub}>Manage users, suspend or unsuspend accounts</Text>
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
      <Text style={S.emptyTitle}>No Users</Text>
      <Text style={S.emptyText}>
        {filter === 'all' ? 'No users found' : `No ${filter} users`}
      </Text>
    </View>
  );

  const ListFooter = () =>
    loadingMore ? (
      <View style={S.footerLoader}>
        <Text style={S.footerLoaderText}>Loading more...</Text>
      </View>
    ) : null;

  if (loading) return <Loading message="Loading users..." />;
  if (error && users.length === 0)
    return <ErrorState title="Failed to Load Users" message={error} onRetry={() => loadUsers(true)} />;

  return (
    <View style={S.root}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={users.length === 0 ? S.listEmpty : S.list}
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
    paddingBottom: 16,
  },
  heroEyebrow: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: Theme.fontWeight.medium, marginBottom: 2 },
  heroTitle: {
    fontSize: 28,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 16 },

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
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, marginLeft: 12, minWidth: 0 },
  userName: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  userEmail: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, textTransform: 'capitalize' },
  suspendedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.error + '15',
  },
  suspendedText: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.error },
  actionsRow: { marginTop: 4 },
  suspendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.error,
  },
  unsuspendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.success,
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
