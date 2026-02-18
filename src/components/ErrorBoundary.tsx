/**
 * ErrorBoundary - Catches render / lifecycle errors so the app
 * shows a recovery screen instead of a white crash.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🐛</Text>
          </View>
          <Text style={styles.title}>Oops! Something Crashed</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Please try again.
          </Text>
          <Button title="Reload" onPress={this.handleReset} variant="primary" size="medium" style={styles.cta} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xxl,
    backgroundColor: Colors.backgroundGray,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Theme.spacing.xl,
  },
  cta: {
    minWidth: 180,
  },
});
