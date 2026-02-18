/**
 * Reusable Input Component
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
}

export default function Input({
  label,
  error,
  required = false,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error ? styles.inputContainerError : undefined,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.gray400}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.gray400}
            />
          </TouchableOpacity>
        )}
        
        {!secureTextEntry && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.white,
  },
  inputContainerFocused: {
    borderColor: Colors.brand,
    ...Theme.shadows.sm,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.textPrimary,
  },
  leftIcon: {
    paddingLeft: Theme.spacing.md,
  },
  rightIcon: {
    paddingRight: Theme.spacing.md,
  },
  eyeIcon: {},
  error: {
    fontSize: Theme.fontSize.xs,
    color: Colors.error,
    marginTop: Theme.spacing.xs,
  },
});
