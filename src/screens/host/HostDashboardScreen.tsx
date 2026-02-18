/**
 * Host Dashboard Screen - Overview of host stats and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { api, ApiResponse } from '../../api/client';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError(null);
      const response: ApiResponse<HostStats> = await api.hosts.stats<HostStats>();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Dashboard', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error && !stats) {
    return <ErrorState title="Failed to Load Dashboard" message={error} onRetry={loadStats} />;
  }

  const quickActions = [
    {
      iconName: 'home-outline',
      title: 'My Listings',
      subtitle: `${stats?.activeRooms || 0} active`,
      color: Colors.brand,
      onPress: () => navigation.navigate('HostListings'),
    },
    {
      iconName: 'add-circle-outline',
      title: 'Add Listing',
      subtitle: 'Create new property',
      color: Colors.success,
      onPress: () => navigation.navigate('AddRoom'),
    },
    {
      iconName: 'calendar-outline',
      title: 'Reservations',
      subtitle: `${stats?.upcomingBookings || 0} upcoming`,
      color: Colors.info,
      onPress: () => navigation.navigate('HostReservations'),
    },
    {
      iconName: 'calendar-number-outline',
      title: 'Calendar',
      subtitle: 'Manage availability',
      color: Colors.warning,
      onPress: () => navigation.navigate('HostCalendar'),
    },
    {
      iconName: 'cash-outline',
      title: 'Balance',
      subtitle: `৳${stats?.totalEarnings?.toLocaleString() || 0}`,
      color: Colors.success,
      onPress: () => navigation.navigate('HostBalance'),
    },
    {
      iconName: 'bar-chart-outline',
      title: 'Analytics',
      subtitle: 'View reports',
      color: Colors.info,
      onPress: () => navigation.navigate('HostAnalytics'),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Host Dashboard</Text>
          <Text style={styles.welcomeSubtitle}>Manage your properties</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { backgroundColor: (Colors.brand + '10') as any }] as any}>
              <Icon name="home-outline" size={28} color={Colors.brand} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats?.totalRooms || 0}</Text>
              <Text style={styles.statLabel}>Total Listings</Text>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: (Colors.success + '10') as any }] as any}>
              <Icon name="checkmark-circle-outline" size={28} color={Colors.success} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats?.activeRooms || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { backgroundColor: (Colors.info + '10') as any }] as any}>
              <Icon name="calendar-outline" size={28} color={Colors.info} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats?.totalBookings || 0}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: (Colors.warning + '10') as any }] as any}>
              <Icon name="time-outline" size={28} color={Colors.warning} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats?.upcomingBookings || 0}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </Card>
          </View>
        </View>

        {/* Earnings Card */}
        <Card style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>Earnings Overview</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HostBalance')}>
              <Text style={styles.earningsLink}>View Details →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.earningsContent}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsValue}>
                ৳{stats?.totalEarnings?.toLocaleString() || 0}
              </Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Pending Payout</Text>
              <Text style={[styles.earningsValue, { color: Colors.warning }]}>
                ৳{stats?.pendingAmount?.toLocaleString() || 0}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Icon name={action.iconName} size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips Card */}
        <Card style={styles.tipsCard}>
          <Icon name="bulb-outline" size={28} color={Colors.warning} style={styles.tipsIcon} />
          <Text style={styles.tipsTitle}>Host Tips</Text>
          <Text style={styles.tipsText}>
            • Keep your calendar updated{'\n'}
            • Respond to guests quickly{'\n'}
            • Add quality photos{'\n'}
            • Set competitive prices{'\n'}
            • Maintain cleanliness
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  content: {
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  statIcon: {
    marginBottom: Theme.spacing.xs,
  },
  statValue: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  earningsCard: {
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  earningsLink: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: Theme.fontWeight.medium,
  },
  earningsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsItem: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  earningsValue: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.success,
    letterSpacing: -0.2,
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray100,
    marginHorizontal: Theme.spacing.md,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textTertiary,
    marginBottom: Theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Theme.spacing.xs,
  },
  actionCard: {
    width: '33.333%',
    padding: 14,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
    alignSelf: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  tipsIcon: {
    marginBottom: Theme.spacing.sm,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  tipsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
