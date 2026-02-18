/**
 * Custom Switch Component
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Switch({
  value,
  onValueChange,
  label,
  disabled = false,
  style,
}: SwitchProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.switch,
          value && styles.switchActive,
          disabled && styles.switchDisabled,
        ]}
        onPress={() => !disabled && onValueChange(!value)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View
          style={[
            styles.thumb,
            value && styles.thumbActive,
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  label: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
    marginRight: Theme.spacing.md,
  },
  switch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: Colors.gray300,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: Colors.brand,
  },
  switchDisabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Colors.white,
    ...Theme.shadows.sm,
  },
  thumbActive: {
    transform: [{ translateX: 20 }],
  },
});
