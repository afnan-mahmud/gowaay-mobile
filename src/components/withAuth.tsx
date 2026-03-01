/**
 * Higher-Order Component (HOC) that protects screens behind authentication.
 *
 * Usage:
 *   export default withAuth(BookingFlowScreen);                      // Any logged-in user
 *   export default withAuth(HostDashboardScreen, { role: 'host' });  // Hosts only
 *
 * If the user is not authenticated, they are redirected to the Login screen.
 * If a role is required and doesn't match, they are sent back.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

interface WithAuthOptions {
  /** Required role to access the screen (e.g., 'host', 'admin'). Omit for any logged-in user. */
  role?: 'guest' | 'host' | 'admin';
}

// Role hierarchy: admin > host > guest
const ROLE_RANK: Record<string, number> = { guest: 1, host: 2, admin: 3 };

function hasRoleAccess(userRole: string | undefined, requiredRole: string): boolean {
  return (ROLE_RANK[userRole || ''] || 0) >= (ROLE_RANK[requiredRole] || 0);
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: WithAuthOptions
): React.FC<P> {
  const AuthGuard: React.FC<P> = (props) => {
    const { isAuthenticated, loading, user } = useAuth();
    const navigation = useNavigation();

    React.useEffect(() => {
      if (loading) return;

      if (!isAuthenticated) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'LoginScreen' as never },
            ],
          })
        );
        return;
      }

      if (options?.role && !hasRoleAccess(user?.role, options.role)) {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainTabs' as never }],
            })
          );
        }
      }
    }, [isAuthenticated, loading, user, navigation]);

    if (loading) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Loading...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Redirecting to login...</Text>
        </View>
      );
    }

    if (options?.role && !hasRoleAccess(user?.role, options.role)) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Access denied</Text>
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };

  AuthGuard.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthGuard;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  text: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
  },
});
