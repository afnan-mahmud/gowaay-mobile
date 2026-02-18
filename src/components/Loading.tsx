/**
 * Loading Component
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ message, fullScreen = true }: LoadingProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.brand} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  message: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
  },
});
