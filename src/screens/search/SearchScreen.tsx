/**
 * Search Screen - Search and filter rooms
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { api } from '../../api/client';
import CachedImage from '../../components/CachedImage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import AnimatedPressable from '../../components/AnimatedPressable';
import { SearchListSkeleton } from '../../components/Skeleton';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { getErrorMessage } from '../../utils/errorMessages';

interface Room {
  _id: string;
  title: string;
  locationName: string;
  totalPriceTk: number;
  images: Array<{ url: string; w: number; h: number }>;
  maxGuests: number;
  beds: number;
  baths: number;
  rating?: number;
  instantBooking?: boolean;
}

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${IMG_BASE_URL}${imageUrl}`;
};

type SortOption = 'recommended' | 'price_low' | 'price_high' | 'rating';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'recommended', label: 'Recommended', icon: 'sparkles-outline' },
  { key: 'price_low', label: 'Price: Low', icon: 'arrow-down-outline' },
  { key: 'price_high', label: 'Price: High', icon: 'arrow-up-outline' },
  { key: 'rating', label: 'Top Rated', icon: 'star-outline' },
];

export default function SearchScreen({ navigation, route }: any) {
  const { location, checkIn, checkOut, guests, isSearching } = route.params || {};
  const [searchQuery, setSearchQuery] = useState(route.params?.query || location || '');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  const isDateRangeAvailable = (room: any, checkInDate?: string, checkOutDate?: string): boolean => {
    if (!checkInDate || !checkOutDate) return true;
    const unavailableDates = room.unavailableDates || [];
    if (unavailableDates.length === 0) return true;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const current = new Date(start);
    while (current < end) {
      const dateStr = current.toISOString().split('T')[0];
      if (unavailableDates.includes(dateStr)) return false;
      current.setDate(current.getDate() + 1);
    }
    return true;
  };

  const sortRooms = useCallback((roomsList: Room[], sort: SortOption): Room[] => {
    const sorted = [...roomsList];
    switch (sort) {
      case 'price_low':
        return sorted.sort((a, b) => a.totalPriceTk - b.totalPriceTk);
      case 'price_high':
        return sorted.sort((a, b) => b.totalPriceTk - a.totalPriceTk);
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return sorted;
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() && !location) return;

    setLoading(true);
    setSearched(true);
    
    try {
      const searchParams: any = { page: 1, limit: 50 };
      if (location) {
        searchParams.q = location;
      } else if (searchQuery) {
        searchParams.q = searchQuery;
      }
      
      const response = await api.rooms.list(searchParams);

      if (response && typeof response === 'object' && 'error' in response) {
        const errorResponse = response as any;
        Alert.alert('Search Error', errorResponse.message || errorResponse.error || 'Failed to search rooms.');
        setRooms([]);
        setLoading(false);
        return;
      }
      
      let filteredRooms: Room[] = [];
      
      try {
        if (response && typeof response === 'object') {
          if ('success' in response && response.success === true && 'data' in response) {
            const data = (response as any).data;
            if (data && typeof data === 'object') {
              if ('rooms' in data && Array.isArray(data.rooms)) {
                filteredRooms = data.rooms;
              } else if (Array.isArray(data)) {
                filteredRooms = data;
              } else if ('data' in data && Array.isArray(data.data)) {
                filteredRooms = data.data;
              }
            } else if (Array.isArray(response.data)) {
              filteredRooms = response.data;
            }
          } else if (Array.isArray(response)) {
            filteredRooms = response;
          } else if ('data' in response && Array.isArray((response as any).data)) {
            filteredRooms = (response as any).data;
          } else if ('rooms' in response && Array.isArray((response as any).rooms)) {
            filteredRooms = (response as any).rooms;
          }
        } else if (Array.isArray(response)) {
          filteredRooms = response;
        }

        if (filteredRooms.length === 0 && response) {
          if (response && typeof response === 'object' && 'data' in response) {
            const data = (response as any).data;
            if (data && typeof data === 'object' && 'rooms' in data && Array.isArray(data.rooms)) {
              filteredRooms = data.rooms;
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
      
      if (!Array.isArray(filteredRooms)) {
        setRooms([]);
        return;
      }

      if (filteredRooms.length === 0) {
        setRooms([]);
        return;
      }
      
      if (guests && guests > 0) {
        filteredRooms = filteredRooms.filter((room: Room) => (room.maxGuests || 1) >= guests);
      }
      
      if (checkIn && checkOut && filteredRooms.length > 0) {
        try {
          const availabilityPromises = filteredRooms.map(async (room: any) => {
            try {
              const unavailableResponse = await api.rooms.getUnavailable(room._id);
              if (unavailableResponse && typeof unavailableResponse === 'object') {
                if ('success' in unavailableResponse && unavailableResponse.success && 'data' in unavailableResponse) {
                  room.unavailableDates = unavailableResponse.data?.unavailableDates || [];
                } else if ('unavailableDates' in unavailableResponse) {
                  room.unavailableDates = unavailableResponse.unavailableDates || [];
                } else if (Array.isArray(unavailableResponse)) {
                  room.unavailableDates = unavailableResponse;
                } else {
                  room.unavailableDates = [];
                }
              } else {
                room.unavailableDates = [];
              }
            } catch {
              room.unavailableDates = [];
            }
            return room;
          });
          
          const roomsWithAvailability = await Promise.all(availabilityPromises);
          filteredRooms = roomsWithAvailability.filter((room: any) => isDateRangeAvailable(room, checkIn, checkOut));
        } catch {
          // Continue without date filtering
        }
      }
      
      setRooms(sortRooms(filteredRooms, sortBy));
    } catch (error: any) {
      const msg = getErrorMessage(error);
      Toast.show({ type: 'error', title: 'Search Failed', message: msg });
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, location, guests, checkIn, checkOut, sortBy, sortRooms]);

  React.useEffect(() => {
    if (isSearching && location) {
      handleSearch();
    }
  }, [isSearching, location, checkIn, checkOut, guests, handleSearch]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
    if (rooms.length > 0) {
      setRooms(sortRooms(rooms, sort));
    }
  }, [rooms, sortRooms]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <AnimatedPressable
      onPress={() => navigation.navigate('RoomDetail', { roomId: item._id, checkIn, checkOut, guests })}
      style={styles.roomCard}
    >
      <View style={styles.roomImageWrapper}>
        <CachedImage
          source={{ uri: getImageUrl(item.images[0]?.url) }}
          style={styles.roomImage}
          resizeMode="cover"
        />
        {item.rating != null && item.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Icon name="star" size={11} color="#FFC107" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
        {item.instantBooking && (
          <View style={styles.instantBadge}>
            <Icon name="flash" size={10} color={Colors.white} />
          </View>
        )}
      </View>
      <View style={styles.roomInfo}>
        <Text style={styles.roomTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Icon name="location-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.roomLocation} numberOfLines={1}>{item.locationName}</Text>
        </View>
        <Text style={styles.roomDetails}>
          {item.maxGuests} guests · {item.beds} beds · {item.baths} baths
        </Text>
        <View style={styles.roomPriceRow}>
          <Text style={styles.roomPrice}>৳{item.totalPriceTk.toLocaleString()}</Text>
          <Text style={styles.roomPriceLabel}> / night</Text>
        </View>
      </View>
    </AnimatedPressable>
  );

  return (
    <View style={styles.container}>
      {/* Search Summary Bar */}
      {location && (
        <TouchableOpacity
          style={styles.searchSummary}
          onPress={() => navigation.navigate('LocationSearch')}
          activeOpacity={0.8}
        >
          <View style={styles.summaryLeft}>
            <Icon name="search-outline" size={18} color={Colors.brand} />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryMainText} numberOfLines={1}>{location}</Text>
              <Text style={styles.summarySubText}>
                {checkIn && checkOut ? `${formatDate(checkIn)} – ${formatDate(checkOut)}` : 'Any dates'}
                {guests ? ` · ${guests} guest${guests > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.editBadge}>
            <Icon name="options-outline" size={18} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}

      {/* Manual Search Header */}
      {!location && (
        <View style={styles.searchHeader}>
          <View style={styles.searchInputWrapper}>
            <Icon name="search-outline" size={18} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location, property..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <Button title="Search" onPress={handleSearch} size="small" loading={loading} />
        </View>
      )}

      {/* Sort Chips */}
      {searched && rooms.length > 0 && (
        <View style={styles.sortSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortChips}
          >
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
                onPress={() => handleSortChange(opt.key)}
                activeOpacity={0.7}
              >
                <Icon
                  name={opt.icon}
                  size={14}
                  color={sortBy === opt.key ? Colors.white : Colors.textSecondary}
                />
                <Text style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.resultCount}>{rooms.length} result{rooms.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <SearchListSkeleton count={4} />
      ) : searched && rooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="search-outline" size={56} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>Try different keywords or adjust your filters</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('LocationSearch')}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyButtonText}>New Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !searched ? (
              <View style={styles.emptyContainer}>
                <Icon name="home-outline" size={56} color={Colors.gray300} />
                <Text style={styles.emptyTitle}>Start Your Search</Text>
                <Text style={styles.emptyText}>Enter a location or property name above</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  searchSummary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  summaryTextContainer: { flex: 1 },
  summaryMainText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, letterSpacing: -0.2 },
  summarySubText: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  editBadge: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.gray200, alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  searchHeader: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
    gap: 8, alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray50, borderRadius: 14, paddingHorizontal: 12,
    gap: 8, borderWidth: 1, borderColor: Colors.gray200,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary },
  sortSection: { backgroundColor: Colors.white, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  sortChips: { paddingHorizontal: 16, gap: 8 },
  sortChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.gray200, gap: 5,
  },
  sortChipActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  sortChipText: { fontSize: 12, fontWeight: Theme.fontWeight.medium, color: Colors.textSecondary },
  sortChipTextActive: { color: Colors.white },
  resultCount: { fontSize: 12, color: Colors.textTertiary, paddingHorizontal: 16, marginTop: 8 },
  list: { padding: 16, gap: 10 },
  roomCard: {
    flexDirection: 'row', marginBottom: 0, backgroundColor: Colors.white,
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm,
  },
  roomImageWrapper: { position: 'relative' },
  roomImage: { width: 130, height: 130, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  ratingBadge: {
    position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, gap: 3,
  },
  ratingText: { fontSize: 11, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  instantBadge: {
    position: 'absolute', bottom: 8, left: 8, width: 22, height: 22, borderRadius: 8,
    backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  roomInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  roomTitle: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 3, letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 3 },
  roomLocation: { fontSize: 12, color: Colors.textTertiary, flex: 1 },
  roomDetails: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  roomPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  roomPrice: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  roomPriceLabel: { fontSize: 11, color: Colors.textSecondary },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 32 },
  emptyTitle: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginTop: 14, marginBottom: 6, letterSpacing: -0.3 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.brand, borderRadius: 14 },
  emptyButtonText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
});
