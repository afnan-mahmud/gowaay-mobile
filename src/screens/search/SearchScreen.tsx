/**
 * Search Screen - Search and filter rooms + RateHawk hotels
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import CachedImage from '../../components/CachedImage';
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
  source: 'gowaay';
}

interface RateHawkHotel {
  hotelId: string;
  name: string;
  locationName: string;
  priceBdt: number;
  priceUsd: number;
  images: Array<{ url: string }>;
  starRating: number;
  mealType: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  searchHash: string | null;
  matchHash: string | null;
  source: 'ratehawk';
}

type ListItem = Room | RateHawkHotel;

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${IMG_BASE_URL}${imageUrl}`;
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  'half-board': 'Half Board',
  'full-board': 'Full Board',
  'all-inclusive': 'All Inclusive',
};

type SortOption = 'recommended' | 'price_low' | 'price_high' | 'rating';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'recommended', label: 'Recommended', icon: 'sparkles-outline' },
  { key: 'price_low', label: 'Price: Low', icon: 'arrow-down-outline' },
  { key: 'price_high', label: 'Price: High', icon: 'arrow-up-outline' },
  { key: 'rating', label: 'Top Rated', icon: 'star-outline' },
];

export default function SearchScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { location, searchQuery: routeSearchQuery, checkIn, checkOut, guests, isSearching } = route.params || {};
  const [searchQuery, setSearchQuery] = useState(routeSearchQuery || route.params?.query || location || '');
  const [items, setItems] = useState<ListItem[]>([]);
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

  const sortItems = useCallback((list: ListItem[], sort: SortOption): ListItem[] => {
    const getPrice = (item: ListItem) =>
      item.source === 'ratehawk' ? (item as RateHawkHotel).priceBdt : (item as Room).totalPriceTk;
    const getRating = (item: ListItem) =>
      item.source === 'ratehawk' ? (item as RateHawkHotel).starRating * 2 : ((item as Room).rating || 0);

    const sorted = [...list];
    switch (sort) {
      case 'price_low':
        return sorted.sort((a, b) => getPrice(a) - getPrice(b));
      case 'price_high':
        return sorted.sort((a, b) => getPrice(b) - getPrice(a));
      case 'rating':
        return sorted.sort((a, b) => getRating(b) - getRating(a));
      default:
        // recommended: GoWaay rooms first, then RateHawk
        return sorted.sort((a, b) => {
          if (a.source === b.source) return 0;
          return a.source === 'gowaay' ? -1 : 1;
        });
    }
  }, []);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim() || location || '';
    if (!q) return;

    setLoading(true);
    setSearched(true);

    try {
      const searchParams: any = { page: 1, limit: 30 };
      searchParams.q = q;
      if (checkIn) searchParams.checkIn = checkIn;
      if (checkOut) searchParams.checkOut = checkOut;
      if (guests && guests > 0) searchParams.guests = guests;

      const response = await api.rooms.list(searchParams) as any;

      let dbRooms: Room[] = [];
      let rhHotels: RateHawkHotel[] = [];

      if (response?.success && response?.data) {
        const data = response.data;
        if (Array.isArray(data.rooms)) {
          dbRooms = data.rooms.map((r: any) => ({ ...r, source: 'gowaay' as const }));
        }
        if (Array.isArray(data.ratehawkHotels)) {
          rhHotels = data.ratehawkHotels.map((h: any) => ({ ...h, source: 'ratehawk' as const }));
        }
      }

      // Guest filter on DB rooms (client-side fallback)
      if (guests && guests > 0) {
        dbRooms = dbRooms.filter((room) => (room.maxGuests || 1) >= guests);
      }

      // Date availability filter on DB rooms
      if (checkIn && checkOut && dbRooms.length > 0) {
        try {
          const withAvailability = await Promise.all(
            dbRooms.map(async (room) => {
              try {
                const unavailRes = await api.rooms.getUnavailable(room._id) as any;
                const dates = unavailRes?.data?.unavailableDates || unavailRes?.unavailableDates || [];
                return { ...room, unavailableDates: dates };
              } catch {
                return { ...room, unavailableDates: [] };
              }
            })
          );
          dbRooms = withAvailability.filter((r) => isDateRangeAvailable(r, checkIn, checkOut)) as Room[];
        } catch {
          // continue without availability filter
        }
      }

      const combined: ListItem[] = sortItems([...dbRooms, ...rhHotels], sortBy);
      setItems(combined);
    } catch (error: any) {
      const msg = getErrorMessage(error);
      Toast.show({ type: 'error', title: 'Search Failed', message: msg });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, location, guests, checkIn, checkOut, sortBy, sortItems]);

  React.useEffect(() => {
    if (isSearching && location) {
      handleSearch();
    }
  }, [isSearching, location, checkIn, checkOut, guests, handleSearch]);

  const handleSortChange = useCallback(
    (sort: SortOption) => {
      setSortBy(sort);
      if (items.length > 0) setItems(sortItems(items, sort));
    },
    [items, sortItems]
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ── Render GoWaay room card ──────────────────────────────────────────────
  const renderGowaayRoom = (item: Room) => (
    <AnimatedPressable
      onPress={() => navigation.navigate('RoomDetail', { roomId: item._id, checkIn, checkOut, guests })}
      style={styles.card}
    >
      <View style={styles.imageWrapper}>
        <CachedImage
          source={{ uri: getImageUrl(item.images[0]?.url) }}
          style={styles.image}
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
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Icon name="location-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.location} numberOfLines={1}>{item.locationName}</Text>
        </View>
        <Text style={styles.details}>
          {item.maxGuests} guests · {item.beds} beds · {item.baths} baths
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>৳{item.totalPriceTk.toLocaleString()}</Text>
          <Text style={styles.priceLabel}> / night</Text>
        </View>
      </View>
    </AnimatedPressable>
  );

  // ── Render RateHawk hotel card ───────────────────────────────────────────
  const renderRateHawkHotel = (item: RateHawkHotel) => {
    const imageUrl = item.images?.[0]?.url || '';
    const hasMeal = item.mealType && item.mealType !== 'nomeal';
    const mealLabel = MEAL_LABELS[item.mealType] || null;

    return (
      <AnimatedPressable
        onPress={() =>
          navigation.navigate('HotelDetail', {
            hotelId: item.hotelId,
            checkIn: item.checkIn || checkIn,
            checkOut: item.checkOut || checkOut,
            guests,
          })
        }
        style={styles.card}
      >
        <View style={styles.imageWrapper}>
          {imageUrl ? (
            <CachedImage
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Icon name="business-outline" size={32} color={Colors.gray300} />
            </View>
          )}
          {item.starRating > 0 && (
            <View style={styles.ratingBadge}>
              <Icon name="star" size={11} color="#FFC107" />
              <Text style={styles.ratingText}>{item.starRating.toFixed(0)}</Text>
            </View>
          )}
          {hasMeal && (
            <View style={[styles.ratingBadge, styles.mealBadge]}>
              <Icon name="restaurant-outline" size={10} color={Colors.white} />
              {mealLabel && <Text style={styles.mealText}>{mealLabel}</Text>}
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.location} numberOfLines={1}>{item.locationName}</Text>
          </View>
          {item.roomName ? (
            <Text style={styles.details} numberOfLines={1}>{item.roomName}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>৳{item.priceBdt.toLocaleString()}</Text>
            <Text style={styles.priceLabel}> / night</Text>
            <Text style={styles.usdPrice}> · ${item.priceUsd} USD</Text>
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.source === 'ratehawk') return renderRateHawkHotel(item as RateHawkHotel);
    return renderGowaayRoom(item as Room);
  };

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
      {searched && items.length > 0 && (
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
          <Text style={styles.resultCount}>{items.length} result{items.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <SearchListSkeleton count={4} />
      ) : searched && items.length === 0 ? (
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
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) =>
            item.source === 'ratehawk'
              ? `rh-${(item as RateHawkHotel).hotelId}`
              : (item as Room)._id
          }
          contentContainerStyle={[styles.list, { paddingBottom: 16 + insets.bottom }]}
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
  card: {
    flexDirection: 'row', marginBottom: 0, backgroundColor: Colors.white,
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm,
  },
  imageWrapper: { position: 'relative' },
  image: { width: 130, height: 130, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray100 },
  ratingBadge: {
    position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, gap: 3,
  },
  ratingText: { fontSize: 11, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  mealBadge: {
    top: 'auto', bottom: 8, left: 8,
    backgroundColor: 'rgba(245,158,11,0.92)',
  },
  mealText: { fontSize: 10, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
  instantBadge: {
    position: 'absolute', bottom: 8, left: 8, width: 22, height: 22, borderRadius: 8,
    backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 3, letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 3 },
  location: { fontSize: 12, color: Colors.textTertiary, flex: 1 },
  details: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  priceLabel: { fontSize: 11, color: Colors.textSecondary },
  usdPrice: { fontSize: 10, color: Colors.textTertiary },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 32 },
  emptyTitle: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginTop: 14, marginBottom: 6, letterSpacing: -0.3 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.brand, borderRadius: 14 },
  emptyButtonText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
});
