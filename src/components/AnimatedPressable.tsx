import React, { useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleDown?: number;
  disabled?: boolean;
  hitSlop?: number;
}

export default function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  scaleDown = 0.97,
  disabled = false,
  hitSlop,
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleDown,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale, scaleDown]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
