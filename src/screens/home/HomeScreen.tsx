/**
 * Home Screen — Glassmorphism redesign
 * Style: glass cards · gradient hero · story-style room cards
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  StatusBar,
} from 'react-native';
import CachedImage from '../../components/CachedImage';
import Icon from '../../components/Icon';
import AnimatedPressable from '../../components/AnimatedPressable';
import { HomeSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { getErrorMessage } from '../../utils/errorMessages';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

// Story card dims
const STORY_W = SW * 0.46;
const STORY_H = STORY_W * 1.55;

// Glass colours (used throughout)
const GLASS_LIGHT  = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';
const GLASS_CARD   = 'rgba(255,255,255,0.88)';

// ─── Types ────────────────────────────────────────────────────────────────────

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

const DESTINATIONS = [
  { name: "Cox's Bazar", sub: '121 km of beach', icon: 'sunny-outline',        bg: '#FEF3C7', ic: '#D97706' },
  { name: 'Sylhet',      sub: 'Tea & waterfalls', icon: 'leaf-outline',         bg: '#D1FAE5', ic: '#059669' },
  { name: 'Dhaka',       sub: 'The mega city',    icon: 'business-outline',     bg: '#DBEAFE', ic: '#2563EB' },
  { name: 'Bandarban',   sub: 'Tribal highlands', icon: 'trail-sign-outline',   bg: '#EDE9FE', ic: '#7C3AED' },
  { name: 'Chittagong',  sub: 'Port & nature',    icon: 'boat-outline',         bg: '#FCE7F3', ic: '#DB2777' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const imgUrl = (u: string) =>
  !u ? '' : u.startsWith('http') ? u : `${IMG_BASE_URL}${u}`;

const timeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── Story Card ───────────────────────────────────────────────────────────────

function StoryCard({
  item,
  isFav,
  onPress,
  onFav,
}: {
  item: Room;
  isFav: boolean;
  onPress: () => void;
  onFav: () => void;
}) {
  return (
    <AnimatedPressable onPress={onPress} style={SC.card}>
      {/* Full-bleed image */}
      <CachedImage
        source={{ uri: imgUrl(item.images[0]?.url) }}
        style={SC.image}
        resizeMode="cover"
      />

      {/* Top row: rating + heart */}
      <View style={SC.topRow}>
        {item.rating != null && item.rating > 0 && (
          <View style={SC.ratingPill}>
            <Icon name="star" size={10} color="#F59E0B" />
            <Text style={SC.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onFav}
          style={[SC.heartBtn, isFav && SC.heartBtnActive]}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? Colors.brand : Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Instant badge */}
      {item.instantBooking && (
        <View style={SC.instantBadge}>
          <Icon name="flash" size={10} color={Colors.white} />
          <Text style={SC.instantText}>Instant</Text>
        </View>
      )}

      {/* Bottom overlay */}
      <View style={SC.overlay}>
        <View style={SC.pricePill}>
          <Text style={SC.priceText}>৳{item.totalPriceTk.toLocaleString()}</Text>
          <Text style={SC.perNight}>/night</Text>
        </View>
        <Text style={SC.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={SC.locRow}>
          <Icon name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
          <Text style={SC.locText} numberOfLines={1}>{item.locationName}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const SC = StyleSheet.create({
  card: {
    width: STORY_W,
    height: STORY_H,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  image: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
  },
  heartBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  instantBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.brand,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  instantText: { fontSize: 10, fontWeight: Theme.fontWeight.bold, color: '#fff' },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceText: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: '#fff' },
  perNight: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginLeft: 2 },
  cardTitle: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: '#fff', marginBottom: 3, letterSpacing: -0.2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', flex: 1 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const { user, isAuthenticated } = useAuth();
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const scrollY = useRef(new Animated.Value(0)).current;

  // Navigate to a screen that requires login; redirect guest to LoginScreen
  const navigateSafe = useCallback((screen: string, params?: object) => {
    if (!isAuthenticated) {
      navigation.navigate('LoginScreen');
      return;
    }
    navigation.navigate(screen, params);
  }, [isAuthenticated, navigation]);

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { if (isAuthenticated) loadFavorites(); }, [isAuthenticated]);

  const loadFavorites = async () => {
    try {
      const res = await api.favorites.list();
      if (res.success && res.data) {
        const ids = (res.data as any[]).map((r: any) => r._id);
        setFavorites(new Set(ids));
      }
    } catch (_) {}
  };

  const loadRooms = async () => {
    try {
      setError(null);
      const res = await api.rooms.list({ page: 1, limit: 20 });
      if (res.success && res.data) {
        const d = res.data as any;
        setRooms(d.rooms || d || []);
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadRooms(); if (isAuthenticated) loadFavorites(); };

  const toggleFav = useCallback((id: string) => {
    if (!isAuthenticated) {
      navigation.navigate('LoginScreen');
      return;
    }
    setFavorites(prev => {
      const n = new Set(prev);
      const wasFav = n.has(id);
      wasFav ? n.delete(id) : n.add(id);
      (wasFav ? api.favorites.remove(id) : api.favorites.add(id)).catch(() => {
        setFavorites(p => {
          const revert = new Set(p);
          wasFav ? revert.add(id) : revert.delete(id);
          return revert;
        });
      });
      return n;
    });
  }, [isAuthenticated, navigation]);

  // Hero shrink on scroll
  const heroScale = scrollY.interpolate({ inputRange: [0, 150], outputRange: [1, 0.92], extrapolate: 'clamp' });
  const heroOpacity = scrollY.interpolate({ inputRange: [0, 100], outputRange: [1, 0], extrapolate: 'clamp' });

  if (loading) return <HomeSkeleton />;
  if (error && rooms.length === 0) return <ErrorState title="Failed to Load" message={error} onRetry={loadRooms} />;

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand} translucent />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >

        {/* ════════════════ HERO ════════════════ */}
        <View style={S.heroWrapper}>
          {/* Gradient background using layered views */}
          <View style={S.heroBg} />
          <View style={S.heroAccentCircle1} />
          <View style={S.heroAccentCircle2} />
          <View style={S.heroAccentCircle3} />

          {/* Top bar — kept OUTSIDE the fading Animated.View so it is always tappable */}
          <View style={S.heroTopBarAbsolute}>
            <View>
              <Text style={S.heroEyebrow}>{timeGreeting()}</Text>
              <Text style={S.heroName}>
                {user?.name ? user.name.split(' ')[0] : 'Traveller'} 👋
              </Text>
            </View>
            <View style={S.heroActions}>
              <TouchableOpacity
                style={S.glassIconBtn}
                onPress={() => navigateSafe('Notifications')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="notifications-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.glassIconBtn, { marginLeft: 8 }]}
                onPress={() => navigateSafe('Profile')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="person-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View style={[S.heroContent, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
            {/* Spacer so tagline sits below the top bar */}
            <View style={{ height: 56 }} />

            {/* Tagline */}
            <Text style={S.heroTagline}>Find your perfect stay in Bangladesh</Text>
          </Animated.View>

          {/* ── Search pill (stays visible while scrolling) ── */}
          <View style={S.searchWrap}>
            <AnimatedPressable
              onPress={() => navigation.navigate('LocationSearch')}
              style={S.searchPill}
              scaleDown={0.97}
            >
              <View style={S.searchLeft}>
                <View style={S.searchIconBg}>
                  <Icon name="search-outline" size={17} color={Colors.brand} />
                </View>
                <View>
                  <Text style={S.searchBold}>Where to?</Text>
                  <Text style={S.searchSub}>Anywhere · Any dates · Any guests</Text>
                </View>
              </View>
              <View style={S.searchDivider} />
              <View style={S.filterBtn}>
                <Icon family="Feather" name="sliders" size={15} color={Colors.textSecondary} />
              </View>
            </AnimatedPressable>
          </View>
        </View>

        {/* ════════════════ STORY-STYLE ROOMS ════════════════ */}
        <View style={S.section}>
          <View style={S.sectionHead}>
            <View>
              <Text style={S.sectionTitle}>Explore Properties</Text>
              <Text style={S.sectionSub}>{rooms.length} stays available</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Search')}
              style={S.seeAllBtn}
              activeOpacity={0.7}
            >
              <Text style={S.seeAllText}>See all</Text>
              <Icon name="chevron-forward" size={14} color={Colors.brand} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={rooms}
            keyExtractor={r => r._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.storyList}
            snapToInterval={STORY_W + 12}
            decelerationRate="fast"
            renderItem={({ item }) => (
              <StoryCard
                item={item}
                isFav={favorites.has(item._id)}
                onPress={() => navigation.navigate('RoomDetail', { roomId: item._id })}
                onFav={() => toggleFav(item._id)}
              />
            )}
          />
        </View>

        {/* ════════════════ DESTINATIONS ════════════════ */}
        <View style={S.section}>
          <View style={S.sectionHead}>
            <View>
              <Text style={S.sectionTitle}>Destinations</Text>
              <Text style={S.sectionSub}>Top places in Bangladesh</Text>
            </View>
          </View>

          <FlatList
            data={DESTINATIONS}
            keyExtractor={d => d.name}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.destList}
            renderItem={({ item }) => (
              <AnimatedPressable
                onPress={() => navigation.navigate('LocationSearch', { initialQuery: item.name })}
                style={S.destCard}
              >
                {/* Icon circle */}
                <View style={[S.destIconCircle, { backgroundColor: item.bg }]}>
                  <Icon name={item.icon} size={24} color={item.ic} />
                </View>
                <View style={S.destInfo}>
                  <Text style={S.destName}>{item.name}</Text>
                  <Text style={S.destSub}>{item.sub}</Text>
                </View>
                <View style={S.destArrow}>
                  <Icon name="chevron-forward" size={14} color={Colors.gray400} />
                </View>
              </AnimatedPressable>
            )}
          />
        </View>

        {/* ════════════════ PROMO BANNER ════════════════ */}
        <View style={S.promoPad}>
          <AnimatedPressable
            onPress={() => navigation.navigate('LocationSearch')}
            style={S.promoCard}
            scaleDown={0.97}
          >
            {/* Decorative bg circles */}
            <View style={S.promoCircA} />
            <View style={S.promoCircB} />

            {/* Left: text */}
            <View style={S.promoLeft}>
              <View style={S.promoChip}>
                <Icon name="flash" size={11} color={Colors.brand} />
                <Text style={S.promoChipText}>Limited Offer</Text>
              </View>
              <Text style={S.promoTitle}>100TK off your{'\n'}first booking</Text>
              <Text style={S.promoSub}>Use code: GOWAAY100</Text>
              <View style={S.promoCTA}>
                <Text style={S.promoCTAText}>Claim now</Text>
                <Icon name="arrow-forward" size={13} color={Colors.white} />
              </View>
            </View>

            {/* Right: icon */}
            <View style={S.promoRight}>
              <View style={S.promoIconCircle}>
                <Icon name="gift-outline" size={36} color={Colors.brand} />
              </View>
            </View>
          </AnimatedPressable>
        </View>

        {/* ════════════════ WHY GOWAAY ════════════════ */}
        <View style={S.section}>
          <View style={S.sectionHead}>
            <Text style={S.sectionTitle}>Why GoWaay?</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.trustList}>
            {[
              { icon: 'shield-checkmark-outline', label: 'Verified Hosts',  sub: 'Every host is checked',  color: '#2563EB', bg: '#EFF6FF' },
              { icon: 'lock-closed-outline',      label: 'Secure Pay',      sub: 'Bank-level security',    color: '#059669', bg: '#ECFDF5' },
              { icon: 'chatbubbles-outline',      label: '24/7 Support',    sub: 'Round the clock help',   color: '#7C3AED', bg: '#F5F3FF' },
              { icon: 'cash-outline',             label: 'Best Prices',     sub: 'No hidden charges',      color: '#D97706', bg: '#FFFBEB' },
            ].map((f, i) => (
              <View key={i} style={S.trustCard}>
                <View style={[S.trustIcon, { backgroundColor: f.bg }]}>
                  <Icon name={f.icon} size={20} color={f.color} />
                </View>
                <Text style={S.trustLabel}>{f.label}</Text>
                <Text style={S.trustSub}>{f.sub}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroWrapper: {
    // wraps BG + content + overflowing search pill
    paddingBottom: 28,      // room for search pill to sit on edge
    overflow: 'visible',
  },
  heroBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: SH * 0.35,
    backgroundColor: Colors.brand,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroAccentCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -50,
  },
  heroAccentCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.brandDark,
    opacity: 0.4,
    top: 40,
    left: -50,
  },
  heroAccentCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 60,
    right: 30,
  },
  heroContent: {
    paddingTop: STATUS_H + 14,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  // Top bar sits outside the fading Animated.View so it is always tappable
  heroTopBarAbsolute: {
    position: 'absolute',
    top: STATUS_H + 14,
    left: 22,
    right: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroEyebrow: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: Theme.fontWeight.medium,
    marginBottom: 2,
  },
  heroName: {
    fontSize: 26,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  heroActions: {
    flexDirection: 'row',
  },
  glassIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS_LIGHT,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: Theme.fontWeight.medium,
  },

  // search pill
  searchWrap: {
    paddingHorizontal: 18,
    marginTop: 4,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 10,
    ...Theme.shadows.lg,
  },
  searchLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBold: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  searchSub: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  searchDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.gray200,
    marginHorizontal: 10,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    backgroundColor: Colors.white,
    paddingTop: 22,
    paddingBottom: 18,
    marginTop: 6,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.brand,
  },

  // ── Story list ─────────────────────────────────────────────────────────────
  storyList: {
    paddingLeft: 20,
    paddingRight: 8,
  },

  // ── Destinations (horizontal list of pill-cards) ───────────────────────────
  destList: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  destCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    width: SW * 0.62,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  destIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destInfo: { flex: 1 },
  destName: {
    fontSize: 14,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  destSub: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  destArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },

  // ── Promo ──────────────────────────────────────────────────────────────────
  promoPad: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 6,
  },
  promoCard: {
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 22,
    ...Theme.shadows.md,
  },
  promoCircA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF1F2',
    top: -60,
    right: 20,
  },
  promoCircB: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE4E6',
    bottom: -40,
    right: -10,
  },
  promoLeft: { flex: 1, zIndex: 1 },
  promoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  promoChipText: {
    fontSize: 11,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.brand,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  promoCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  promoCTAText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
  },
  promoRight: { zIndex: 1, marginLeft: 10 },
  promoIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },

  // ── Trust ──────────────────────────────────────────────────────────────────
  trustList: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 10,
  },
  trustCard: {
    width: 135,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  trustLabel: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  trustSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
