/**
 * Host Listings Screen - View and manage all properties
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
import CachedImage from '../../components/CachedImage';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
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

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setError(null);
      const response = await api.hosts.rooms();
      if (response.success && response.data) {
        setRooms(response.data as Room[]);
      }
    } catch (err: any) {
      console.error('Failed to load listings:', err);
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Listings', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const handleDelete = (roomId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.hosts.deleteRoom(roomId);
              if (response.success) {
                Alert.alert('Success', 'Listing deleted successfully');
                loadListings();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete listing');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete listing');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'rejected':
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'all') return true;
    return room.status === filter;
  });

  const renderRoom = ({ item }: { item: Room }) => (
    <Card style={styles.roomCard}>
      <View style={styles.roomContent}>
        <CachedImage
          source={{ uri: getImageUrl(item.images[0]?.url) }}
          style={styles.roomImage}
          resizeMode="cover"
        />
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.roomLocation} numberOfLines={1}>
              {item.locationName}
            </Text>
          </View>
          <Text style={styles.roomDetails}>
            {item.maxGuests} guests · {item.beds} beds · {item.baths} baths
          </Text>
          <Text style={styles.roomPrice}>৳{item.totalPriceTk.toLocaleString()} / night</Text>

          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.roomActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RoomDetail', { roomId: item._id })}
        >
          <Icon name="eye-outline" size={16} color={Colors.brand} style={{ marginRight: 4 }} />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditRoom', { roomId: item._id })}
        >
          <Icon family="Feather" name="edit-2" size={14} color={Colors.brand} style={{ marginRight: 4 }} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item._id)}
        >
          <Icon family="Feather" name="trash-2" size={14} color={Colors.error} style={{ marginRight: 4 }} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return <Loading message="Loading your listings..." />;
  }

  if (error && rooms.length === 0) {
    return <ErrorState title="Failed to Load Listings" message={error} onRetry={loadListings} />;
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
            All ({rooms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'approved' && styles.filterTabActive]}
          onPress={() => setFilter('approved')}
        >
          <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>
            Active ({rooms.filter((r) => r.status === 'approved').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending ({rooms.filter((r) => r.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'rejected' && styles.filterTabActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>
            Rejected ({rooms.filter((r) => r.status === 'rejected').length})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="home-outline" size={64} color={Colors.gray300} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Listings Yet</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'Start by creating your first property listing'
              : `No ${filter} listings`}
          </Text>
          <Button
            title="Add Your First Listing"
            onPress={() => navigation.navigate('AddRoom')}
            style={styles.addButton}
          />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating Add Button */}
      {filteredRooms.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddRoom')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
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
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    padding: 14,
  },
  roomCard: {
    marginBottom: Theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  roomContent: {
    flexDirection: 'row',
    padding: 14,
  },
  roomImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginRight: Theme.spacing.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  roomLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 3,
  },
  roomDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  roomPrice: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.brand,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: Theme.fontWeight.medium,
    textTransform: 'capitalize',
  },
  roomActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.gray100,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
  },
  deleteButton: {
    borderRightWidth: 0,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyIcon: {
    marginBottom: Theme.spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginTop: Theme.spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: Theme.spacing.xl,
    right: Theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  fabIcon: {
    fontSize: 32,
    color: Colors.white,
    fontWeight: Theme.fontWeight.bold,
  },
});
