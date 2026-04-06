/**
 * Main Navigation Setup for React Native App
 * 
 * KEY CHANGE: Guest browsing is now supported.
 * Unauthenticated users can browse Home and Search.
 * Protected actions (booking, messaging, payment) redirect to Login.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationContainer, NavigationState, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

// Navigation ref accessible outside React components (used by NotificationService)
export const navigationRef = createNavigationContainerRef();

const NAV_STATE_KEY = 'NAVIGATION_STATE_V1';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import LocationSearchScreen from '../screens/search/LocationSearchScreen';
import DateSelectionScreen from '../screens/search/DateSelectionScreen';
import GuestSelectionScreen from '../screens/search/GuestSelectionScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Profile Screens
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MyReviewsScreen from '../screens/profile/MyReviewsScreen';
import FavoritesScreen from '../screens/profile/FavoritesScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import HelpCenterScreen from '../screens/profile/HelpCenterScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import PrivacyPolicyScreen from '../screens/profile/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/profile/TermsOfServiceScreen';
import RefundPolicyScreen from '../screens/profile/RefundPolicyScreen';

// Room & Booking Screens
import RoomDetailScreen from '../screens/room/RoomDetailScreen';
import HotelDetailScreen from '../screens/hotel/HotelDetailScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import BookingDetailScreen from '../screens/booking/BookingDetailScreen';
import WriteReviewScreen from '../screens/booking/WriteReviewScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';

// Chat Screens
import ChatScreen from '../screens/chat/ChatScreen';

// Host Screens
import HostDashboardScreen from '../screens/host/HostDashboardScreen';
import HostListingsScreen from '../screens/host/HostListingsScreen';
import AddEditRoomScreen from '../screens/host/AddEditRoomScreen';
import HostReservationsScreen from '../screens/host/HostReservationsScreen';
import HostCalendarScreen from '../screens/host/HostCalendarScreen';
import HostBalanceScreen from '../screens/host/HostBalanceScreen';
import HostProfileEditScreen from '../screens/host/HostProfileEditScreen';
import HostApplicationScreen from '../screens/host/HostApplicationScreen';
import HostReviewsScreen from '../screens/host/HostReviewsScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminRoomsScreen from '../screens/admin/AdminRoomsScreen';
import AdminHostsScreen from '../screens/admin/AdminHostsScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminWhatsAppChatsScreen from '../screens/admin/AdminWhatsAppChatsScreen';
import AdminChatScreen from '../screens/admin/AdminChatScreen';
import AdminPartialPaymentsScreen from '../screens/admin/AdminPartialPaymentsScreen';
import AdminEditRoomScreen from '../screens/admin/AdminEditRoomScreen';
import AdminReviewsListScreen from '../screens/admin/AdminReviewsListScreen';

import { api } from '../api/client';
import { withAuth } from '../components/withAuth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Protected screen wrappers — redirect to Login if not authenticated
const ProtectedBookingFlow = withAuth(BookingFlowScreen);
const ProtectedBookingDetail = withAuth(BookingDetailScreen);
const ProtectedWriteReview = withAuth(WriteReviewScreen);
const ProtectedPayment = withAuth(PaymentScreen);
const ProtectedChat = withAuth(ChatScreen);
const ProtectedEditProfile = withAuth(EditProfileScreen);
const ProtectedMyReviews = withAuth(MyReviewsScreen);
const ProtectedFavorites = withAuth(FavoritesScreen);

// Host-only screen wrappers
const ProtectedHostListings = withAuth(HostListingsScreen, { role: 'host' });
const ProtectedAddEditRoom = withAuth(AddEditRoomScreen, { role: 'host' });
const ProtectedHostCalendar = withAuth(HostCalendarScreen, { role: 'host' });
const ProtectedHostBalance = withAuth(HostBalanceScreen, { role: 'host' });
const ProtectedHostDashboard = withAuth(HostDashboardScreen, { role: 'host' });
const ProtectedHostProfileEdit = withAuth(HostProfileEditScreen, { role: 'host' });
const ProtectedHostReviews = withAuth(HostReviewsScreen, { role: 'host' });

// Admin-only screen wrappers
const ProtectedAdminDashboard = withAuth(AdminDashboardScreen, { role: 'admin' });
const ProtectedAdminRooms = withAuth(AdminRoomsScreen, { role: 'admin' });
const ProtectedAdminHosts = withAuth(AdminHostsScreen, { role: 'admin' });
const ProtectedAdminBookings = withAuth(AdminBookingsScreen, { role: 'admin' });
const ProtectedAdminUsers = withAuth(AdminUsersScreen, { role: 'admin' });
const ProtectedAdminWhatsAppChats = withAuth(AdminWhatsAppChatsScreen, { role: 'admin' });
const ProtectedAdminChat = withAuth(AdminChatScreen, { role: 'admin' });
const ProtectedAdminPartialPayments = withAuth(AdminPartialPaymentsScreen, { role: 'admin' });
const ProtectedAdminEditRoom = withAuth(AdminEditRoomScreen, { role: 'admin' });
const ProtectedAdminReviewsList = withAuth(AdminReviewsListScreen, { role: 'admin' });

// Tab Bar Icon Component
const TabBarIcon = ({ name, color, size }: { name: string; color: string; size: number }) => (
  <Ionicons name={name as any} size={size} color={color} />
);

/**
 * Hook to fetch and refresh unread notification count.
 * Used by tab navigators to show badge on Notifications tab.
 */
