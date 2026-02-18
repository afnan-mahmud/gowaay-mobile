/**
 * CachedImage - Drop-in replacement for React Native Image
 *
 * Uses react-native-fast-image for:
 * - Aggressive disk + memory caching
 * - Priority-based loading
 * - Loading placeholder with ActivityIndicator
 *
 * Usage: Same as <Image source={{ uri: '...' }} style={...} resizeMode="cover" />
 */

import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';

interface CachedImageProps {
  source: { uri: string };
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /** FastImage priority: 'low' | 'normal' | 'high'. Default: 'normal' */
  priority?: 'low' | 'normal' | 'high';
}

const RESIZE_MODE_MAP: Record<string, any> = {
  cover: FastImage.resizeMode.cover,
  contain: FastImage.resizeMode.contain,
  stretch: FastImage.resizeMode.stretch,
  center: FastImage.resizeMode.center,
};

const PRIORITY_MAP: Record<string, any> = {
  low: FastImage.priority.low,
  normal: FastImage.priority.normal,
  high: FastImage.priority.high,
};

export default function CachedImage({
  source,
  style,
  resizeMode = 'cover',
  priority = 'normal',
}: CachedImageProps) {
  const [loading, setLoading] = useState(true);

  const handleLoadEnd = useCallback(() => setLoading(false), []);
  const handleError = useCallback(() => setLoading(false), []);

  // If no valid URI, render empty placeholder with same dimensions
  if (!source?.uri) {
    return <View style={[style, styles.emptyPlaceholder]} />;
  }

  const flatStyle = StyleSheet.flatten(style) || {};

  return (
    <View style={[flatStyle, styles.wrapper]}>
      <FastImage
        source={{
          uri: source.uri,
          priority: PRIORITY_MAP[priority] || FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={StyleSheet.absoluteFill}
        resizeMode={RESIZE_MODE_MAP[resizeMode] || FastImage.resizeMode.cover}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#CCCCCC" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  emptyPlaceholder: {
    backgroundColor: '#E8E8E8',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
