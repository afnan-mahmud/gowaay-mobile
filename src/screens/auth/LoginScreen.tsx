/**
 * OTP Login Screen — modern redesign
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { Image } from 'react-native';


type Step = 'phone' | 'otp' | 'name';

export default function LoginScreen({ navigation, route }: any) {
  const { loginWithOtp } = useAuth();

  const [step, setStep]                   = useState<Step>('phone');
  const [phone, setPhone]                 = useState('');
  const [otp, setOtp]                     = useState(['', '', '', '', '', '']);
  const [name, setName]                   = useState('');
  const [isNewUser, setIsNewUser]         = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingHostApplication, setPendingHostApplication] = useState(false);

  const redirectTo     = route?.params?.redirectTo;
  const redirectParams = route?.params?.redirectParams;
  const otpInputRefs   = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleSendOTP = useCallback(async () => {
    setError('');
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.length < 10) { setError('Please enter a valid Bangladesh phone number'); return; }
    setLoading(true);
    try {
      const { api } = require('../../api/client');
      const response = await api.auth.sendOtp({ phone: cleaned });
      if (response.success && response.data) {
        setIsNewUser(response.data.isNewUser);
        setNormalizedPhone(response.data.phone || cleaned);
        setStep('otp');
        setResendCooldown(60);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else {
        setError(response.error || response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  }, [phone]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  }, [otp]);

  const handleOtpKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) otpInputRefs.current[index - 1]?.focus();
  }, [otp]);

  const handleVerifyOTP = useCallback(async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    if (isNewUser && !name && step === 'otp') { setStep('name'); return; }
    setError(''); setLoading(true);
    try {
      const result = await loginWithOtp(normalizedPhone, otpCode, isNewUser ? name : undefined);
      if (result.success) {
        if (pendingHostApplication) {
          setTimeout(() => navigation.navigate('HostApplication'), 150);
        } else if (redirectTo) {
          navigation.replace(redirectTo, redirectParams);
        }
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  }, [otp, isNewUser, name, normalizedPhone, step, loginWithOtp, navigation, redirectTo, redirectParams, pendingHostApplication]);

  const handleResendOTP = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      const { api } = require('../../api/client');
      const response = await api.auth.sendOtp({ phone: normalizedPhone });
      if (response.success) {
        setResendCooldown(60); setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else { setError(response.error || 'Failed to resend OTP'); }
    } catch (err: any) { setError(err.message || 'Failed to resend OTP');
    } finally { setLoading(false); }
  }, [normalizedPhone]);

  const handleNameSubmit = useCallback(async () => {
    if (!name.trim() || name.trim().length < 2) { setError('Please enter your name (at least 2 characters)'); return; }
    await handleVerifyOTP();
  }, [name, handleVerifyOTP]);

  const handleJoinAsHost = () => {
    setPendingHostApplication(true);
  };

  return (
    <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand} translucent />

      {/* Brand hero */}
      <View style={S.hero}>
        <View style={S.heroCircle1} /><View style={S.heroCircle2} />
        <View style={S.logoWrap}>
          <View style={S.logoIcon}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: 72, height: 72 }} 
              resizeMode="contain"
            />
          </View>
          <Text style={S.tagline}>Find Your Perfect Stay</Text>
        </View>
      </View>

      {/* Form card */}
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={S.card}>

          {/* Back button (OTP + name steps) */}
          {step !== 'phone' && (
            <TouchableOpacity onPress={() => { setStep(step === 'name' ? 'otp' : 'phone'); setError(''); }} style={S.backBtn}>
              <Icon name="chevron-back" size={20} color={Colors.textPrimary} />
              <Text style={S.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {/* Step title */}
          <Text style={S.title}>
            {step === 'phone'
              ? (pendingHostApplication ? 'Join as Host' : 'Log in or sign up')
              : step === 'otp' ? 'Confirm your number' : "What's your name?"}
          </Text>
          <Text style={S.subtitle}>
            {step === 'phone' && (pendingHostApplication
              ? 'Enter your phone number to get started as a host'
              : 'Enter your phone number to continue')}
            {step === 'otp' && <>Enter the 6-digit code sent to{'\n'}<Text style={S.phoneHL}>+880{normalizedPhone.startsWith('0') ? normalizedPhone.slice(1) : normalizedPhone}</Text></>}
            {step === 'name' && "This is how you'll appear on GoWaay."}
          </Text>

          {/* Error */}
          {!!error && (
            <View style={S.errorBox}>
              <Icon name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={S.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Phone input ── */}
          {step === 'phone' && (
            <>
              <View style={S.phoneRow}>
                <View style={S.countryCode}>
                  <Text style={S.flag}>🇧🇩</Text>
                  <Text style={S.ccText}>+880</Text>
                </View>
                <TextInput
                  style={S.phoneInput}
                  placeholder="1XXXXXXXXX"
                  placeholderTextColor={Colors.gray400}
                  value={phone}
                  onChangeText={t => { setPhone(t.replace(/[^\d]/g, '')); setError(''); }}
                  keyboardType="phone-pad"
                  maxLength={11}
                  autoFocus
                />
              </View>
              <Text style={S.hint}>We'll send a one-time code to verify your number.</Text>
              <Button title="Continue" onPress={handleSendOTP} loading={loading} fullWidth
                disabled={phone.replace(/[\s\-()]/g, '').length < 10} style={S.cta} />
            </>
          )}

          {/* ── OTP input ── */}
          {step === 'otp' && (
            <>
              <View style={S.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={r => { otpInputRefs.current[i] = r; }}
                    style={[S.otpBox, digit ? S.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={v => handleOtpChange(i, v)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>
              <Button title="Verify" onPress={handleVerifyOTP} loading={loading} fullWidth
                disabled={otp.join('').length !== 6} style={S.cta} />
              <TouchableOpacity onPress={handleResendOTP} disabled={resendCooldown > 0 || loading} style={S.resendBtn}>
                <Text style={[S.resendText, (resendCooldown > 0 || loading) && S.resendDisabled]}>
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Didn't receive the code? Resend"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Name input ── */}
          {step === 'name' && (
            <>
              <TextInput
                style={S.nameInput}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.gray400}
                value={name}
                onChangeText={t => { setName(t); setError(''); }}
                maxLength={50}
                autoFocus
              />
              <Text style={S.hint}>By continuing, you agree to GoWaay's Terms of Service and Privacy Policy.</Text>
              <Button title="Agree and Continue" onPress={handleNameSubmit} loading={loading} fullWidth
                disabled={!name.trim() || name.trim().length < 2} style={S.cta} />
            </>
          )}

          {/* Join as Host / Back to Login */}
          {step === 'phone' && (
            <>
              <View style={S.divider}>
                <View style={S.divLine} /><Text style={S.divText}>or</Text><View style={S.divLine} />
              </View>
              {pendingHostApplication ? (
                <TouchableOpacity onPress={() => setPendingHostApplication(false)} style={S.joinHostBtn}>
                  <Icon name="person-outline" size={18} color={Colors.textPrimary} />
                  <Text style={S.joinHostText}>Back to Login</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleJoinAsHost} style={S.joinHostBtn}>
                  <Icon name="business-outline" size={18} color={Colors.textPrimary} />
                  <Text style={S.joinHostText}>Join as Host</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <Text style={S.footer}>By continuing, you agree to our{'\n'}Terms of Service and Privacy Policy</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.brand },

  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40 },
  heroCircle2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(0,0,0,0.08)', bottom: -20, left: -20 },
  logoWrap: { alignItems: 'center' },
  logoIcon: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...Theme.shadows.md,
  },
  brandName: { fontSize: 32, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  scroll: { flex: 1, backgroundColor: '#F4F4F8' },
  scrollContent: { paddingTop: 0, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
    ...Theme.shadows.lg,
  },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backBtnText: { fontSize: 15, color: Colors.textPrimary, fontWeight: Theme.fontWeight.medium },

  title: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.4, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  phoneHL: { fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, padding: 12,
    borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  errorText: { flex: 1, color: Colors.error, fontSize: 13 },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 14,
    overflow: 'hidden', marginBottom: 10, backgroundColor: Colors.white,
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: Colors.gray50, borderRightWidth: 1, borderRightColor: Colors.gray200,
  },
  flag: { fontSize: 20, marginRight: 6 },
  ccText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  phoneInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 17, color: Colors.textPrimary,
  },
  hint: { fontSize: 12, color: Colors.textTertiary, lineHeight: 18, marginBottom: 16 },
  cta: { marginTop: 4, marginBottom: 8 },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  otpBox: {
    width: 48, height: 58, borderWidth: 2, borderColor: Colors.gray200,
    borderRadius: 14, textAlign: 'center', fontSize: 22, fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary, backgroundColor: Colors.gray50,
  },
  otpBoxFilled: { borderColor: Colors.brand, backgroundColor: '#FFF1F2' },
  resendBtn: { alignItems: 'center', paddingVertical: 10 },
  resendText: { fontSize: 13, color: Colors.brand, fontWeight: Theme.fontWeight.medium },
  resendDisabled: { color: Colors.gray400 },

  nameInput: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 17, color: Colors.textPrimary, backgroundColor: Colors.gray50, marginBottom: 10,
  },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  divText: { paddingHorizontal: 14, fontSize: 13, color: Colors.textTertiary },
  joinHostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.gray300, borderRadius: 14,
    paddingVertical: 14,
  },
  joinHostText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  footer: { textAlign: 'center', fontSize: 12, color: Colors.gray400, marginTop: 24, lineHeight: 18 },
});
