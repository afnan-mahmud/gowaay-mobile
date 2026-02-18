/**
 * Reusable Card Component
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export default function Card({ children, style, elevated = true }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  elevated: {
    ...Theme.shadows.sm,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
});
