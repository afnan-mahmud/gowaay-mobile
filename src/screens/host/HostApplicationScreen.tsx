/**
 * Host Application Screen
 * Multi-step flow: NID Upload -> Profile Picture -> WhatsApp -> Submit
 * User is already authenticated via OTP at this point.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';

type Step = 'nid' | 'profile' | 'whatsapp' | 'submitting' | 'done';

export default function HostApplicationScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('nid');
  const [submitting, setSubmitting] = useState(false);

  // NID state
  const [nidFrontUri, setNidFrontUri] = useState<string | null>(null);
  const [nidBackUri, setNidBackUri] = useState<string | null>(null);

  // Profile picture state
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);

  // WhatsApp state
  const [whatsapp, setWhatsapp] = useState('');

  const pickImage = (setter: (uri: string | null) => void) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to pick image');
          return;
        }
        const asset: Asset | undefined = response.assets?.[0];
        if (asset?.uri) {
          setter(asset.uri);
        }
      }
    );
  };

  // ── Step 1: NID Upload ────────────────────────────────────────────
  const handleNidNext = () => {
    if (!nidFrontUri || !nidBackUri) {
      Alert.alert('Required', 'Please upload both NID front and back images');
      return;
    }
    setStep('profile');
  };

  // ── Step 2: Profile Picture ───────────────────────────────────────
  const handleProfileNext = () => {
    setStep('whatsapp');
  };

  // ── Step 3: Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!whatsapp || whatsapp.length < 10) {
      Alert.alert('Required', 'Please enter a valid WhatsApp number');
      return;
    }
    if (!nidFrontUri || !nidBackUri) {
      Alert.alert('Error', 'NID images are missing. Please go back and upload them.');
      return;
    }

    setSubmitting(true);
    setStep('submitting');

    try {
      // Upload NID images via authenticated endpoint
      const [nidFrontRes, nidBackRes] = await Promise.all([
        api.uploads.nid(nidFrontUri),
        api.uploads.nid(nidBackUri),
      ]);

      if (!nidFrontRes.success) throw new Error('Failed to upload NID front image');
      if (!nidBackRes.success) throw new Error('Failed to upload NID back image');

      // Upload profile picture if provided
      let profilePicUrl: string | undefined;
      if (profilePicUri) {
        const profileRes = await api.uploads.image(profilePicUri);
        if (profileRes.success && profileRes.data) {
          profilePicUrl = (profileRes.data as any)?.url;
        }
      }

      // Submit host application
      const applyRes = await api.hosts.apply({
        whatsapp,
        nidFrontUrl: (nidFrontRes.data as any).url,
        nidBackUrl: (nidBackRes.data as any).url,
        profilePictureUrl: profilePicUrl,
      });

      if (!applyRes.success) {
        throw new Error(applyRes.message || 'Failed to submit application');
      }

      setStep('done');
    } catch (err: any) {
      setStep('whatsapp');
      Alert.alert('Error', err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step indicators ───────────────────────────────────────────────
  const stepNames = ['NID Upload', 'Photo', 'WhatsApp'];
  const currentIdx = step === 'nid' ? 0 : step === 'profile' ? 1 : 2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Host Application</Text>
        <Text style={styles.subtitle}>Complete verification to start hosting</Text>
      </View>

      {/* Progress */}
      {step !== 'done' && step !== 'submitting' && (
        <View style={styles.progressContainer}>
          {stepNames.map((name, i) => (
            <View key={name} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                i < currentIdx && styles.progressDotCompleted,
                i === currentIdx && styles.progressDotActive,
              ]}>
                <Text style={[
                  styles.progressDotText,
                  (i <= currentIdx) && styles.progressDotTextActive,
                ]}>{i + 1}</Text>
              </View>
              <Text style={[
                styles.progressLabel,
                i === currentIdx && styles.progressLabelActive,
              ]}>{name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── NID STEP ────────────────────────────────── */}
      {step === 'nid' && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>National ID Verification</Text>
          <Text style={styles.cardSubtitle}>
            Upload clear photos of your NID card. This is required for host verification.
          </Text>

          <Text style={styles.fieldLabel}>NID Front *</Text>
          <TouchableOpacity
            style={styles.imagePickerBox}
            onPress={() => pickImage(setNidFrontUri)}
          >
            {nidFrontUri ? (
              <Image source={{ uri: nidFrontUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderIcon}>+</Text>
                <Text style={styles.placeholderText}>Tap to upload NID Front</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>NID Back *</Text>
          <TouchableOpacity
            style={styles.imagePickerBox}
            onPress={() => pickImage(setNidBackUri)}
          >
            {nidBackUri ? (
              <Image source={{ uri: nidBackUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderIcon}>+</Text>
                <Text style={styles.placeholderText}>Tap to upload NID Back</Text>
              </View>
            )}
          </TouchableOpacity>

          <Button
            title="Continue"
            onPress={handleNidNext}
            style={styles.primaryButton}
          />
        </Card>
      )}

      {/* ── PROFILE PICTURE STEP ────────────────────── */}
      {step === 'profile' && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Profile Photo</Text>
          <Text style={styles.cardSubtitle}>
            Add a profile photo so guests can recognize you. (Optional but recommended)
          </Text>

          <TouchableOpacity
            style={styles.profileImageBox}
            onPress={() => pickImage(setProfilePicUri)}
          >
            {profilePicUri ? (
              <Image source={{ uri: profilePicUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profilePlaceholderIcon}>+</Text>
                <Text style={styles.placeholderText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <Button
              title="Back"
              onPress={() => setStep('nid')}
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
            <Button
              title={profilePicUri ? 'Continue' : 'Skip'}
              onPress={handleProfileNext}
              style={styles.primaryButton}
            />
          </View>
        </Card>
      )}

      {/* ── WHATSAPP STEP ───────────────────────────── */}
      {step === 'whatsapp' && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.cardSubtitle}>
            Provide your WhatsApp number for guest communication.
          </Text>

          <Text style={styles.fieldLabel}>WhatsApp Number *</Text>
          <Input
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="01XXX-XXXXXX"
            keyboardType="phone-pad"
          />

          <View style={styles.buttonRow}>
            <Button
              title="Back"
              onPress={() => setStep('profile')}
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
            <Button
              title="Submit Application"
              onPress={handleSubmit}
              disabled={submitting}
              style={styles.primaryButton}
            />
          </View>
        </Card>
      )}

      {/* ── SUBMITTING ──────────────────────────────── */}
      {step === 'submitting' && (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.submittingText}>Uploading documents and submitting...</Text>
          <Text style={styles.submittingSubtext}>This may take a moment</Text>
        </View>
      )}

      {/* ── DONE ────────────────────────────────────── */}
      {step === 'done' && (
        <View style={styles.centeredContainer}>
          <View style={styles.successCircle}>
            <Icon name="checkmark" size={32} color={Colors.white} />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your host application is under review. An admin will verify your NID and get back to you within 24-48 hours.
          </Text>
          <Button
            title="Go to Home"
            onPress={() => navigation.navigate('Home')}
            style={styles.primaryButton}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 24,
  },
  progressStep: {
    alignItems: 'center',
    gap: 4,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.brand,
  },
  progressDotCompleted: {
    backgroundColor: Colors.success,
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray500,
  },
  progressDotTextActive: {
    color: Colors.white,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressLabelActive: {
    color: Colors.brand,
    fontWeight: '600',
  },
  card: {
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  imagePickerBox: {
    borderWidth: 2,
    borderColor: Colors.gray100,
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 150,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: Colors.gray100,
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.gray50,
  },
  placeholderIcon: {
    fontSize: 32,
    color: Colors.gray400,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  profileImageBox: {
    borderWidth: 2,
    borderColor: Colors.gray100,
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
  },
  profilePlaceholderIcon: {
    fontSize: 40,
    color: Colors.gray400,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    marginTop: 20,
    backgroundColor: Colors.brand,
  },
  secondaryButton: {
    flex: 1,
    marginTop: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  submittingText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    letterSpacing: -0.2,
  },
  submittingSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  successSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
});
