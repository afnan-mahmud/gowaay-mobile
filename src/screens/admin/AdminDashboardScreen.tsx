/**
 * Admin Dashboard Screen — Glassmorphism design matching Host Dashboard
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
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

const { width: SW } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const GLASS_LIGHT = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';
const ADMIN_BG = '#1E293B';

interface AdminStats {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalBookingValue: number;
  platformEarnings: number;
  hostEarnings: number;
  totalHosts: number;
  activeHosts: number;
  pendingHosts: number;
  totalRooms: number;
  approvedRooms: number;
  pendingRooms: number;
  totalUsers: number;
  totalGuests: number;
  upcomingBookings: number;
}

export default function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setError(null);
      const response: ApiResponse<AdminStats> = await api.admin.stats<AdminStats>();
      if (response.success && response.data) setStats(response.data);
      else setError(response.message || 'Failed to load stats');
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  if (loading) return <Loading message="Loading admin dashboard..." />;
  if (error && !stats) return <ErrorState title="Failed to Load Dashboard" message={error} onRetry={loadStats} />;

  const levelLabel = user?.adminLevel === 'super_admin' ? 'Super Admin' : user?.adminLevel === 'moderator' ? 'Moderator' : 'Admin';

  const quickActions = [
    { iconName: 'home-outline', title: 'Rooms', subtitle: `${stats?.pendingRooms || 0} pending`, color: Colors.brand, bg: Colors.brand + '15', onPress: () => navigation.navigate('AdminRooms') },
    { iconName: 'people-outline', title: 'Hosts', subtitle: `${stats?.pendingHosts || 0} pending`, color: '#8B5CF6', bg: '#8B5CF615', onPress: () => navigation.navigate('AdminHosts') },
    { iconName: 'calendar-outline', title: 'Bookings', subtitle: `${stats?.totalBookings || 0} total`, color: Colors.info, bg: Colors.info + '15', onPress: () => navigation.navigate('AdminBookings') },
    { iconName: 'person-outline', title: 'Users', subtitle: `${stats?.totalUsers || 0} total`, color: Colors.success, bg: Colors.success + '15', onPress: () => navigation.navigate('AdminUsers') },
    { iconName: 'star-outline', title: 'Reviews', subtitle: 'Moderate', color: Colors.warning, bg: Colors.warning + '15', onPress: () => navigation.navigate('AdminReviews') },
    { iconName: 'logo-whatsapp', title: 'WhatsApp', subtitle: 'Chat logs', color: '#25D366', bg: '#25D36615', onPress: () => navigation.navigate('AdminWhatsAppChats') },
    { iconName: 'chatbubbles-outline', title: 'Chat', subtitle: 'Conversations', color: '#6366F1', bg: '#6366F115', onPress: () => navigation.navigate('AdminChat') },
  ];

  const statCards = [
    { icon: 'people-outline', value: stats?.totalUsers || 0, label: 'Total Users', color: Colors.info },
    { icon: 'home-outline', value: stats?.approvedRooms || 0, label: 'Active Rooms', color: Colors.success },
    { icon: 'calendar-outline', value: stats?.confirmedBookings || 0, label: 'Confirmed', color: '#8B5CF6' },
    { icon: 'time-outline', value: stats?.pendingHosts || 0, label: 'Pending Hosts', color: Colors.warning },
  ];

  return (
    <ScrollView
      style={S.root}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
    >
      {/* Hero */}
      <View style={S.heroWrapper}>
        <View style={S.heroBg} />
        <View style={S.heroCircle1} />
        <View style={S.heroCircle2} />
        <View style={S.heroContent}>
          <Text style={S.heroEyebrow}>{levelLabel}</Text>
          <Text style={S.heroTitle}>Admin Dashboard</Text>
          <Text style={S.heroSub}>Platform overview & management</Text>

          {/* Revenue pill */}
          <View style={S.earningsPill}>
            <View style={S.earningsHalf}>
              <Text style={S.earningsLabel}>Platform Earnings</Text>
              <Text style={S.earningsValue}>৳{stats?.platformEarnings?.toLocaleString() || 0}</Text>
            </View>
            <View style={S.earningsDivider} />
            <View style={S.earningsHalf}>
              <Text style={S.earningsLabel}>Total Booking Value</Text>
              <Text style={[S.earningsValue, { color: '#FCD34D' }]}>
                ৳{stats?.totalBookingValue?.toLocaleString() || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={S.body}>
        {/* Stat Cards */}
        <View style={S.statsGrid}>
          {statCards.map((s, i) => (
            <View key={i} style={S.statCard}>
              <View style={[S.statIconWrap, { backgroundColor: s.color + '18' }]}>
                <Icon name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={S.statValue}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</Text>
              <Text style={S.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Pending Actions Alert */}
        {((stats?.pendingRooms || 0) > 0 || (stats?.pendingHosts || 0) > 0) && (
          <View style={S.alertCard}>
            <View style={S.alertHeader}>
              <View style={S.alertIconWrap}>
                <Icon name="alert-circle-outline" size={20} color={Colors.warning} />
              </View>
              <Text style={S.alertTitle}>Pending Actions</Text>
            </View>
            {(stats?.pendingRooms || 0) > 0 && (
              <TouchableOpacity style={S.alertRow} onPress={() => navigation.navigate('AdminRooms')}>
                <Text style={S.alertText}>{stats?.pendingRooms} rooms awaiting approval</Text>
                <Icon name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
            {(stats?.pendingHosts || 0) > 0 && (
              <TouchableOpacity style={S.alertRow} onPress={() => navigation.navigate('AdminHosts')}>
                <Text style={S.alertText}>{stats?.pendingHosts} host applications pending</Text>
                <Icon name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
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

        {/* Revenue Breakdown */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Revenue Breakdown</Text>
          <View style={S.revenueCard}>
            <View style={S.revenueRow}>
              <Text style={S.revenueLabel}>Total Booking Value</Text>
              <Text style={S.revenueValue}>৳{stats?.totalBookingValue?.toLocaleString() || 0}</Text>
            </View>
            <View style={S.revenueDivider} />
            <View style={S.revenueRow}>
              <Text style={S.revenueLabel}>Platform Earnings</Text>
              <Text style={[S.revenueValue, { color: Colors.success }]}>৳{stats?.platformEarnings?.toLocaleString() || 0}</Text>
            </View>
            <View style={S.revenueDivider} />
            <View style={S.revenueRow}>
              <Text style={S.revenueLabel}>Host Earnings</Text>
              <Text style={[S.revenueValue, { color: Colors.info }]}>৳{stats?.hostEarnings?.toLocaleString() || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  heroWrapper: { paddingBottom: 0, overflow: 'visible' },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: ADMIN_BG,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(139,92,246,0.12)', top: -50, right: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(59,130,246,0.10)', top: 30, left: -40,
  },
  heroContent: {
    paddingTop: STATUS_H + 20,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  heroEyebrow: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: Theme.fontWeight.medium, marginBottom: 2 },
  heroTitle: { fontSize: 28, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.5, marginBottom: 2 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20 },

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
  earningsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 3 },
  earningsValue: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.3 },
  earningsDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 14 },

  body: { padding: 16, paddingTop: 20 },

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

  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    ...Theme.shadows.sm,
    marginBottom: 20,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  alertIconWrap: { width: 34, height: 34, borderRadius: 12, backgroundColor: Colors.warning + '15', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  alertTitle: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  alertText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.3, marginBottom: 14 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  actionCard: { width: '33.33%', paddingHorizontal: 6, marginBottom: 12, alignItems: 'center' },
  actionIconWrap: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionTitle: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 2 },
  actionSub: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  revenueCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
    marginBottom: 30,
  },
  revenueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  revenueLabel: { fontSize: 14, color: Colors.textSecondary },
  revenueValue: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  revenueDivider: { height: 1, backgroundColor: Colors.gray100 },
});
