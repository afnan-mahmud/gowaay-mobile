/**
 * Centralized Icon wrapper for react-native-vector-icons.
 * Uses Ionicons by default; pass family="Feather" or family="MaterialCommunityIcons" for other sets.
 */

import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export type IconFamily = 'Ionicons' | 'Feather' | 'MaterialCommunityIcons';

interface IconProps {
  family?: IconFamily;
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export default function Icon({
  family = 'Ionicons',
  name,
  size = 24,
  color = '#000',
  style,
}: IconProps) {
  switch (family) {
    case 'Feather':
      return <Feather name={name as any} size={size} color={color} style={style} />;
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={name as any} size={size} color={color} style={style} />;
    default:
      return <Ionicons name={name as any} size={size} color={color} style={style} />;
  }
}
