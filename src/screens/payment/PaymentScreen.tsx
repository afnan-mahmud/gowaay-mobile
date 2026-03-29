/**
 * Payment Screen - EPS WebView Integration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import { Colors } from '../../constants/colors';

export default function PaymentScreen({ route, navigation }: any) {
  const { bookingId, amount } = route.params;
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState('');
  const webViewRef = useRef<WebView>(null);
  // Track whether payment has finished (success/fail/cancel) to allow back navigation
  const paymentFinishedRef = useRef(false);

  // Prevent accidental back navigation while payment is active
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Allow navigation if payment hasn't started yet or has finished
      if (!paymentUrl || paymentFinishedRef.current) {
        return;
      }

      // Payment is active - prevent default and show confirmation
      e.preventDefault();

      Alert.alert(
        'Payment in Progress',
        'Are you sure you want to leave? Your payment may not be completed.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, paymentUrl]);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      const response = await api.payments.initEps({ bookingId });
      
      if (response.success && response.data) {
        const gatewayUrl = (response.data as any).gatewayUrl;
        if (gatewayUrl) {
          setPaymentUrl(gatewayUrl);
        } else {
          Alert.alert('Error', 'Failed to initialize payment');
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to initialize payment');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initialize payment');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Check for success redirect
    if (url.includes('/payment/success') || url.includes('/booking/success')) {
      paymentFinishedRef.current = true;
      Alert.alert(
        'Payment Successful!',
        'Your booking has been confirmed.',
        [
          {
            text: 'View Booking',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'MainTabs' },
                  { name: 'BookingDetail', params: { bookingId } },
                ],
              });
            },
          },
        ]
      );
      return;
    }

    // Check for failure redirect
    if (url.includes('/payment/fail')) {
      paymentFinishedRef.current = true;
      Alert.alert(
        'Payment Failed',
        'Your payment could not be processed. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    // Check for cancel redirect
    if (url.includes('/payment/cancel')) {
      paymentFinishedRef.current = true;
      Alert.alert(
        'Payment Cancelled',
        'You have cancelled the payment.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }
  };

  if (loading) {
    return <Loading message="Initializing payment..." />;
  }

  if (!paymentUrl) {
    return <Loading message="Loading payment gateway..." />;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand} />
          </View>
        )}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F8',
  },
});
