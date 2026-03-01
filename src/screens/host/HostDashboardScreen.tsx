/**
 * Host Dashboard Screen — Glassmorphism redesign
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { api, ApiResponse } from '../../api/client';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

const { width: SW } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const GLASS_LIGHT  = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

interface HostStats {
  totalRooms: number;
  activeRooms: number;
  pendingRooms: number;
  totalBookings: number;
  upcomingBookings: number;
  totalEarnings: number;
  pendingAmount: number;
}

export default function HostDashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<HostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setError(null);
      const response: ApiResponse<HostStats> = await api.hosts.stats<HostStats>();
      if (response.success && response.data) setStats(response.data);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Dashboard', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error && !stats) return <ErrorState title="Failed to Load Dashboard" message={error} onRetry={loadStats} />;

  const quickActions = [
    { iconName: 'home-outline', title: 'My Listings', subtitle: `${stats?.activeRooms || 0} active`, color: Colors.brand, bg: Colors.brand + '15', onPress: () => navigation.navigate('HostListings') },
    { iconName: 'add-circle-outline', title: 'Add Listing', subtitle: 'New property', color: Colors.success, bg: Colors.success + '15', onPress: () => navigation.navigate('AddRoom') },
    { iconName: 'calendar-outline', title: 'Reservations', subtitle: `${stats?.upcomingBookings || 0} upcoming`, color: Colors.info, bg: Colors.info + '15', onPress: () => navigation.navigate('HostReservations') },
    { iconName: 'calendar-number-outline', title: 'Calendar', subtitle: 'Availability', color: Colors.warning, bg: Colors.warning + '15', onPress: () => navigation.navigate('HostCalendar') },
    { iconName: 'cash-outline', title: 'Balance', subtitle: `৳${stats?.totalEarnings?.toLocaleString() || 0}`, color: '#10B981', bg: '#10B98115', onPress: () => navigation.navigate('HostBalance') },
    { iconName: 'bar-chart-outline', title: 'Analytics', subtitle: 'View reports', color: Colors.info, bg: Colors.info + '15', onPress: () => navigation.navigate('HostAnalytics') },
  ];

  const statCards = [
    { icon: 'home-outline', value: stats?.totalRooms || 0, label: 'Total Listings', color: Colors.brand },
    { icon: 'checkmark-circle-outline', value: stats?.activeRooms || 0, label: 'Active', color: Colors.success },
    { icon: 'calendar-outline', value: stats?.totalBookings || 0, label: 'Bookings', color: Colors.info },
    { icon: 'time-outline', value: stats?.upcomingBookings || 0, label: 'Upcoming', color: Colors.warning },
  ];

  return (
    <ScrollView
      style={S.root}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
    >
      {/* ── Hero ── */}
      <View style={S.heroWrapper}>
        <View style={S.heroBg} />
        <View style={S.heroCircle1} />
        <View style={S.heroCircle2} />
        <View style={S.heroContent}>
          <Text style={S.heroEyebrow}>Welcome back</Text>
          <Text style={S.heroTitle}>Host Dashboard</Text>
          <Text style={S.heroSub}>Manage your properties</Text>

          {/* Earnings pill on hero */}
          <View style={S.earningsPill}>
            <View style={S.earningsHalf}>
              <Text style={S.earningsLabel}>Total Earnings</Text>
              <Text style={S.earningsValue}>৳{stats?.totalEarnings?.toLocaleString() || 0}</Text>
            </View>
            <View style={S.earningsDivider} />
            <View style={S.earningsHalf}>
              <Text style={S.earningsLabel}>Pending Payout</Text>
              <Text style={[S.earningsValue, { color: '#FCD34D' }]}>
                ৳{stats?.pendingAmount?.toLocaleString() || 0}
              </Text>
            </View>
            <TouchableOpacity style={S.earningsArrow} onPress={() => navigation.navigate('HostBalance')}>
              <Icon name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={S.body}>
        {/* ── Stat Cards ── */}
        <View style={S.statsGrid}>
          {statCards.map((s, i) => (
            <View key={i} style={S.statCard}>
              <View style={[S.statIconWrap, { backgroundColor: s.color + '18' }]}>
                <Icon name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={S.statValue}>{s.value}</Text>
              <Text style={S.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Quick Actions</Text>
          <View style={S.actionsGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity key={i} style={S.actionCard} onPress={action.onPress} activeOpacity={0.72}>
                <View style={[S.actionIconWrap, { backgroundColor: action.bg }]}>
                  <Icon name={action.iconName} size={24} color={action.color} />
                </View>
                <Text style={S.actionTitle}>{action.title}</Text>
                <Text style={S.actionSub}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Tips ── */}
        <View style={S.tipsCard}>
          <View style={S.tipsHeader}>
            <View style={S.tipsIconWrap}>
              <Icon name="bulb-outline" size={20} color={Colors.warning} />
            </View>
            <Text style={S.tipsTitle}>Host Tips</Text>
          </View>
          <Text style={S.tipsText}>
            • Keep your calendar updated{'\n'}
            • Respond to guests quickly{'\n'}
            • Add quality photos{'\n'}
            • Set competitive prices
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  // Hero
  heroWrapper: { paddingBottom: 0, overflow: 'visible' },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.brand,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.08)', top: 30, left: -40,
  },
  heroContent: {
    paddingTop: STATUS_H + 20,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  heroEyebrow: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: Theme.fontWeight.medium, marginBottom: 2 },
  heroTitle: { fontSize: 28, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.5, marginBottom: 2 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 20 },

  earningsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GLASS_LIGHT,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  earningsHalf: { flex: 1 },
  earningsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 3 },
  earningsValue: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.3 },
  earningsDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 14 },
  earningsArrow: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },

  // Body
  body: { padding: 16, paddingTop: 20 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: (SW - 52) / 2,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  statIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 2 },
  statLabel: { fontSize: 12, color: Colors.textSecondary },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.3, marginBottom: 14 },

  // Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  actionCard: { width: '33.33%', paddingHorizontal: 6, marginBottom: 12, alignItems: 'center' },
  actionIconWrap: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionTitle: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 2 },
  actionSub: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  // Tips
  tipsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    ...Theme.shadows.sm,
    marginBottom: 30,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipsIconWrap: { width: 34, height: 34, borderRadius: 12, backgroundColor: Colors.warning + '15', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  tipsTitle: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  tipsText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },
});