function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      if (response.success && response.data) {
        setCount((response.data as any).count || 0);
      }
    } catch {
      // Silently fail - badge is non-critical
    }
  }, []);

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { count, refresh };
}

// ─── Guest Tabs (unauthenticated users) ──────────────────────────────────────
// Guests can browse Home, Search, and access Login
function GuestBrowseTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 52 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: Theme.fontSize.xs,
          fontWeight: Theme.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: Theme.fontSize.lg,
          fontWeight: Theme.fontWeight.bold,
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="home-outline" color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="search-outline" color={color} size={size} />,
          title: 'Search',
        }}
      />
      <Tab.Screen
        name="Login"
        component={LoginScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="person-outline" color={color} size={size} />,
          title: 'Log in',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Authenticated Guest Tabs ────────────────────────────────────────────────
function AuthenticatedGuestTabs() {
  const { count: unreadCount } = useUnreadNotificationCount();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 52 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: Theme.fontSize.xs,
          fontWeight: Theme.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: Theme.fontSize.lg,
          fontWeight: Theme.fontWeight.bold,
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="home-outline" color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="calendar-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="chatbubble-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="notifications-outline" color={color} size={size} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.error, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="person-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Host Tab Navigator ──────────────────────────────────────────────────────
function HostTabs() {
  const { count: unreadCount } = useUnreadNotificationCount();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 52 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: Theme.fontSize.xs,
          fontWeight: Theme.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: Theme.fontSize.lg,
          fontWeight: Theme.fontWeight.bold,
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HostDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="grid-outline" color={color} size={size} />,
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="HostReservations"
        component={HostReservationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="calendar-outline" color={color} size={size} />,
          title: 'Reservations',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="chatbubble-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="notifications-outline" color={color} size={size} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.error, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="person-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Admin Tab Navigator ──────────────────────────────────────────────────────
function AdminTabs() {
  const { count: unreadCount } = useUnreadNotificationCount();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 52 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: Theme.fontSize.xs,
          fontWeight: Theme.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: Theme.fontSize.lg,
          fontWeight: Theme.fontWeight.bold,
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="grid-outline" color={color} size={size} />,
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="AdminRoomsTab"
        component={AdminRoomsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="home-outline" color={color} size={size} />,
          title: 'Rooms',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="AdminHostsTab"
        component={AdminHostsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="people-outline" color={color} size={size} />,
          title: 'Hosts',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="notifications-outline" color={color} size={size} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.error, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="person-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Moderator Tab Navigator ────────────────────────────────────────────────
function ModeratorTabs() {
  const { count: unreadCount } = useUnreadNotificationCount();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 52 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: Theme.fontSize.xs,
          fontWeight: Theme.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: Theme.fontSize.lg,
          fontWeight: Theme.fontWeight.bold,
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="ModeratorChat"
        component={AdminChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="chatbubbles-outline" color={color} size={size} />,
          title: 'Chats',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ModeratorWhatsApp"
        component={AdminWhatsAppChatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="logo-whatsapp" color={color} size={size} />,
          title: 'WhatsApp',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ModeratorBookings"
        component={AdminBookingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="calendar-outline" color={color} size={size} />,
          title: 'Bookings',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="notifications-outline" color={color} size={size} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.error, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabBarIcon name="person-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Deep linking configuration
const linking = {
  prefixes: ['gowaay://'],
  config: {
    screens: {
      Login: 'login',
      MainTabs: {
        screens: {
          Home: 'home',
          Search: 'search',
          Bookings: 'bookings',
          Messages: 'messages',
          Notifications: 'notifications',
          Profile: 'profile',
          Dashboard: 'dashboard',
          HostReservations: 'reservations',
        },
      } as any,
      RoomDetail: 'room/:roomId',
      HotelDetail: 'hotel/:hotelId',
      BookingDetail: 'booking/:bookingId',
      WriteReview: 'review/:bookingId',
      Chat: 'chat/:threadId',
      SearchScreen: 'search',
      HostListings: 'host/listings',
      HostBalance: 'host/balance',
      HostCalendar: 'host/calendar',
      AdminRooms: 'admin/rooms',
      AdminEditRoom: 'admin/rooms/:roomId/edit',
      AdminHosts: 'admin/hosts',
      AdminBookings: 'admin/bookings',
      AdminUsers: 'admin/users',
      AdminWhatsAppChats: 'admin/whatsapp-chats',
      AdminChat: 'admin/chat',
      AdminPartialPayments: 'admin/partial-payments',
    },
  },
};

// Main App Navigator
export default function AppNavigator() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [navStateReady, setNavStateReady] = useState(false);
  const [initialNavState, setInitialNavState] = useState<NavigationState | undefined>();

  // Restore persisted navigation state on mount
  useEffect(() => {
    const restoreNavState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(NAV_STATE_KEY);
        if (savedState) {
          setInitialNavState(JSON.parse(savedState));
        }
      } catch (e) {
        // Ignore restore errors
      } finally {
        setNavStateReady(true);
      }
    };
    restoreNavState();
  }, []);

  // Persist navigation state on every change
  const handleStateChange = useCallback((state: NavigationState | undefined) => {
    if (state) {
      AsyncStorage.setItem(NAV_STATE_KEY, JSON.stringify(state)).catch(() => {});
    }
  }, []);

  // Clear persisted state on logout so next login starts fresh
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      AsyncStorage.removeItem(NAV_STATE_KEY).catch(() => {});
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  if (authLoading || !navStateReady) {
    return <Loading message="Loading..." />;
  }

  const isHost = user?.role === 'host';
  const isAdmin = user?.role === 'admin';
  const isModerator = isAdmin && user?.adminLevel === 'moderator';

  const getMainTabs = () => {
    if (!isAuthenticated) return GuestBrowseTabs;
    if (isAdmin && isModerator) return ModeratorTabs;
    if (isAdmin) return AdminTabs;
    if (isHost) return HostTabs;
    return AuthenticatedGuestTabs;
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      initialState={isAuthenticated ? initialNavState : undefined}
      onStateChange={handleStateChange}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          contentStyle: { backgroundColor: Colors.backgroundGray },
          headerStyle: {
            backgroundColor: Colors.white,
          },
          headerTitleStyle: {
            fontSize: Theme.fontSize.lg,
            fontWeight: Theme.fontWeight.bold,
          },
          headerTintColor: Colors.textPrimary,
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={getMainTabs()}
          options={{ headerShown: false }}
        />
        
        {/* Public screens — accessible without login */}
        <Stack.Screen 
          name="RoomDetail" 
          component={RoomDetailScreen}
          options={{ title: 'Room Details' }}
        />
        <Stack.Screen 
          name="HotelDetail" 
          component={HotelDetailScreen}
          options={{ title: 'Hotel Details' }}
        />
        <Stack.Screen 
          name="SearchScreen" 
          component={SearchScreen}
          options={{ title: 'Search Properties' }}
        />
        <Stack.Screen 
          name="LocationSearch" 
          component={LocationSearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="DateSelection" 
          component={DateSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GuestSelection" 
          component={GuestSelectionScreen}
          options={{ headerShown: false }}
        />

        {/* Auth screen — for when guest needs to login for protected action */}
        <Stack.Screen 
          name="LoginScreen" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Protected screens — require authentication (withAuth guard) */}
        <Stack.Screen 
          name="BookingFlow" 
          component={ProtectedBookingFlow}
          options={{ title: 'Book This Place' }}
        />
        <Stack.Screen 
          name="BookingDetail" 
          component={ProtectedBookingDetail}
          options={{ title: 'Booking Details' }}
        />
        <Stack.Screen 
          name="WriteReview" 
          component={ProtectedWriteReview}
          options={{ title: 'Write a Review' }}
        />
        <Stack.Screen 
          name="Payment" 
          component={ProtectedPayment}
          options={{ title: 'Payment' }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ProtectedChat}
          options={{ title: 'Chat' }}
        />
        
        {/* Profile Screens (protected) */}
        <Stack.Screen 
          name="EditProfile" 
          component={ProtectedEditProfile}
          options={{ title: 'Edit Profile' }}
        />
        <Stack.Screen 
          name="MyReviews" 
          component={ProtectedMyReviews}
          options={{ title: 'My Reviews' }}
        />
        <Stack.Screen 
          name="Favorites" 
          component={ProtectedFavorites}
          options={{ title: 'My Favorites' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="HelpCenter" 
          component={HelpCenterScreen}
          options={{ title: 'Help Center' }}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen}
          options={{ title: 'About GoWaay' }}
        />
        <Stack.Screen 
          name="PrivacyPolicy" 
          component={PrivacyPolicyScreen}
          options={{ title: 'Privacy Policy' }}
        />
        <Stack.Screen 
          name="TermsOfService" 
          component={TermsOfServiceScreen}
          options={{ title: 'Terms of Service' }}
        />
        <Stack.Screen 
          name="RefundPolicy" 
          component={RefundPolicyScreen}
          options={{ title: 'Refund Policy' }}
        />
        
        {/* Host Screens (protected — host role required) */}
        <Stack.Screen 
          name="HostListings" 
          component={ProtectedHostListings}
          options={{ title: 'My Listings' }}
        />
        <Stack.Screen 
          name="AddRoom" 
          component={ProtectedAddEditRoom}
          options={{ title: 'Add Listing' }}
        />
        <Stack.Screen 
          name="EditRoom" 
          component={ProtectedAddEditRoom}
          options={{ title: 'Edit Listing' }}
        />
        <Stack.Screen 
          name="HostCalendar" 
          component={ProtectedHostCalendar}
          options={{ title: 'Calendar' }}
        />
        <Stack.Screen 
          name="HostBalance" 
          component={ProtectedHostBalance}
          options={{ title: 'Balance & Payouts' }}
        />
        <Stack.Screen 
          name="HostAnalytics" 
          component={ProtectedHostDashboard}
          options={{ title: 'Analytics' }}
        />
        <Stack.Screen 
          name="HostProfileEdit" 
          component={ProtectedHostProfileEdit}
          options={{ title: 'Edit Host Profile' }}
        />
        <Stack.Screen 
          name="HostReviews" 
          component={ProtectedHostReviews}
          options={{ title: 'Guest Reviews' }}
        />
        <Stack.Screen 
          name="HostApplication" 
          component={HostApplicationScreen}
          options={{ title: 'Become a Host' }}
        />

        {/* Admin Screens (protected — admin role required) */}
        <Stack.Screen 
          name="AdminRooms" 
          component={ProtectedAdminRooms}
          options={{ title: 'Room Management', headerShown: false }}
        />
        <Stack.Screen 
          name="AdminEditRoom" 
          component={ProtectedAdminEditRoom}
          options={{ title: 'Edit Room', headerShown: false }}
        />
        <Stack.Screen 
          name="AdminHosts" 
          component={ProtectedAdminHosts}
          options={{ title: 'Host Management', headerShown: false }}
        />
        <Stack.Screen 
          name="AdminBookings" 
          component={ProtectedAdminBookings}
          options={{ title: 'All Bookings', headerShown: false }}
        />
        <Stack.Screen 
          name="AdminUsers" 
          component={ProtectedAdminUsers}
          options={{ title: 'User Management', headerShown: false }}
        />
        <Stack.Screen 
          name="AdminReviews" 
          component={ProtectedAdminRooms}
          options={{ title: 'Reviews' }}
        />
        <Stack.Screen 
          name="AdminWhatsAppChats" 
          component={ProtectedAdminWhatsAppChats}
          options={{ title: 'WhatsApp Chats', headerShown: false }}
        />
        <Stack.Screen 
          name="AdminChat" 
          component={ProtectedAdminChat}
          options={{ title: 'Chat Monitoring', headerShown: false }}
        />
        <Stack.Screen 
          name="AdminPartialPayments" 
          component={ProtectedAdminPartialPayments}
          options={{ title: 'Partial Payments', headerShown: false }}
        />
        <Stack.Screen 
          name="AdminReviewsList" 
          component={ProtectedAdminReviewsList}
          options={{ title: 'All Reviews' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
