/**
 * Host Listings Screen — Glassmorphism redesign
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
import CachedImage from '../../components/CachedImage';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { getErrorMessage } from '../../utils/errorMessages';

const { width: SW } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const GLASS_LIGHT  = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${IMG_BASE_URL}${imageUrl}`;
};

interface Room {
  _id: string;
  title: string;
  locationName: string;
  totalPriceTk: number;
  maxGuests: number;
  beds: number;
  baths: number;
  status: 'pending' | 'approved' | 'rejected';
  images: Array<{ url: string; w: number; h: number }>;
}

export default function HostListingsScreen({ navigation }: any) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => { loadListings(); }, []);

  const loadListings = async () => {
    try {
      setError(null);
      const response = await api.hosts.rooms();
      if (response.success && response.data) setRooms(response.data as Room[]);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Listings', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadListings(); };

  const handleDelete = (roomId: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const response = await api.hosts.deleteRoom(roomId);
          if (response.success) { Alert.alert('Success', 'Listing deleted successfully'); loadListings(); }
          else Alert.alert('Error', response.message || 'Failed to delete listing');
        } catch (error: any) { Alert.alert('Error', error.message || 'Failed to delete listing'); }
      }},
    ]);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved': return { color: Colors.success, bg: Colors.success + '18', label: 'Active' };
      case 'pending':  return { color: Colors.warning, bg: Colors.warning + '18', label: 'Pending' };
      case 'rejected': return { color: Colors.error,   bg: Colors.error   + '18', label: 'Rejected' };
      default:         return { color: Colors.gray500, bg: Colors.gray100, label: status };
    }
  };

  const filteredRooms = rooms.filter(r => filter === 'all' || r.status === filter);

  const filterTabs: Array<{ key: typeof filter; label: string; count: number }> = [
    { key: 'all',      label: 'All',      count: rooms.length },
    { key: 'approved', label: 'Active',   count: rooms.filter(r => r.status === 'approved').length },
    { key: 'pending',  label: 'Pending',  count: rooms.filter(r => r.status === 'pending').length },
    { key: 'rejected', label: 'Rejected', count: rooms.filter(r => r.status === 'rejected').length },
  ];

  const renderRoom = ({ item }: { item: Room }) => {
    const sc = getStatusConfig(item.status);
    return (
      <View style={S.card}>
        <View style={S.cardInner}>
          <CachedImage source={{ uri: getImageUrl(item.images[0]?.url) }} style={S.roomImage} resizeMode="cover" />
          <View style={S.roomInfo}>
            <Text style={S.roomTitle} numberOfLines={2}>{item.title}</Text>
            <View style={S.locationRow}>
              <Icon name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={S.locationText} numberOfLines={1}>{item.locationName}</Text>
            </View>
            <Text style={S.roomMeta}>{item.maxGuests} guests · {item.beds} beds · {item.baths} baths</Text>
            <Text style={S.roomPrice}>৳{item.totalPriceTk.toLocaleString()} / night</Text>
            <View style={[S.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[S.statusText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
        </View>

        <View style={S.actionsBar}>
          <TouchableOpacity style={S.actionBtn} onPress={() => navigation.navigate('RoomDetail', { roomId: item._id })}>
            <Icon name="eye-outline" size={15} color={Colors.brand} />
            <Text style={[S.actionBtnText, { color: Colors.brand }]}>View</Text>
          </TouchableOpacity>
          <View style={S.actionDivider} />
          <TouchableOpacity style={S.actionBtn} onPress={() => navigation.navigate('EditRoom', { roomId: item._id })}>
            <Icon family="Feather" name="edit-2" size={14} color={Colors.textPrimary} />
            <Text style={S.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <View style={S.actionDivider} />
          <TouchableOpacity style={S.actionBtn} onPress={() => handleDelete(item._id)}>
            <Icon family="Feather" name="trash-2" size={14} color={Colors.error} />
            <Text style={[S.actionBtnText, { color: Colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <Loading message="Loading your listings..." />;
  if (error && rooms.length === 0) return <ErrorState title="Failed to Load Listings" message={error} onRetry={loadListings} />;

  return (
    <View style={S.root}>
      {/* ── Hero strip ── */}
      <View style={S.hero}>
        <View style={S.heroCircle} />
        <View style={S.heroContent}>
          <Text style={S.heroTitle}>My Listings</Text>
          <Text style={S.heroSub}>{rooms.length} propert{rooms.length !== 1 ? 'ies' : 'y'}</Text>
        </View>

        <View style={S.filterBar}>
          {filterTabs.map(t => {
            const active = filter === t.key;
            return (
              <TouchableOpacity key={t.key} style={[S.filterTab, active && S.filterTabActive]} onPress={() => setFilter(t.key)}>
                <Text style={[S.filterText, active && S.filterTextActive]}>{t.label} ({t.count})</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {filteredRooms.length === 0 ? (
        <View style={S.emptyContainer}>
          <View style={S.emptyIconWrap}>
            <Icon name="home-outline" size={36} color={Colors.brand} />
          </View>
          <Text style={S.emptyTitle}>No Listings Yet</Text>
          <Text style={S.emptyText}>
            {filter === 'all' ? 'Start by creating your first property listing' : `No ${filter} listings`}
          </Text>
          <Button title="Add Your First Listing" onPress={() => navigation.navigate('AddRoom')} style={S.addBtn} />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderRoom}
          keyExtractor={item => item._id}
          contentContainerStyle={S.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {filteredRooms.length > 0 && (
        <TouchableOpacity style={S.fab} onPress={() => navigation.navigate('AddRoom')} activeOpacity={0.85}>
          <Icon name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
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

  filterBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  filterTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 2, alignItems: 'center', borderRadius: 20, backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER },
  filterTabActive: { backgroundColor: Colors.white },
  filterText: { fontSize: 11, fontWeight: Theme.fontWeight.medium, color: 'rgba(255,255,255,0.85)' },
  filterTextActive: { color: Colors.brand },

  list: { padding: 16 },

  // Card
  card: { backgroundColor: Colors.white, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm, overflow: 'hidden' },
  cardInner: { flexDirection: 'row', padding: 14 },
  roomImage: { width: 96, height: 96, borderRadius: 16, marginRight: 14 },
  roomInfo: { flex: 1 },
  roomTitle: { fontSize: 16, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, letterSpacing: -0.2, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  locationText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  roomMeta: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  roomPrice: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.brand, letterSpacing: -0.2, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: Theme.fontWeight.semibold, textTransform: 'capitalize' },

  actionsBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.gray100 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 5 },
  actionBtnText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  actionDivider: { width: 1, backgroundColor: Colors.gray100 },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.brand + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 8, letterSpacing: -0.3 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  addBtn: { marginTop: 8 },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 22,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center',
    ...Theme.shadows.lg,
  },
});
