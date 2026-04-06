/**
 * Admin Edit Room Screen — Edit any room as admin
 * Uses admin API endpoints (GET /admin/rooms/:id, PUT /admin/rooms/:id)
 * Mirrors the web admin edit page functionality
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';
import { getErrorMessage } from '../../utils/errorMessages';

const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const MAX_ROOM_IMAGES = 15;

interface RoomImage {
  url: string;
  w: number;
  h: number;
}

const PLACE_TYPES = [
  { value: 'entire_place', label: 'Entire Place' },
  { value: 'private_room', label: 'Private Room' },
  { value: 'shared_room', label: 'Shared Room' },
  { value: 'studio_apartment', label: 'Studio Apartment' },
];

const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'resort', label: 'Resort' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'guest_house', label: 'Guest House' },
  { value: 'villa', label: 'Villa' },
  { value: 'hostel_beds', label: 'Hostel Beds' },
  { value: 'farm_house', label: 'Farm House' },
];

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${IMG_BASE_URL}${imageUrl}`;
};

export default function AdminEditRoomScreen({ route, navigation }: any) {
  const { roomId } = route.params || {};
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form fields (matching web edit page)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationMapUrl, setLocationMapUrl] = useState('');
  const [placeType, setPlaceType] = useState('entire_place');
  const [propertyType, setPropertyType] = useState('hotel');
  const [maxGuests, setMaxGuests] = useState('1');
  const [beds, setBeds] = useState('1');
  const [baths, setBaths] = useState('1');
  const [basePriceTk, setBasePriceTk] = useState('0');
  const [commissionTk, setCommissionTk] = useState('0');
  const [images, setImages] = useState<RoomImage[]>([]);
  const [instantBooking, setInstantBooking] = useState(false);

  // Picker visibility
  const [showPlaceTypePicker, setShowPlaceTypePicker] = useState(false);
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);

  // Unsaved changes tracking
  const hasUnsavedChangesRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const markDirty = useCallback(() => {
    if (initialLoadDoneRef.current) {
      hasUnsavedChangesRef.current = true;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChangesRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: "Don't Leave", style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  useEffect(() => { markDirty(); }, [title, description, address, locationName, basePriceTk, commissionTk, maxGuests, beds, baths, images.length, instantBooking, placeType, propertyType]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getRoom(roomId);
      if (response.success && response.data) {
        const room = response.data as any;
        setTitle(room.title || '');
        setDescription(room.description || '');
        setAddress(room.address || '');
        setLocationName(room.locationName || '');
        setLocationMapUrl(room.locationMapUrl || '');
        setPlaceType(room.placeType || 'entire_place');
        setPropertyType(room.propertyType || 'hotel');
        setMaxGuests(room.maxGuests?.toString() || '1');
        setBeds(room.beds?.toString() || '1');
        setBaths(room.baths?.toString() || '1');
        setBasePriceTk(room.basePriceTk?.toString() || '0');
        setCommissionTk(room.commissionTk?.toString() || '0');
        setImages(room.images || []);
        setInstantBooking(room.instantBooking || false);
      } else {
        Alert.alert('Error', response.message || 'Failed to load room');
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Error', getErrorMessage(err));
      navigation.goBack();
    } finally {
      setLoading(false);
      initialLoadDoneRef.current = true;
    }
  };

  const pickImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: MAX_ROOM_IMAGES - images.length,
        quality: 0.8,
      });

      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setUploading(true);
        const uploadedImages: RoomImage[] = [];

        for (const asset of result.assets) {
          if (asset.uri) {
            try {
              const response = await api.uploads.image(asset.uri);
              if (response.success && response.data) {
                const imageUrl = (response.data as any).url || (response.data as any).imageUrl;
                if (imageUrl) {
                  uploadedImages.push({
                    url: imageUrl,
                    w: asset.width || 800,
                    h: asset.height || 600,
                  });
                }
              } else {
                Alert.alert('Upload Failed', response.message || 'Failed to upload image');
              }
            } catch (uploadError: any) {
              Alert.alert('Upload Error', getErrorMessage(uploadError));
            }
          }
        }

        if (uploadedImages.length > 0) {
          setImages((prev) => [...prev, ...uploadedImages]);
        }
        setUploading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title'); return; }
    if (!description.trim()) { Alert.alert('Error', 'Please enter a description'); return; }
    if (!address.trim()) { Alert.alert('Error', 'Please enter an address'); return; }
    if (!locationName.trim()) { Alert.alert('Error', 'Please enter a location name'); return; }
    if (images.length === 0) { Alert.alert('Error', 'Please upload at least one image'); return; }
    const basePrice = parseFloat(basePriceTk);
    if (isNaN(basePrice) || basePrice <= 0) { Alert.alert('Error', 'Please enter a valid base price'); return; }
    const guests = parseInt(maxGuests);
    if (isNaN(guests) || guests < 1) { Alert.alert('Error', 'Guests must be at least 1'); return; }
    const bedsVal = parseInt(beds);
    if (isNaN(bedsVal) || bedsVal < 1) { Alert.alert('Error', 'Beds must be at least 1'); return; }
    const bathsVal = parseInt(baths);
    if (isNaN(bathsVal) || bathsVal < 1) { Alert.alert('Error', 'Baths must be at least 1'); return; }

    const commission = parseFloat(commissionTk) || 0;

    setSaving(true);
    try {
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        locationName: locationName.trim(),
        locationMapUrl: locationMapUrl.trim() || undefined,
        placeType,
        propertyType,
        maxGuests: guests,
        beds: bedsVal,
        baths: bathsVal,
        basePriceTk: basePrice,
        commissionTk: commission,
        totalPriceTk: basePrice + commission,
        images,
        instantBooking,
      };

      const response = await api.admin.updateRoom(roomId, updateData);
      if (response.success) {
        hasUnsavedChangesRef.current = false;
        Toast.show({ type: 'success', title: 'Saved', message: 'Room updated successfully' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', title: 'Failed', message: response.message || 'Failed to update room' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Failed', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading message="Loading room..." />;

  const totalPrice = (parseFloat(basePriceTk) || 0) + (parseFloat(commissionTk) || 0);

  return (
    <KeyboardAvoidingView
      style={S.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Edit Room</Text>
          <Text style={S.headerSub}>Update room information</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Basic Information ────────────────────────── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Basic Information</Text>

          <Text style={S.label}>Title *</Text>
          <TextInput style={S.input} value={title} onChangeText={setTitle} placeholder="Enter property title" placeholderTextColor={Colors.gray400} />

          <Text style={S.label}>Description *</Text>
          <TextInput style={[S.input, S.textArea]} value={description} onChangeText={setDescription} placeholder="Describe the property" placeholderTextColor={Colors.gray400} multiline numberOfLines={4} textAlignVertical="top" />

          <View style={S.row}>
            <View style={S.halfField}>
              <Text style={S.label}>Address *</Text>
              <TextInput style={S.input} value={address} onChangeText={setAddress} placeholder="Full address" placeholderTextColor={Colors.gray400} />
            </View>
            <View style={S.halfField}>
              <Text style={S.label}>Location Name *</Text>
              <TextInput style={S.input} value={locationName} onChangeText={setLocationName} placeholder="e.g., Dhaka" placeholderTextColor={Colors.gray400} />
            </View>
          </View>

          <Text style={S.label}>Google Maps URL (Optional)</Text>
          <TextInput style={S.input} value={locationMapUrl} onChangeText={setLocationMapUrl} placeholder="https://maps.google.com/..." placeholderTextColor={Colors.gray400} autoCapitalize="none" />

          {/* Property Type picker */}
          <Text style={S.label}>Property Type *</Text>
          <TouchableOpacity style={S.pickerBtn} onPress={() => setShowPropertyTypePicker(!showPropertyTypePicker)}>
            <Text style={S.pickerBtnText}>
              {PROPERTY_TYPES.find((t) => t.value === propertyType)?.label || 'Select'}
            </Text>
            <Icon name="chevron-down-outline" size={18} color={Colors.gray500} />
          </TouchableOpacity>
          {showPropertyTypePicker && (
            <View style={S.pickerOptions}>
              {PROPERTY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[S.pickerOption, propertyType === t.value && S.pickerOptionActive]}
                  onPress={() => { setPropertyType(t.value); setShowPropertyTypePicker(false); }}
                >
                  <Text style={[S.pickerOptionText, propertyType === t.value && S.pickerOptionTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Place Type picker */}
          <Text style={S.label}>Place Type *</Text>
          <TouchableOpacity style={S.pickerBtn} onPress={() => setShowPlaceTypePicker(!showPlaceTypePicker)}>
            <Text style={S.pickerBtnText}>
              {PLACE_TYPES.find((t) => t.value === placeType)?.label || 'Select'}
            </Text>
            <Icon name="chevron-down-outline" size={18} color={Colors.gray500} />
          </TouchableOpacity>
          {showPlaceTypePicker && (
            <View style={S.pickerOptions}>
              {PLACE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[S.pickerOption, placeType === t.value && S.pickerOptionActive]}
                  onPress={() => { setPlaceType(t.value); setShowPlaceTypePicker(false); }}
                >
                  <Text style={[S.pickerOptionText, placeType === t.value && S.pickerOptionTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Capacity */}
          <View style={S.threeCol}>
            <View style={S.thirdField}>
              <Text style={S.label}>Guests *</Text>
              <TextInput style={S.input} value={maxGuests} onChangeText={setMaxGuests} keyboardType="numeric" placeholder="1" placeholderTextColor={Colors.gray400} />
            </View>
            <View style={S.thirdField}>
              <Text style={S.label}>Beds *</Text>
              <TextInput style={S.input} value={beds} onChangeText={setBeds} keyboardType="numeric" placeholder="1" placeholderTextColor={Colors.gray400} />
            </View>
            <View style={S.thirdField}>
              <Text style={S.label}>Baths *</Text>
              <TextInput style={S.input} value={baths} onChangeText={setBaths} keyboardType="numeric" placeholder="1" placeholderTextColor={Colors.gray400} />
            </View>
          </View>
        </View>

        {/* ── Pricing ────────────────────────────────── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Pricing</Text>

          <View style={S.row}>
            <View style={S.halfField}>
              <Text style={S.label}>Base Price (৳) *</Text>
              <TextInput style={S.input} value={basePriceTk} onChangeText={setBasePriceTk} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.gray400} />
            </View>
            <View style={S.halfField}>
              <Text style={S.label}>Commission (৳)</Text>
              <TextInput style={S.input} value={commissionTk} onChangeText={setCommissionTk} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.gray400} />
            </View>
          </View>

          <View style={S.totalPriceRow}>
            <Text style={S.totalPriceLabel}>Total Price:</Text>
            <Text style={S.totalPriceValue}>৳{totalPrice.toLocaleString()}</Text>
          </View>

          <View style={S.switchRow}>
            <View style={S.switchTextWrap}>
              <Icon name="flash-outline" size={18} color={instantBooking ? Colors.success : Colors.gray400} />
              <Text style={S.switchLabel}>Enable Instant Booking</Text>
            </View>
            <Switch
              value={instantBooking}
              onValueChange={setInstantBooking}
              trackColor={{ false: Colors.gray200, true: Colors.success + '60' }}
              thumbColor={instantBooking ? Colors.success : Colors.gray400}
            />
          </View>
        </View>

        {/* ── Images ─────────────────────────────────── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Images</Text>
          <Text style={S.sectionSub}>Upload up to 15 images. {images.length}/15 uploaded.</Text>

          {/* Image grid */}
          {images.length > 0 && (
            <View style={S.imageGrid}>
              {images.map((img, i) => (
                <View key={i} style={S.imageThumbWrap}>
                  <Image source={{ uri: getImageUrl(img.url) }} style={S.imageThumb} resizeMode="cover" />
                  <TouchableOpacity style={S.imageRemoveBtn} onPress={() => removeImage(i)}>
                    <Icon name="close" size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {images.length < MAX_ROOM_IMAGES && (
            <TouchableOpacity style={S.uploadBtn} onPress={pickImages} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color={Colors.brand} />
              ) : (
                <>
                  <Icon name="cloud-upload-outline" size={24} color={Colors.brand} />
                  <Text style={S.uploadBtnText}>Add Images</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Save Bar */}
      <View style={S.bottomBar}>
        <TouchableOpacity style={S.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={S.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.saveBtn, (saving || uploading) && S.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving || uploading}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={S.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: STATUS_H + 8, paddingBottom: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },

  // Section
  section: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 16,
  },
  sectionSub: { fontSize: 13, color: Colors.textSecondary, marginTop: -8, marginBottom: 14 },

  // Form fields
  label: {
    fontSize: 14, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary,
    marginBottom: 6, marginTop: 12,
  },
  input: {
    borderWidth: 1, borderColor: Colors.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.textPrimary, backgroundColor: Colors.gray50,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  // Layout helpers
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  threeCol: { flexDirection: 'row', gap: 10 },
  thirdField: { flex: 1 },

  // Picker
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: Colors.gray50,
  },
  pickerBtnText: { fontSize: 15, color: Colors.textPrimary },
  pickerOptions: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray200,
    borderRadius: 12, marginTop: 4, overflow: 'hidden',
  },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 12 },
  pickerOptionActive: { backgroundColor: Colors.brand + '12' },
  pickerOptionText: { fontSize: 14, color: Colors.textPrimary },
  pickerOptionTextActive: { color: Colors.brand, fontWeight: Theme.fontWeight.semibold },

  // Pricing
  totalPriceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.gray50, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    marginTop: 12, borderWidth: 1, borderColor: Colors.gray100,
  },
  totalPriceLabel: { fontSize: 14, color: Colors.textSecondary },
  totalPriceValue: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.brand },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16,
  },
  switchTextWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 15, color: Colors.textPrimary },

  // Images
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  imageThumbWrap: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden' },
  imageThumb: { width: '100%', height: '100%', backgroundColor: Colors.gray100 },
  imageRemoveBtn: {
    position: 'absolute', top: 4, right: 4, width: 24, height: 24,
    borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.gray300, borderRadius: 14, backgroundColor: Colors.gray50,
  },
  uploadBtnText: { fontSize: 15, fontWeight: Theme.fontWeight.medium, color: Colors.brand },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray100,
    ...Theme.shadows.md,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.gray200,
  },
  cancelBtnText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.info,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
});
