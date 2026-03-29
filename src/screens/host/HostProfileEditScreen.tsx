/**
 * Host Profile Edit Screen
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Input from '../../components/Input';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';


// Helper function to get full image URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${IMG_BASE_URL}${imageUrl}`;
};

export default function HostProfileEditScreen({ navigation }: any) {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationMapUrl, setLocationMapUrl] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  // Track unsaved changes for back-navigation protection
  const hasUnsavedChangesRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const markDirty = useCallback(() => {
    if (initialLoadDoneRef.current) {
      hasUnsavedChangesRef.current = true;
    }
  }, []);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChangesRef.current) return;

      e.preventDefault();
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: "Don't Leave", style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadHostProfile();
  }, []);

  const loadHostProfile = async () => {
    try {
      const response = await api.hosts.profile();
      if (response.success && response.data) {
        const profile = response.data as {
          displayName?: string;
          phone?: string;
          whatsapp?: string;
          locationName?: string;
          locationMapUrl?: string;
          profilePictureUrl?: string;
        };
        setDisplayName(profile.displayName || '');
        setPhone(profile.phone || '');
        setWhatsapp(profile.whatsapp || '');
        setLocationName(profile.locationName || '');
        setLocationMapUrl(profile.locationMapUrl || '');
        setProfilePictureUrl(profile.profilePictureUrl || null);
      }
    } catch (error) {
      console.error('Failed to load host profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      initialLoadDoneRef.current = true;
    }
  };

  // Track form field changes to detect unsaved edits
  useEffect(() => { markDirty(); }, [displayName, phone, whatsapp, locationName, locationMapUrl, profilePictureUrl]);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (!result.didCancel && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setUploadingImage(true);
          
          try {
            console.log('📤 Uploading host profile picture:', {
              uri: asset.uri.substring(0, 50) + '...',
              width: asset.width,
              height: asset.height,
            });
            
            const response = await api.uploads.image(asset.uri);
            
            console.log('📦 Upload response:', {
              success: response.success,
              hasData: !!response.data,
            });
            
            if (response.success && response.data) {
              const imageUrl = (response.data as any).url || (response.data as any).imageUrl;
              if (imageUrl) {
                setProfilePictureUrl(imageUrl);
                console.log('✅ Host profile picture uploaded:', imageUrl);
              } else {
                Alert.alert('Error', 'Failed to get image URL from server');
              }
            } else {
              const errorMsg = (response as any).message || (response as any).error || 'Network error';
              Alert.alert('Upload Failed', `Failed to upload image: ${errorMsg}`);
            }
          } catch (uploadError: any) {
            console.error('❌ Error uploading image:', uploadError);
            Alert.alert('Upload Error', uploadError.message || 'Failed to upload image');
          } finally {
            setUploadingImage(false);
          }
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      setUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    // Validation
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    setSubmitting(true);

    try {
      const profileData: any = {
        displayName: displayName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        locationName: locationName.trim(),
        locationMapUrl: locationMapUrl.trim(),
      };

      // Add profile picture URL if uploaded
      if (profilePictureUrl) {
        profileData.profilePictureUrl = profilePictureUrl;
      }

      console.log('📤 Updating host profile:', {
        displayName: profileData.displayName,
        hasPhone: !!profileData.phone,
        hasProfilePicture: !!profileData.profilePictureUrl,
      });

      const response = await api.hosts.updateProfile(profileData);

      console.log('📦 Update response:', {
        success: response.success,
        message: (response as any).message,
      });

      if (response.success) {
        hasUnsavedChangesRef.current = false;
        Alert.alert('Success', 'Host profile updated successfully', [
          {
            text: 'OK',
            onPress: async () => {
              await refreshUser();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading profile..." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Icon name="information-circle-outline" size={24} color={Colors.info} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            This information will be visible to guests when they view your properties.
          </Text>
        </Card>

        {/* Basic Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Input
            label="Display Name*"
            placeholder="Your host name"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Input
            label="Phone Number*"
            placeholder="+880 1XXX-XXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="WhatsApp Number"
            placeholder="+880 1XXX-XXXXXX"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
          />
        </Card>

        {/* Location Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>

          <Input
            label="Location/Address"
            placeholder="Your city or area"
            value={locationName}
            onChangeText={setLocationName}
          />

          <Input
            label="Google Maps URL"
            placeholder="https://maps.google.com/..."
            value={locationMapUrl}
            onChangeText={setLocationMapUrl}
            autoCapitalize="none"
          />
        </Card>

        {/* Verification Documents */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Documents</Text>
          <Text style={styles.sectionSubtitle}>
            To update your NID or other verification documents, please contact support.
          </Text>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Alert.alert('Contact Support', 'Email: support@gowaay.com\nPhone: 01611-553628')}
          >
            <Icon name="mail-outline" size={16} color={Colors.brand} />
            <Text style={styles.contactButtonText}> Contact Support</Text>
          </TouchableOpacity>
        </Card>

        {/* Submit Button */}
        <Button
          title="Save Changes"
          onPress={handleUpdate}
          loading={submitting}
          style={styles.submitButton}
        />

        <Button
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        />

        <Text style={styles.disclaimer}>
          * Required fields
        </Text>
      </View>
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
  },
  section: {
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textTertiary,
    marginBottom: Theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.md,
    lineHeight: 20,
  },
  infoCard: {
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Theme.shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoIcon: {
    marginRight: Theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  submitButton: {
    marginTop: Theme.spacing.md,
  },
  cancelButton: {
    marginTop: Theme.spacing.sm,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  changePhotoButton: {
    paddingHorizontal: 14,
    paddingVertical: Theme.spacing.sm,
  },
  changePhotoButtonDisabled: {
    opacity: 0.5,
  },
  changePhotoText: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: Theme.fontWeight.medium,
  },
});
