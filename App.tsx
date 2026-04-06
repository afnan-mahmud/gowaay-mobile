/**
 * Main App Component
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ToastProvider } from './src/components/Toast';

// Note: Push notification initialization is now handled by AuthContext
// after successful login/register/auth-check, ensuring the FCM token
// is always registered with a valid auth token.

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

