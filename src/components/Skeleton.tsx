import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

function SkeletonBlock({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.gray200,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function RoomCardSkeleton() {
  return (
    <View style={skStyles.roomCard}>
      <SkeletonBlock width="100%" height={200} borderRadius={16} />
      <View style={skStyles.roomCardInfo}>
        <View style={skStyles.row}>
          <SkeletonBlock width="70%" height={18} borderRadius={6} />
          <SkeletonBlock width={50} height={24} borderRadius={12} />
        </View>
        <SkeletonBlock width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonBlock width="60%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <View style={[skStyles.row, { marginTop: 12 }]}>
          <SkeletonBlock width={100} height={20} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function RoomListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={skStyles.listContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function SearchCardSkeleton() {
  return (
    <View style={skStyles.searchCard}>
      <SkeletonBlock width={120} height={120} borderRadius={12} />
      <View style={skStyles.searchCardInfo}>
        <SkeletonBlock width="80%" height={16} borderRadius={4} />
        <SkeletonBlock width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonBlock width="60%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonBlock width={80} height={18} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SearchListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={skStyles.searchListContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <SearchCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function RoomDetailSkeleton() {
  return (
    <View style={skStyles.detailContainer}>
      <SkeletonBlock width="100%" height={350} borderRadius={0} />
      <View style={skStyles.detailContent}>
        <SkeletonBlock width="85%" height={28} borderRadius={6} />
        <SkeletonBlock width="50%" height={16} borderRadius={4} style={{ marginTop: 12 }} />
        <View style={[skStyles.row, { marginTop: 20, gap: 16 }]}>
          <SkeletonBlock width={80} height={14} borderRadius={4} />
          <SkeletonBlock width={70} height={14} borderRadius={4} />
          <SkeletonBlock width={70} height={14} borderRadius={4} />
        </View>
        <View style={skStyles.hostSkeleton}>
          <SkeletonBlock width={56} height={56} borderRadius={28} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <SkeletonBlock width="60%" height={16} borderRadius={4} />
            <SkeletonBlock width="40%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
        <SkeletonBlock width="100%" height={100} borderRadius={12} style={{ marginTop: 24 }} />
      </View>
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={skStyles.homeContainer}>
      {/* Header skeleton */}
      <View style={skStyles.homeHeader}>
        <SkeletonBlock width="50%" height={28} borderRadius={6} />
        <SkeletonBlock width="70%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
      {/* Search bar skeleton */}
      <View style={skStyles.homeSearchBar}>
        <SkeletonBlock width="100%" height={56} borderRadius={16} />
      </View>
      {/* Quick actions skeleton */}
      <View style={skStyles.homeQuickActions}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={skStyles.homeQuickAction}>
            <SkeletonBlock width={56} height={56} borderRadius={12} />
            <SkeletonBlock width={50} height={12} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
      {/* Section header */}
      <View style={skStyles.homeSectionHeader}>
        <SkeletonBlock width="45%" height={20} borderRadius={6} />
        <SkeletonBlock width={60} height={16} borderRadius={4} />
      </View>
      {/* Room cards skeleton */}
      <View style={skStyles.homeRooms}>
        <View style={skStyles.homeRoomCard}>
          <SkeletonBlock width="100%" height={200} borderRadius={16} />
          <View style={{ padding: 12 }}>
            <SkeletonBlock width="75%" height={16} borderRadius={4} />
            <SkeletonBlock width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <SkeletonBlock width={100} height={18} borderRadius={4} style={{ marginTop: 12 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default SkeletonBlock;

const skStyles = StyleSheet.create({
  listContainer: {
    padding: Theme.spacing.lg,
    gap: Theme.spacing.lg,
  },
  roomCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Theme.shadows.sm,
  },
  roomCardInfo: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchListContainer: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  searchCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0,
    ...Theme.shadows.sm,
  },
  searchCardInfo: {
    flex: 1,
    padding: Theme.spacing.md,
    justifyContent: 'center',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  detailContent: {
    padding: Theme.spacing.lg,
  },
  hostSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
  },
  homeContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  homeHeader: {
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
    backgroundColor: Colors.white,
  },
  homeSearchBar: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Colors.white,
  },
  homeQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Colors.white,
    marginTop: 4,
  },
  homeQuickAction: {
    alignItems: 'center',
  },
  homeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Colors.white,
    marginTop: 4,
  },
  homeRooms: {
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Colors.white,
    paddingBottom: Theme.spacing.lg,
  },
  homeRoomCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Theme.shadows.md,
  },
});
