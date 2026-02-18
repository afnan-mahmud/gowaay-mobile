/**
 * Register Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Input from '../../components/Input';
import Switch from '../../components/Switch';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { validatePhone, validateEmail } from '../../utils/validators';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      Alert.alert('Invalid Email', emailError);
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      Alert.alert('Invalid Phone', phoneError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register({
      name,
      email,
      password,
      phone,
      isHost, // Include host flag
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Registration Failed', result.message || 'Please try again');
    }
    // Navigation will happen automatically via AuthContext
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join GoWaay today</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            required
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Input
            label="Phone Number"
            placeholder="+880 1XXX-XXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            required
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            required
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            required
          />

          {/* Account Type Selection */}
          <View style={styles.accountTypeContainer}>
            <Text style={styles.accountTypeTitle}>Account Type</Text>
            <View style={styles.accountTypeOptions}>
              <TouchableOpacity
                style={[
                  styles.accountTypeOption,
                  !isHost && styles.accountTypeOptionActive,
                ]}
                onPress={() => setIsHost(false)}
              >
                <Icon
                  name="person-outline"
                  size={28}
                  color={!isHost ? Colors.brand : Colors.textSecondary}
                  style={styles.accountTypeIcon}
                />
                <Text style={[
                  styles.accountTypeLabel,
                  !isHost && styles.accountTypeLabelActive,
                ]}>
                  Guest
                </Text>
                <Text style={styles.accountTypeDescription}>
                  Book accommodations
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accountTypeOption,
                  isHost && styles.accountTypeOptionActive,
                ]}
                onPress={() => setIsHost(true)}
              >
                <Icon
                  name="home-outline"
                  size={28}
                  color={isHost ? Colors.brand : Colors.textSecondary}
                  style={styles.accountTypeIcon}
                />
                <Text style={[
                  styles.accountTypeLabel,
                  isHost && styles.accountTypeLabelActive,
                ]}>
                  Host
                </Text>
                <Text style={styles.accountTypeDescription}>
                  List your property
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            style={styles.registerButton}
          />

          <Button
            title="Already have an account? Login"
            onPress={() => navigation.navigate('Login')}
            variant="ghost"
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Theme.spacing.lg,
  },
  header: {
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  accountTypeContainer: {
    marginBottom: Theme.spacing.lg,
  },
  accountTypeTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  accountTypeOptions: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  accountTypeOption: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  accountTypeOptionActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.brand,
  },
  accountTypeIcon: {
    marginBottom: Theme.spacing.xs,
  },
  accountTypeLabel: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  accountTypeLabelActive: {
    color: Colors.brand,
  },
  accountTypeDescription: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
});
