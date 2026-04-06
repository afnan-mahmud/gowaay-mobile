/**
 * Admin Rooms Screen — Glassmorphism design
 * Room management: list, search, view details, approve (with commission), reject, edit
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { getErrorMessage } from '../../utils/errorMessages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

interface RoomItem {
  _id: string;
  title: string;
  description: string;
  address: string;
  locationName: string;
  basePriceTk: number;
  commissionTk: number;
  totalPriceTk: number;
  maxGuests: number;
  beds: number;
  baths: number;
  placeType?: string;
  propertyType?: string;
  amenities?: string[];
  status: 'pending' | 'approved' | 'rejected';
  instantBooking?: boolean;
  images: Array<{ url: string; w?: number; h?: number }>;
  hostId?: {
    _id: string;
    displayName: string;
    locationName?: string;
  } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  hasMore?: boolean;
}

interface AdminRoomsApiResponse {
  success: boolean;
  data?: RoomItem[];
  pagination?: Pagination;
  message?: string;
}

const PLACE_TYPE_LABELS: Record<string, string> = {
  entire_place: 'Entire Place',
  private_room: 'Private Room',
  shared_room: 'Shared Room',
  studio_apartment: 'Studio Apartment',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  hotel: 'Hotel',
  resort: 'Resort',
  apartment: 'Apartment',
  guest_house: 'Guest House',
  villa: 'Villa',
  hostel_beds: 'Hostel Beds',
  farm_house: 'Farm House',
};

export default function AdminRoomsScreen({ navigation }: any) {
  const { user } = useAuth();
  const isModerator = user?.adminLevel === 'moderator';
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Details modal
  const [detailRoom, setDetailRoom] = useState<RoomItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Approve modal with commission
  const [approveRoom, setApproveRoom] = useState<RoomItem | null>(null);
  const [commissionTk, setCommissionTk] = useState('');

  const loadRooms = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setError(null);
        setPage(1);
        setHasMore(true);
      }
      const nextPage = reset ? 1 : page;
      const statusParam = filter === 'all' ? undefined : filter;
      const response = await api.admin.rooms<RoomItem[]>({
        page: nextPage,
        limit: 20,
        status: statusParam,
      }) as unknown as AdminRoomsApiResponse;

      if (response.success) {
        const newRooms = response.data || [];
        const pag = response.pagination;
        setRooms(reset ? newRooms : (prev) => [...prev, ...newRooms]);
        setHasMore(pag?.hasMore ?? (pag ? (pag.page || 0) < (pag.totalPages || 1) : false));
      } else {
        setError(response.message || 'Failed to load rooms');
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Rooms', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadRooms(true);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRooms(true);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || rooms.length === 0) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (!loadingMore || page === 1) return;
    const fetchMore = async () => {
      try {
        const statusParam = filter === 'all' ? undefined : filter;
        const response = await api.admin.rooms<RoomItem[]>({
          page,
          limit: 20,
          status: statusParam,
        }) as unknown as AdminRoomsApiResponse;
        if (response.success) {
          const newRooms = response.data || [];
          const pag = response.pagination;
          setRooms((prev) => [...prev, ...newRooms]);
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

  // Client-side search filtering (matches web behavior)
  const filteredRooms = searchQuery.trim()
    ? rooms.filter((room) => {
        const q = searchQuery.toLowerCase();
        return (
          room.title.toLowerCase().includes(q) ||
          room.locationName.toLowerCase().includes(q) ||
          (room.hostId?.displayName?.toLowerCase().includes(q) ?? false)
        );
      })
    : rooms;

  // Open detail modal — load full room data from admin endpoint
  const openDetail = async (room: RoomItem) => {
    setDetailRoom(room);
    setDetailLoading(true);
    try {
      const response = await api.admin.getRoom(room._id);
      if (response.success && response.data) {
        setDetailRoom(response.data as RoomItem);
      }
    } catch {
      // Use list data as fallback
    } finally {
      setDetailLoading(false);
    }
  };

  // Approve with commission
  const openApproveModal = (room: RoomItem) => {
    setApproveRoom(room);
    setCommissionTk(room.commissionTk?.toString() || '0');
  };

  const handleApproveWithCommission = async () => {
    if (!approveRoom) return;
    const commVal = parseFloat(commissionTk) || 0;
    setActionId(approveRoom._id);
    try {
      const response = await api.admin.approveRoom(approveRoom._id, {
        status: 'approved',
        commissionTk: commVal,
      });
      if (response.success) {
        Toast.show({ type: 'success', title: 'Approved', message: 'Room approved successfully' });
        setApproveRoom(null);
        setDetailRoom(null);
        loadRooms(true);
      } else {
        Toast.show({ type: 'error', title: 'Failed', message: response.message || 'Could not approve room' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Failed', message: getErrorMessage(err) });
    } finally {
      setActionId(null);
    }
  };

  // Quick approve (uses existing commission, like web)
  const handleQuickApprove = async (room: RoomItem) => {
    setActionId(room._id);
    try {
      const response = await api.admin.approveRoom(room._id, {
        status: 'approved',
        commissionTk: room.commissionTk || 0,
      });
      if (response.success) {
        Toast.show({ type: 'success', title: 'Approved', message: 'Room approved successfully' });
        loadRooms(true);
      } else {
        Toast.show({ type: 'error', title: 'Failed', message: response.message || 'Could not approve room' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Failed', message: getErrorMessage(err) });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (id: string) => {
    Alert.alert(
      'Reject Room',
      'Are you sure you want to reject this room listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionId(id);
            try {
              const response = await api.admin.rejectRoom(id, { status: 'rejected' });
              if (response.success) {
                Toast.show({ type: 'success', title: 'Rejected', message: 'Room rejected' });
                setDetailRoom(null);
                loadRooms(true);
              } else {
                Toast.show({ type: 'error', title: 'Failed', message: response.message || 'Could not reject room' });
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

  const renderRoom = ({ item }: { item: RoomItem }) => {
    const badge = getStatusBadge(item.status);
    const firstImage = item.images?.[0]?.url;
    const imageUri = firstImage ? getImageUrl(firstImage) : '';

    return (
      <TouchableOpacity
        style={S.card}
        onPress={() => openDetail(item)}
        activeOpacity={0.8}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={S.roomImage} resizeMode="cover" />
        ) : (
          <View style={S.roomImagePlaceholder}>
            <Icon name="home-outline" size={32} color={Colors.gray400} />
          </View>
        )}
        <View style={S.roomContent}>
          <View style={S.roomTitleRow}>
            <Text style={S.roomTitle} numberOfLines={2}>{item.title}</Text>
            <View style={[S.statusBadge, { backgroundColor: badge.backgroundColor }]}>
              <Text style={[S.statusText, { color: badge.color }]}>{item.status}</Text>
            </View>
          </View>
          <View style={S.locationRow}>
            <Icon name="location-outline" size={13} color={Colors.textSecondary} />
            <Text style={S.locationText} numberOfLines={1}>{item.locationName}</Text>
          </View>
          {item.hostId?.displayName && (
            <View style={S.locationRow}>
              <Icon name="person-outline" size={13} color={Colors.textSecondary} />
              <Text style={S.locationText} numberOfLines={1}>{item.hostId.displayName}</Text>
            </View>
          )}
          <View style={S.priceRow}>
            <Text style={S.roomPrice}>৳{(item.totalPriceTk || item.basePriceTk || 0).toLocaleString()}</Text>
            <Text style={S.priceBreakdown}>
              (Base: ৳{(item.basePriceTk || 0).toLocaleString()}, Comm: ৳{(item.commissionTk || 0).toLocaleString()})
            </Text>
          </View>
          <Text style={S.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>

          {/* Action buttons */}
          <View style={S.actionsRow}>
            {!isModerator && (
              <TouchableOpacity
                style={S.editBtn}
                onPress={() => navigation.navigate('AdminEditRoom', { roomId: item._id })}
              >
                <Icon name="create-outline" size={15} color={Colors.info} />
                <Text style={S.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={S.viewBtn}
              onPress={() => openDetail(item)}
            >
              <Icon name="eye-outline" size={15} color={Colors.gray600} />
              <Text style={S.viewBtnText}>Details</Text>
            </TouchableOpacity>
          </View>

          {item.status === 'pending' && !isModerator && (
            <View style={S.pendingActionsRow}>
              <TouchableOpacity
                style={[S.approveBtn, actionId === item._id && S.btnDisabled]}
                onPress={() => openApproveModal(item)}
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
          <Text style={S.heroEyebrow}>{isModerator ? 'Support' : 'Admin'}</Text>
          <Text style={S.heroTitle}>Room Management</Text>
          <Text style={S.heroSub}>{isModerator ? 'View room listings' : 'Approve or reject room submissions'}</Text>
        </View>

        {/* Search Bar */}
        <View style={S.searchContainer}>
          <View style={S.searchBar}>
            <Icon name="search-outline" size={18} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={S.searchInput}
              placeholder="Search rooms..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
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
        <Icon name="home-outline" size={36} color={Colors.brand} />
      </View>
      <Text style={S.emptyTitle}>No Rooms</Text>
      <Text style={S.emptyText}>
        {searchQuery
          ? `No rooms matching "${searchQuery}"`
          : filter === 'all'
            ? 'No rooms found'
            : `No ${filter} rooms`}
      </Text>
    </View>
  );

  const ListFooter = () =>
    loadingMore ? (
      <View style={S.footerLoader}>
        <Text style={S.footerLoaderText}>Loading more...</Text>
      </View>
    ) : null;

  if (loading) return <Loading message="Loading rooms..." />;
  if (error && rooms.length === 0)
    return <ErrorState title="Failed to Load Rooms" message={error} onRetry={() => loadRooms(true)} />;

  return (
    <View style={S.root}>
      <FlatList
        data={filteredRooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={filteredRooms.length === 0 ? S.listEmpty : S.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />

      {/* ── Room Details Modal ─────────────────────────────────── */}
      <Modal
        visible={!!detailRoom}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDetailRoom(null)}
      >
        {detailRoom && (
          <RoomDetailModal
            room={detailRoom}
            loading={detailLoading}
            isModerator={isModerator}
            actionId={actionId}
            onClose={() => setDetailRoom(null)}
            onApprove={() => openApproveModal(detailRoom)}
            onReject={() => handleReject(detailRoom._id)}
            onEdit={() => {
              setDetailRoom(null);
              navigation.navigate('AdminEditRoom', { roomId: detailRoom._id });
            }}
          />
        )}
      </Modal>

      {/* ── Approve with Commission Modal ──────────────────────── */}
      <Modal
        visible={!!approveRoom}
        animationType="fade"
        transparent
        onRequestClose={() => setApproveRoom(null)}
      >
        <KeyboardAvoidingView
          style={S.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={S.approveModalContent}>
            <Text style={S.approveModalTitle}>Approve Room</Text>
            <Text style={S.approveModalSub}>{approveRoom?.title}</Text>

            <View style={S.commissionRow}>
              <Text style={S.commissionLabel}>Base Price</Text>
              <Text style={S.commissionValue}>৳{(approveRoom?.basePriceTk || 0).toLocaleString()}</Text>
            </View>

            <View style={S.commissionInputWrap}>
              <Text style={S.commissionLabel}>Commission (৳)</Text>
              <TextInput
                style={S.commissionInput}
                value={commissionTk}
                onChangeText={setCommissionTk}
                keyboardType="numeric"
                placeholder="Enter commission amount"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={S.commissionRow}>
              <Text style={S.commissionLabel}>Total Price</Text>
              <Text style={[S.commissionValue, { fontWeight: Theme.fontWeight.bold, color: Colors.brand }]}>
                ৳{((approveRoom?.basePriceTk || 0) + (parseFloat(commissionTk) || 0)).toLocaleString()}
              </Text>
            </View>

            <View style={S.approveModalActions}>
              <TouchableOpacity
                style={S.approveModalCancel}
                onPress={() => setApproveRoom(null)}
              >
                <Text style={S.approveModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.approveModalConfirm, !!actionId && S.btnDisabled]}
                onPress={handleApproveWithCommission}
                disabled={!!actionId}
              >
                {actionId ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={18} color={Colors.white} />
                    <Text style={S.approveModalConfirmText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ─── Room Detail Modal Component ─────────────────────────────────────────── */

function RoomDetailModal({
  room,
  loading,
  isModerator,
  actionId,
  onClose,
  onApprove,
  onReject,
  onEdit,
}: {
  room: RoomItem;
  loading: boolean;
  isModerator: boolean;
  actionId: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  const badge =
    room.status === 'pending'
      ? { backgroundColor: Colors.warning + '15', color: Colors.warning }
      : room.status === 'approved'
        ? { backgroundColor: Colors.success + '15', color: Colors.success }
        : { backgroundColor: Colors.error + '15', color: Colors.error };

  const [imageIndex, setImageIndex] = useState(0);
  const images = room.images || [];

  return (
    <View style={S.detailRoot}>
      <View style={S.detailHeader}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={S.detailHeaderTitle} numberOfLines={1}>Room Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={S.detailScroll} contentContainerStyle={S.detailScrollContent}>
        {loading && (
          <View style={S.detailLoadingOverlay}>
            <ActivityIndicator size="small" color={Colors.brand} />
          </View>
        )}

        {/* Image carousel */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setImageIndex(idx);
              }}
            >
              {images.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: getImageUrl(img.url) }}
                  style={S.detailImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={S.imageDots}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[S.imageDot, i === imageIndex && S.imageDotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={S.detailImagePlaceholder}>
            <Icon name="home-outline" size={48} color={Colors.gray300} />
          </View>
        )}

        {/* Title & status */}
        <View style={S.detailBody}>
          <View style={S.detailTitleRow}>
            <Text style={S.detailTitle}>{room.title}</Text>
            <View style={[S.statusBadge, { backgroundColor: badge.backgroundColor }]}>
              <Text style={[S.statusText, { color: badge.color }]}>{room.status}</Text>
            </View>
          </View>

          {/* Info grid */}
          <View style={S.infoGrid}>
            <InfoItem label="Location" value={room.locationName} icon="location-outline" />
            <InfoItem label="Host" value={room.hostId?.displayName || 'N/A'} icon="person-outline" />
            <InfoItem label="Place Type" value={PLACE_TYPE_LABELS[room.placeType || ''] || room.placeType || 'N/A'} icon="grid-outline" />
            <InfoItem label="Property Type" value={PROPERTY_TYPE_LABELS[room.propertyType || ''] || room.propertyType || 'N/A'} icon="business-outline" />
            <InfoItem label="Base Price" value={`৳${(room.basePriceTk || 0).toLocaleString()}`} icon="cash-outline" />
            <InfoItem label="Commission" value={`৳${(room.commissionTk || 0).toLocaleString()}`} icon="wallet-outline" />
            <InfoItem label="Total Price" value={`৳${(room.totalPriceTk || 0).toLocaleString()}`} icon="pricetag-outline" bold />
            <InfoItem label="Created" value={new Date(room.createdAt).toLocaleDateString()} icon="calendar-outline" />
          </View>

          {/* Capacity */}
          <Text style={S.sectionTitle}>Capacity</Text>
          <View style={S.capacityRow}>
            <CapacityChip label="Guests" value={room.maxGuests} icon="people-outline" />
            <CapacityChip label="Beds" value={room.beds} icon="bed-outline" />
            <CapacityChip label="Baths" value={room.baths} icon="water-outline" />
          </View>

          {/* Description */}
          <Text style={S.sectionTitle}>Description</Text>
          <Text style={S.descriptionText}>{room.description || 'No description provided.'}</Text>

          {/* Address */}
          <Text style={S.sectionTitle}>Address</Text>
          <Text style={S.descriptionText}>{room.address || 'No address provided.'}</Text>

          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <>
              <Text style={S.sectionTitle}>Amenities</Text>
              <View style={S.amenitiesWrap}>
                {room.amenities.map((a, i) => (
                  <View key={i} style={S.amenityChip}>
                    <Text style={S.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Instant Booking */}
          {room.instantBooking !== undefined && (
            <View style={S.instantRow}>
              <Icon name="flash-outline" size={16} color={room.instantBooking ? Colors.success : Colors.gray400} />
              <Text style={S.instantText}>
                Instant Booking: {room.instantBooking ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      {!isModerator && (
        <View style={S.detailBottomBar}>
          <TouchableOpacity style={S.detailEditBtn} onPress={onEdit}>
            <Icon name="create-outline" size={18} color={Colors.info} />
            <Text style={S.detailEditBtnText}>Edit</Text>
          </TouchableOpacity>
          {room.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[S.detailApproveBtn, !!actionId && S.btnDisabled]}
                onPress={onApprove}
                disabled={!!actionId}
              >
                <Icon name="checkmark-circle" size={18} color={Colors.white} />
                <Text style={S.detailActionText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.detailRejectBtn, !!actionId && S.btnDisabled]}
                onPress={onReject}
                disabled={!!actionId}
              >
                <Icon name="close-circle" size={18} color={Colors.white} />
                <Text style={S.detailActionText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

/* ─── Small helper components ─────────────────────────────────────────────── */

function InfoItem({ label, value, icon, bold }: { label: string; value: string; icon: string; bold?: boolean }) {
  return (
    <View style={S.infoItem}>
      <Icon name={icon} size={15} color={Colors.gray400} />
      <View style={S.infoItemText}>
        <Text style={S.infoLabel}>{label}</Text>
        <Text style={[S.infoValue, bold && { fontWeight: Theme.fontWeight.bold, color: Colors.brand }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function CapacityChip({ label, value, icon }: { label: string; value?: number; icon: string }) {
  return (
    <View style={S.capacityChip}>
      <Icon name={icon} size={18} color={Colors.gray500} />
      <Text style={S.capacityValue}>{value ?? '—'}</Text>
      <Text style={S.capacityLabel}>{label}</Text>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  // Hero
  heroWrapper: { paddingBottom: 0, overflow: 'visible' },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: ADMIN_BG, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(139,92,246,0.12)', top: -50, right: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(59,130,246,0.10)', top: 30, left: -40,
  },
  heroContent: { paddingTop: STATUS_H + 20, paddingHorizontal: 22, paddingBottom: 12 },
  heroEyebrow: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: Theme.fontWeight.medium, marginBottom: 2 },
  heroTitle: {
    fontSize: 28, fontWeight: Theme.fontWeight.bold, color: Colors.white,
    letterSpacing: -0.5, marginBottom: 2,
  },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 8 },

  // Search
  searchContainer: { paddingHorizontal: 22, paddingBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: GLASS_LIGHT,
    borderRadius: 14, borderWidth: 1, borderColor: GLASS_BORDER,
    paddingHorizontal: 14, height: 44, gap: 10,
  },
  searchInput: {
    flex: 1, fontSize: 15, color: Colors.white, padding: 0,
    fontWeight: Theme.fontWeight.regular,
  },

  // Filter tabs
  filterWrapper: { paddingBottom: 16 },
  filterScroll: { paddingHorizontal: 22, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER, marginRight: 10,
  },
  filterChipActive: { backgroundColor: Colors.white, borderColor: Colors.gray200 },
  filterText: { fontSize: 14, fontWeight: Theme.fontWeight.medium, color: 'rgba(255,255,255,0.9)' },
  filterTextActive: { color: ADMIN_BG },

  body: { paddingHorizontal: 16, paddingTop: 4 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  listEmpty: { flexGrow: 1, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: Colors.white, borderRadius: 20, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm, overflow: 'hidden',
  },
  roomImage: { width: '100%', height: 160, backgroundColor: Colors.gray100 },
  roomImagePlaceholder: {
    width: '100%', height: 160, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gray100,
  },
  roomContent: { padding: 16 },
  roomTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  roomTitle: {
    fontSize: 17, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary,
    letterSpacing: -0.2, marginBottom: 6, flex: 1,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  locationText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  roomPrice: {
    fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.brand, letterSpacing: -0.2,
  },
  priceBreakdown: { fontSize: 12, color: Colors.textSecondary },
  dateText: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, textTransform: 'capitalize' },

  // Card actions
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.info + '12', borderWidth: 1, borderColor: Colors.info + '30',
  },
  editBtnText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.info },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.gray200,
  },
  viewBtnText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.gray600 },
  pendingActionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.success,
  },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.error,
  },
  actionBtnText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
  btnDisabled: { opacity: 0.6 },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.brand + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  footerLoaderText: { fontSize: 13, color: Colors.textSecondary },

  /* ── Detail Modal ─────────────────────────────────────── */
  detailRoot: { flex: 1, backgroundColor: Colors.white },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: STATUS_H + 8, paddingBottom: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  detailHeaderTitle: {
    fontSize: 18, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, flex: 1,
    textAlign: 'center', marginHorizontal: 8,
  },
  detailScroll: { flex: 1 },
  detailScrollContent: { paddingBottom: 100 },
  detailLoadingOverlay: { padding: 12, alignItems: 'center' },
  detailImage: { width: SCREEN_WIDTH, height: 240, backgroundColor: Colors.gray100 },
  detailImagePlaceholder: {
    width: SCREEN_WIDTH, height: 200, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gray100,
  },
  imageDots: {
    flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10,
  },
  imageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.gray300 },
  imageDotActive: { backgroundColor: Colors.brand, width: 20 },
  detailBody: { padding: 20 },
  detailTitleRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 10, marginBottom: 16,
  },
  detailTitle: {
    fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary,
    letterSpacing: -0.3, flex: 1,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary,
    marginTop: 20, marginBottom: 10,
  },

  // Info grid
  infoGrid: {
    backgroundColor: Colors.gray50, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.gray100,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoItemText: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 1 },
  infoValue: { fontSize: 14, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },

  // Capacity
  capacityRow: { flexDirection: 'row', gap: 12 },
  capacityChip: {
    flex: 1, alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: Colors.gray100,
  },
  capacityValue: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  capacityLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Description
  descriptionText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Amenities
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.gray200,
  },
  amenityText: { fontSize: 13, color: Colors.textPrimary },

  // Instant booking
  instantRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  instantText: { fontSize: 14, color: Colors.textSecondary },

  // Detail bottom bar
  detailBottomBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray100,
    ...Theme.shadows.md,
  },
  detailEditBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.info + '12', borderWidth: 1, borderColor: Colors.info + '30',
  },
  detailEditBtnText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.info },
  detailApproveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.success,
  },
  detailRejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.error,
  },
  detailActionText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.white },

  /* ── Approve Modal ────────────────────────────────────── */
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 24,
  },
  approveModalContent: {
    width: '100%', maxWidth: 400, backgroundColor: Colors.white, borderRadius: 24,
    padding: 24, ...Theme.shadows.lg,
  },
  approveModalTitle: {
    fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 4,
  },
  approveModalSub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  commissionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  commissionLabel: { fontSize: 14, color: Colors.textSecondary },
  commissionValue: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  commissionInputWrap: { marginVertical: 12 },
  commissionInput: {
    marginTop: 6, borderWidth: 1, borderColor: Colors.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.textPrimary,
    backgroundColor: Colors.gray50,
  },
  approveModalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  approveModalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  approveModalCancelText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  approveModalConfirm: {
    flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.success,
  },
  approveModalConfirmText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
});
