/**
 * ErrorState - Shown when a data fetch fails. Includes retry button.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import Icon from './Icon';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Something Went Wrong',
  message = 'Please check your internet connection and try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Icon name="warning" size={48} color={Colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button title="Try Again" onPress={onRetry} variant="primary" size="medium" style={styles.cta} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, paddingHorizontal: 36 },
  iconWrapper: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: '#FECDD3',
  },
  icon: {},
  title: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center', letterSpacing: -0.3 },
  message: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24, paddingHorizontal: 8 },
  cta: { minWidth: 180 },
});
