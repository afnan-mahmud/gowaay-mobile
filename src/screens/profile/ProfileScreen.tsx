/**
 * Profile Screen — modern redesign
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import CachedImage from '../../components/CachedImage';
import { IMG_BASE_URL } from '../../constants/config';
import DeviceInfo from 'react-native-device-info';

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${IMG_BASE_URL}${imageUrl}`;
};

const MENU_GROUPS = (user: any, navigation: any) => {
  const isAdmin = user?.role === 'admin';
  const isHost = user?.role === 'host';

  const accountItems: any[] = [
    { icon: 'person-outline', iconBg: '#EFF6FF', iconColor: '#2563EB', title: 'Edit Profile', sub: 'Update your personal info', onPress: () => navigation.navigate('EditProfile') },
  ];
  if (!isAdmin && !isHost) {
    accountItems.push({ icon: 'heart-outline', iconBg: '#FFF1F2', iconColor: Colors.brand, title: 'Favorites', sub: 'Your saved properties', onPress: () => navigation.navigate('Favorites') });
  }
  if (isAdmin) {
    accountItems.push({ icon: 'star-outline', iconBg: '#FFFBEB', iconColor: '#D97706', title: 'All Reviews', sub: 'Manage guest reviews', onPress: () => navigation.navigate('AdminReviewsList') });
  } else {
    accountItems.push({ icon: 'star-outline', iconBg: '#FFFBEB', iconColor: '#D97706', title: 'My Reviews', sub: 'Reviews you have written', onPress: () => navigation.navigate('MyReviews') });
  }

  const bookingsNav = isAdmin ? 'AdminBookings' : isHost ? 'HostReservations' : 'Bookings';
  const bookingsTitle = isAdmin ? 'All Bookings' : isHost ? 'Reservations' : 'My Bookings';
  const bookingsSub = isAdmin ? 'Manage all bookings' : isHost ? 'View your reservations' : 'View your booking history';

  return [
    { title: 'Account', items: accountItems },
    {
      title: 'Activity',
      items: [
        { icon: 'calendar-outline', iconBg: '#EFF6FF', iconColor: '#2563EB', title: bookingsTitle, sub: bookingsSub, onPress: () => navigation.navigate(bookingsNav) },
        { icon: 'chatbubble-outline', iconBg: '#ECFDF5', iconColor: '#059669', title: 'Messages', sub: 'Chat with hosts', onPress: () => navigation.navigate('Messages') },
      ],
    },
    ...(isHost ? [{
      title: 'Host',
      items: [
        { icon: 'business-outline', iconBg: '#FFFBEB', iconColor: '#D97706', title: 'Host Dashboard', sub: 'Manage your properties', onPress: () => navigation.navigate('Dashboard') },
        { icon: 'home-outline', iconBg: '#FFFBEB', iconColor: '#D97706', title: 'My Listings', sub: 'Manage your listings', onPress: () => navigation.navigate('HostListings') },
        { icon: 'id-card-outline', iconBg: '#FFFBEB', iconColor: '#D97706', title: 'Host Profile', sub: 'Edit host information', onPress: () => navigation.navigate('HostProfileEdit') },
      ],
    }] : []),
    ...(isAdmin ? [{
      title: 'Admin',
      items: [
        { icon: 'card-outline', iconBg: '#F3E8FF', iconColor: '#8B5CF6', title: 'Partial Payments', sub: 'View & track partial payments', onPress: () => navigation.navigate('AdminPartialPayments') },
      ],
    }] : []),
    {
      title: 'More',
      items: [
        { icon: 'settings-outline', iconBg: Colors.gray100, iconColor: Colors.gray600, title: 'Settings', sub: 'App preferences', onPress: () => navigation.navigate('Settings') },
        { icon: 'help-circle-outline', iconBg: Colors.gray100, iconColor: Colors.gray600, title: 'Help Center', sub: 'Get support', onPress: () => navigation.navigate('HelpCenter') },
        { icon: 'information-circle-outline', iconBg: Colors.gray100, iconColor: Colors.gray600, title: 'About', sub: 'About GoWaay', onPress: () => navigation.navigate('About') },
      ],
    },
  ];
};

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const groups = MENU_GROUPS(user, navigation);

  return (
    <ScrollView style={S.root} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand} translucent />

      {/* ── Hero header ── */}
      <View style={S.hero}>
        <View style={S.heroCircle} />
        <View style={S.avatarWrap}>
          <View style={S.avatar}>
          {user?.profilePictureUrl ? (
            <CachedImage
              source={{ uri: getImageUrl(user.profilePictureUrl) }}
              style={S.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={S.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          )}
          </View>
          {user?.role && (
            <View style={[S.roleBadge, user.role === 'host' && S.roleBadgeHost, user.role === 'admin' && S.roleBadgeAdmin]}>
              <Icon name={user.role === 'admin' ? 'shield-checkmark-outline' : user.role === 'host' ? 'business-outline' : 'person-outline'} size={11} color={Colors.white} />
              <Text style={S.roleBadgeText}>{user.role === 'admin' ? 'Admin' : user.role === 'host' ? 'Host' : 'Guest'}</Text>
            </View>
          )}
        </View>
        <Text style={S.name}>{user?.name || 'User'}</Text>
        {user?.email ? <Text style={S.contactText}>{user.email}</Text> : null}
        {user?.phone ? (
          <View style={S.contactRow}>
            <Icon name="call-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={S.contactText}>{user.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Stats row ── */}
      <View style={S.statsRow}>
        {[
          { label: 'Bookings', icon: 'calendar-outline', nav: user?.role === 'admin' ? 'AdminBookings' : user?.role === 'host' ? 'HostReservations' : 'Bookings' },
          ...(user?.role !== 'admin' && user?.role !== 'host' ? [{ label: 'Favorites', icon: 'heart-outline', nav: 'Favorites' }] : []),
          { label: 'Reviews', icon: 'star-outline', nav: user?.role === 'admin' ? 'AdminReviewsList' : 'MyReviews' },
        ].map((s, i) => (
          <TouchableOpacity key={i} style={S.statCard} onPress={() => navigation.navigate(s.nav)} activeOpacity={0.7}>
            <Icon name={s.icon} size={20} color={Colors.brand} />
            <Text style={S.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Menu groups ── */}
      <View style={S.menuContainer}>
        {groups.map((group, gi) => (
          <View key={gi} style={S.menuGroup}>
            <Text style={S.groupTitle}>{group.title}</Text>
            <View style={S.groupCard}>
              {group.items.map((item: any, ii: number) => (
                <TouchableOpacity
                  key={ii}
                  style={[S.menuItem, ii < group.items.length - 1 && S.menuItemBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[S.menuIconWrap, { backgroundColor: item.iconBg }]}>
                    <Icon name={item.icon} size={19} color={item.iconColor} />
                  </View>
                  <View style={S.menuContent}>
                    <Text style={S.menuTitle}>{item.title}</Text>
                    <Text style={S.menuSub}>{item.sub}</Text>
                  </View>
                  <Icon name="chevron-forward-outline" size={16} color={Colors.gray400} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* ── Logout ── */}
      <View style={S.logoutWrap}>
        <TouchableOpacity style={S.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Icon name="log-out-outline" size={18} color={Colors.error} />
          <Text style={S.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={S.version}>GoWaay v{DeviceInfo.getVersion()}</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  hero: {
    backgroundColor: Colors.brand,
    paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24,
    alignItems: 'center', overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroCircle: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60,
  },
  avatarWrap: { marginBottom: 14, position: 'relative' },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarText: { fontSize: 36, fontWeight: Theme.fontWeight.bold, color: Colors.brand },
  roleBadge: {
    position: 'absolute', bottom: -4, right: -4,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.textPrimary, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 2, borderColor: Colors.brand,
  },
  roleBadgeHost: { backgroundColor: '#D97706' },
  roleBadgeAdmin: { backgroundColor: '#8B5CF6' },
  roleBadgeText: { fontSize: 10, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  name: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.white, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  contactText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: -1, marginBottom: 0,
    backgroundColor: Colors.white, borderRadius: 18, padding: 6,
    ...Theme.shadows.md, gap: 2,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 5 },
  statLabel: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.textSecondary },

  menuContainer: { paddingHorizontal: 20, paddingTop: 20 },
  menuGroup: { marginBottom: 20 },
  groupTitle: {
    fontSize: 12, fontWeight: Theme.fontWeight.semibold,
    color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, marginLeft: 4,
  },
  groupCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', ...Theme.shadows.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  menuIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 1 },
  menuSub: { fontSize: 12, color: Colors.textSecondary },

  logoutWrap: { paddingHorizontal: 20, marginBottom: 16 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#FCA5A5', ...Theme.shadows.sm,
  },
  logoutText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.error },

  version: { textAlign: 'center', fontSize: 12, color: Colors.gray400, marginBottom: 8 },
});
