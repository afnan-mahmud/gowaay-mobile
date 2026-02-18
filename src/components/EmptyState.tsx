/**
 * EmptyState - Reusable empty state with optional CTA
 * Use for empty lists (reservations, bookings, notifications)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import Icon from './Icon';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  ctaText?: string;
  onCtaPress?: () => void;
}

export default function EmptyState({
  icon,
  title,
  message,
  ctaText,
  onCtaPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Icon name={icon} size={56} color={Colors.gray400} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {ctaText && onCtaPress && (
        <Button
          title={ctaText}
          onPress={onCtaPress}
          variant="primary"
          size="medium"
          style={styles.cta}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, paddingHorizontal: 36 },
  iconWrapper: {
    width: 110, height: 110, borderRadius: 32,
    backgroundColor: Colors.gray50, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: Colors.gray200,
  },
  icon: {},
  title: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center', letterSpacing: -0.3 },
  message: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24, paddingHorizontal: 8 },
  cta: { minWidth: 200 },
});
