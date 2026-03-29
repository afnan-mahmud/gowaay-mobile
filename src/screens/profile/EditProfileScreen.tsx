/**
 * Edit Profile Screen
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import CachedImage from '../../components/CachedImage';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { api } from '../../api/client';
import { IMG_BASE_URL } from '../../constants/config';
import { validatePhone } from '../../utils/validators';

// Helper function to get full image URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${IMG_BASE_URL}${imageUrl}`;
};

export default function EditProfileScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

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
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      });
      // Set profile picture if available
      if (user.profilePictureUrl) {
        setProfilePictureUrl(user.profilePictureUrl);
      }
      // Mark initial load done after user data is populated
      initialLoadDoneRef.current = true;
    }
  }, [user]);

  // Track form field changes to detect unsaved edits
  useEffect(() => { markDirty(); }, [formData.name, formData.phone, profilePictureUrl]);

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
            console.log('📤 Uploading profile picture:', {
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
                console.log('✅ Profile picture uploaded:', imageUrl);
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
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    // Validate phone if provided
    if (formData.phone.trim()) {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) {
        Alert.alert('Invalid Phone', phoneError);
        return;
      }
    }

    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
      };

      // Add profile picture URL if uploaded
      if (profilePictureUrl) {
        updateData.profilePictureUrl = profilePictureUrl;
      }

      console.log('📤 Updating profile:', {
        name: updateData.name,
        hasPhone: !!updateData.phone,
        hasProfilePicture: !!updateData.profilePictureUrl,
      });

      const response = await api.auth.updateProfile(updateData);

      console.log('📦 Update response:', {
        success: response.success,
        message: (response as any).message,
      });

      if (response.success) {
        hasUnsavedChangesRef.current = false;
        Alert.alert('Success', 'Profile updated successfully');
        // Refresh user data from server
        await refreshUser();
        navigation.goBack();
      } else {
        Alert.alert('Error', (response as any).message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
      });
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {profilePictureUrl ? (
              <CachedImage
                source={{ uri: getImageUrl(profilePictureUrl) }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {formData.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color={Colors.white} />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.changePhotoButton, uploadingImage && styles.changePhotoButtonDisabled]}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            <Text style={styles.changePhotoText}>
              {uploadingImage ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.email}
              editable={false}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+880 1XXX-XXXXXX"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </Card>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Save Changes"
          onPress={handleUpdate}
          loading={loading}
          fullWidth
        />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          fullWidth
          style={{ marginTop: Theme.spacing.md }}
        />
      </View>

      {/* Change Password */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity
          style={styles.securityItem}
          onPress={() => Alert.alert('Coming Soon', 'Change password feature will be available soon')}
        >
          <Icon name="lock-closed-outline" size={20} color={Colors.brand} style={styles.securityItemIcon} />
          <View style={styles.securityItemContent}>
            <Text style={styles.securityItemTitle}>Change Password</Text>
            <Text style={styles.securityItemSubtitle}>Update your password</Text>
          </View>
          <Icon name="chevron-forward-outline" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  card: { marginHorizontal: 16, marginTop: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 96, height: 96, borderRadius: 28, backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    overflow: 'hidden', position: 'relative', borderWidth: 3, borderColor: Colors.gray100,
  },
  avatarImage: { width: 96, height: 96, borderRadius: 28 },
  avatarText: { fontSize: 38, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  uploadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderRadius: 28,
  },
  changePhotoButton: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.gray50, borderRadius: 10, borderWidth: 1, borderColor: Colors.gray200 },
  changePhotoButtonDisabled: { opacity: 0.5 },
  changePhotoText: { fontSize: 13, color: Colors.brand, fontWeight: Theme.fontWeight.semibold },
  form: { gap: 16 },
  inputGroup: { gap: 4 },
  label: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: {
    backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.gray200,
    borderRadius: 14, padding: 14, fontSize: 15, color: Colors.textPrimary,
  },
  inputDisabled: { backgroundColor: Colors.gray100, color: Colors.textSecondary },
  helperText: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  buttonContainer: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 0, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  securityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  securityItemIcon: { marginRight: 12 },
  securityItemContent: { flex: 1 },
  securityItemTitle: { fontSize: 15, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  securityItemSubtitle: { fontSize: 12, color: Colors.textSecondary },
});
