/**
 * Reusable Button Component with press animation
 */

import React, { useRef, useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }, [scale]);

  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View style={[buttonStyles, { transform: [{ scale }] }]}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? Colors.white : Colors.brand}
          />
        ) : (
          <View style={styles.contentRow}>
            {icon}
            <Text style={textStyles}>{title}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  primary: {
    backgroundColor: Colors.brand,
    ...Theme.shadows.sm,
  },
  secondary: {
    backgroundColor: Colors.gray100,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.brand,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  smallButton: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
  },
  mediumButton: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: Theme.spacing.xl,
  },
  
  text: {
    fontWeight: Theme.fontWeight.semibold,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  outlineText: {
    color: Colors.brand,
  },
  ghostText: {
    color: Colors.brand,
  },
  
  smallText: {
    fontSize: Theme.fontSize.sm,
  },
  mediumText: {
    fontSize: Theme.fontSize.md,
  },
  largeText: {
    fontSize: Theme.fontSize.lg,
  },
  
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
});
