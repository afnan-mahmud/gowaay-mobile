/**
 * Add/Edit Room Screen - Create or update property listings
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
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { api } from '../../api/client';
import CachedImage from '../../components/CachedImage';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { IMG_BASE_URL } from '../../constants/config';

const MAX_ROOM_IMAGES = 15;

interface RoomImage {
  url: string;
  w: number;
  h: number;
}

export default function AddEditRoomScreen({ route, navigation }: any) {
  const { roomId } = route.params || {};
  const isEditing = !!roomId;

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationLatitude, setLocationLatitude] = useState('');
  const [locationLongitude, setLocationLongitude] = useState('');
  const [locationMapUrl, setLocationMapUrl] = useState('');
  const [maxGuests, setMaxGuests] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [basePriceTk, setBasePriceTk] = useState('');
  const [images, setImages] = useState<RoomImage[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [houseRules, setHouseRules] = useState('');
  const [instantBooking, setInstantBooking] = useState(false);
  const [placeType, setPlaceType] = useState('entire_place');
  const [propertyType, setPropertyType] = useState('apartment');
  const [uploading, setUploading] = useState(false);

  // Track unsaved changes for back-navigation protection
  const hasUnsavedChangesRef = useRef(false);
  const initialLoadDoneRef = useRef(!isEditing); // New rooms are immediately "loaded"
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
    if (isEditing) {
      loadRoomData();
    }
  }, []);

  const loadRoomData = async () => {
    try {
      const response = await api.hosts.roomDetail(roomId);
      if (response.success && response.data) {
        const room = response.data;
        setTitle(room.title || '');
        setDescription(room.description || '');
        setAddress(room.address || '');
        setLocationName(room.locationName || '');
        setLocationLatitude(room.locationLatitude?.toString() || room.geo?.lat?.toString() || '');
        setLocationLongitude(room.locationLongitude?.toString() || room.geo?.lng?.toString() || '');
        setLocationMapUrl(room.locationMapUrl || room.googleMapsUrl || '');
        setMaxGuests(room.maxGuests?.toString() || '');
        setBeds(room.beds?.toString() || '');
        setBaths(room.baths?.toString() || '');
        setBasePriceTk(room.basePriceTk?.toString() || '');
        setImages(room.images || []);
        setAmenities(room.amenities || []);
        setHouseRules(Array.isArray(room.houseRules) ? room.houseRules.join('\n') : (room.houseRules || ''));
        setInstantBooking(room.instantBooking || false);
        setPlaceType(room.placeType || 'entire_place');
        setPropertyType(room.propertyType || 'apartment');
      }
    } catch (error) {
      console.error('Failed to load room:', error);
      Alert.alert('Error', 'Failed to load room data');
    } finally {
      setLoading(false);
      // Mark initial load as done so future changes are tracked as "dirty"
      initialLoadDoneRef.current = true;
    }
  };

  // Track form field changes to detect unsaved edits
  useEffect(() => { markDirty(); }, [title, description, address, locationName, basePriceTk, maxGuests, beds, baths, images.length, amenities.length, houseRules, instantBooking, placeType, propertyType]);

  const pickImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: MAX_ROOM_IMAGES - images.length,
        quality: 0.8,
      });

      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setUploading(true);
        
        // Upload each image to server
        const uploadedImages: RoomImage[] = [];
        
        for (const asset of result.assets) {
          if (asset.uri) {
            try {
              console.log('📤 Uploading image:', {
                uri: asset.uri.substring(0, 50) + '...',
                width: asset.width,
                height: asset.height,
                type: asset.type,
              });
              
              const response = await api.uploads.image(asset.uri);
              
              console.log('📦 Upload response:', {
                success: response.success,
                hasData: !!response.data,
                message: response.message,
              });
              
              if (response.success && response.data) {
                const imageUrl = (response.data as any).url || (response.data as any).imageUrl || asset.uri;
                uploadedImages.push({
                  url: imageUrl,
                  w: asset.width || 800,
                  h: asset.height || 600,
                });
                console.log('✅ Image uploaded successfully:', imageUrl);
              } else {
                const errorMsg = response.message || response.error || 'Network error';
                console.error('❌ Upload failed:', errorMsg);
                Alert.alert('Upload Failed', `Failed to upload image: ${errorMsg}\n\nPlease check your internet connection and try again.`);
              }
            } catch (uploadError: any) {
              console.error('❌ Error uploading image (catch):', {
                message: uploadError.message,
                error: uploadError,
              });
              Alert.alert(
                'Upload Error', 
                `Network error: ${uploadError.message || 'Failed to upload image'}\n\nPlease check your internet connection and try again.`
              );
            }
          }
        }
        
        if (uploadedImages.length > 0) {
          setImages([...images, ...uploadedImages]);
        }
        
        setUploading(false);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Client-side validation (basic checks, detailed validation from backend)
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (title.trim().length < 5) {
      Alert.alert('Error', 'Title must be at least 5 characters');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (description.trim().length < 20) {
      Alert.alert('Error', 'Description must be at least 20 characters');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }
    if (address.trim().length < 5) {
      Alert.alert('Error', 'Address must be at least 5 characters');
      return;
    }
    if (!locationName.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }
    if (locationName.trim().length < 2) {
      Alert.alert('Error', 'Location name must be at least 2 characters');
      return;
    }
    if (!maxGuests || isNaN(parseInt(maxGuests)) || parseInt(maxGuests) < 1) {
      Alert.alert('Error', 'Please enter a valid number of guests (minimum 1)');
      return;
    }
    if (!beds || isNaN(parseInt(beds)) || parseInt(beds) < 1) {
      Alert.alert('Error', 'Please enter a valid number of beds (minimum 1)');
      return;
    }
    if (!baths || isNaN(parseInt(baths)) || parseInt(baths) < 1) {
      Alert.alert('Error', 'Please enter a valid number of baths (minimum 1)');
      return;
    }
    if (!basePriceTk || isNaN(parseFloat(basePriceTk)) || parseFloat(basePriceTk) <= 0) {
      Alert.alert('Error', 'Please enter a valid price (must be greater than 0)');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setSubmitting(true);

    try {
      // Convert house rules string to array
      const houseRulesArray = houseRules
        .split('\n')
        .map(rule => rule.trim())
        .filter(rule => rule.length > 0);

      // Build geo object if coordinates are provided
      const geo = (locationLatitude && locationLongitude) ? {
        lat: parseFloat(locationLatitude),
        lng: parseFloat(locationLongitude),
      } : undefined;

      const roomData = {
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        locationName: locationName.trim(),
        locationMapUrl: locationMapUrl.trim() || undefined,
        geo: geo,
        placeType: placeType,
        propertyType: propertyType,
        maxGuests: parseInt(maxGuests),
        beds: parseInt(beds),
        baths: parseInt(baths),
        basePriceTk: parseFloat(basePriceTk),
        images,
        amenities,
        houseRules: houseRulesArray,
        instantBooking,
      };

      console.log('📤 Submitting room data:', {
        isEditing,
        roomData: {
          ...roomData,
          images: roomData.images.length + ' images',
        },
      });

      const response = isEditing
        ? await api.hosts.updateRoom(roomId, roomData)
        : await api.hosts.createRoom(roomData);

      console.log('📦 Room submission response:', {
        success: response.success,
        message: response.message,
        error: response.error,
        data: response.data,
      });

      if (response.success) {
        // Allow back navigation without warning after successful save
        hasUnsavedChangesRef.current = false;
        Alert.alert(
          'Success',
          isEditing ? 'Room updated successfully' : 'Room created successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Parse validation errors from backend
        let errorMessage = response.message || 'Failed to save room';
        
        // Check if response has validation errors array
        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          // Backend validation errors format: [{ field: 'title', message: 'Title must be at least 5 characters' }]
          const errorMessages = response.errors.map((err: any) => {
            const field = err.field || 'field';
            const message = err.message || 'Invalid value';
            // Capitalize first letter and format field name
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
            return `• ${fieldName}: ${message}`;
          });
          errorMessage = 'Please fix the following errors:\n\n' + errorMessages.join('\n');
        } 
        // Check if response.error is a Zod error object
        else if (response.error && typeof response.error === 'object') {
          const validationErrors = response.error as any;
          if (validationErrors.issues && Array.isArray(validationErrors.issues)) {
            // Zod validation errors
            const errorMessages = validationErrors.issues.map((issue: any) => {
              const field = issue.path?.join('.') || 'field';
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
              return `• ${fieldName}: ${issue.message}`;
            });
            errorMessage = 'Please fix the following errors:\n\n' + errorMessages.join('\n');
          } else if (validationErrors.errors) {
            // Mongoose validation errors
            const errorMessages = Object.keys(validationErrors.errors).map((field) => {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
              return `• ${fieldName}: ${validationErrors.errors[field].message}`;
            });
            errorMessage = 'Please fix the following errors:\n\n' + errorMessages.join('\n');
          } else if (typeof validationErrors === 'string') {
            errorMessage = validationErrors;
          }
        } else if (response.error && typeof response.error === 'string') {
          errorMessage = response.error;
        }
        
        console.error('❌ Room submission failed:', {
          message: errorMessage,
          response: response,
        });
        Alert.alert('Validation Error', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Failed to save room (catch):', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Parse error response
      let errorMessage = error.message || 'Failed to save room';
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for validation errors array
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const errorMessages = errorData.errors.map((err: any) => {
            const field = err.field || 'field';
            const message = err.message || 'Invalid value';
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
            return `• ${fieldName}: ${message}`;
          });
          errorMessage = 'Please fix the following errors:\n\n' + errorMessages.join('\n');
        }
        // Check for Zod error object
        else if (errorData.error) {
          if (typeof errorData.error === 'object' && errorData.error.issues) {
            // Zod validation errors
            const errorMessages = errorData.error.issues.map((issue: any) => {
              const field = issue.path?.join('.') || 'field';
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
              return `• ${fieldName}: ${issue.message}`;
            });
            errorMessage = 'Please fix the following errors:\n\n' + errorMessages.join('\n');
          } else if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      console.error('❌ Room submission error (catch):', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading room data..." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Images Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>Add up to {MAX_ROOM_IMAGES} high-quality photos</Text>

          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <CachedImage
                    source={{ uri: image.url.startsWith('http') ? image.url : `${IMG_BASE_URL}${image.url}` }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="close" size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <Button
            title={uploading ? 'Uploading...' : 'Add Photos'}
            variant="outline"
            onPress={pickImages}
            loading={uploading}
            disabled={uploading || images.length >= MAX_ROOM_IMAGES}
            style={styles.addPhotoButton}
          />
          {images.length >= MAX_ROOM_IMAGES && (
            <Text style={styles.maxImagesNote}>Maximum {MAX_ROOM_IMAGES} images allowed</Text>
          )}
        </Card>

        {/* Basic Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Input
            label="Title*"
            placeholder="Cozy apartment in Gulshan"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Description*"
            placeholder="Describe your property... (minimum 20 characters)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Location */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Input
            label="Address*"
            placeholder="Full street address (minimum 5 characters)"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />

          <Input
            label="Location Name*"
            placeholder="Gulshan, Dhaka (minimum 2 characters)"
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

        {/* Property Details */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>

          <View style={styles.propertyDetailsRow}>
            <Input
              label="Max Guests*"
              placeholder="4"
              value={maxGuests}
              onChangeText={setMaxGuests}
              keyboardType="number-pad"
              style={styles.guestsInput}
            />
            <Input
              label="Beds*"
              placeholder="2"
              value={beds}
              onChangeText={setBeds}
              keyboardType="number-pad"
              style={styles.bedsInput}
            />
            <Input
              label="Baths*"
              placeholder="1"
              value={baths}
              onChangeText={setBaths}
              keyboardType="number-pad"
              style={styles.bathsInput}
            />
          </View>
        </Card>

        {/* Pricing */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <Input
            label="Base Price (৳) per night*"
            placeholder="2000"
            value={basePriceTk}
            onChangeText={setBasePriceTk}
            keyboardType="decimal-pad"
          />

          <Text style={styles.priceNote}>
            Note: Admin commission will be added to the total price
          </Text>
        </Card>

        {/* Place Type */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Place Type*</Text>
          <Text style={styles.sectionSubtitle}>What type of space are you offering?</Text>
          <View style={styles.roomTypeContainer}>
            {[
              { value: 'entire_place', label: 'Entire Place' },
              { value: 'private_room', label: 'Private Room' },
              { value: 'shared_room', label: 'Shared Room' },
              { value: 'studio_apartment', label: 'Studio Apartment' },
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.roomTypeButton,
                  placeType === type.value && styles.roomTypeButtonActive,
                ]}
                onPress={() => setPlaceType(type.value)}
              >
                <Text
                  style={[
                    styles.roomTypeText,
                    placeType === type.value && styles.roomTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Property Type */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type*</Text>
          <Text style={styles.sectionSubtitle}>What kind of property is this?</Text>
          <View style={styles.roomTypeContainer}>
            {[
              { value: 'apartment', label: 'Apartment' },
              { value: 'hotel', label: 'Hotel' },
              { value: 'resort', label: 'Resort' },
              { value: 'guest_house', label: 'Guest House' },
              { value: 'villa', label: 'Villa' },
              { value: 'hostel_beds', label: 'Hostel' },
              { value: 'farm_house', label: 'Farm House' },
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.roomTypeButton,
                  propertyType === type.value && styles.roomTypeButtonActive,
                ]}
                onPress={() => setPropertyType(type.value)}
              >
                <Text
                  style={[
                    styles.roomTypeText,
                    propertyType === type.value && styles.roomTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Amenities */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          <View style={styles.amenitiesGrid}>
            {([
              { key: 'wifi', label: 'WiFi', iconName: 'wifi-outline', family: 'Ionicons' },
              { key: 'ac', label: 'AC', iconName: 'snow-outline', family: 'Ionicons' },
              { key: 'kitchen', label: 'Kitchen', iconName: 'restaurant-outline', family: 'Ionicons' },
              { key: 'parking', label: 'Parking', iconName: 'car-outline', family: 'Ionicons' },
              { key: 'tv', label: 'TV', iconName: 'tv-outline', family: 'Ionicons' },
              { key: 'washer', label: 'Washer', iconName: 'washing-machine', family: 'MaterialCommunityIcons' },
              { key: 'pool', label: 'Pool', iconName: 'pool', family: 'MaterialCommunityIcons' },
              { key: 'gym', label: 'Gym', iconName: 'dumbbell', family: 'MaterialCommunityIcons' },
              { key: 'balcony', label: 'Balcony', iconName: 'image-outline', family: 'Ionicons' },
              { key: 'elevator', label: 'Elevator', iconName: 'swap-vertical-outline', family: 'Ionicons' },
              { key: 'security', label: 'Security', iconName: 'shield-checkmark-outline', family: 'Ionicons' },
              { key: 'generator', label: 'Generator', iconName: 'flash-outline', family: 'Ionicons' },
            ] as const).map((amenity) => (
              <TouchableOpacity
                key={amenity.key}
                style={[
                  styles.amenityButton,
                  amenities.includes(amenity.key) && styles.amenityButtonActive,
                ]}
                onPress={() => {
                  if (amenities.includes(amenity.key)) {
                    setAmenities(amenities.filter((a) => a !== amenity.key));
                  } else {
                    setAmenities([...amenities, amenity.key]);
                  }
                }}
              >
                <Icon
                  family={amenity.family as any}
                  name={amenity.iconName}
                  size={22}
                  color={amenities.includes(amenity.key) ? Colors.white : Colors.brand}
                  style={styles.amenityIcon}
                />
                <Text
                  style={[
                    styles.amenityText,
                    amenities.includes(amenity.key) && styles.amenityTextActive,
                  ]}
                >
                  {amenity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* House Rules */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>House Rules</Text>
          <Text style={styles.sectionSubtitle}>
            Enter each rule on a new line
          </Text>
          <TextInput
            style={styles.houseRulesInput}
            value={houseRules}
            onChangeText={setHouseRules}
            placeholder="e.g.&#10;No smoking&#10;No pets&#10;Quiet hours: 10 PM - 7 AM"
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </Card>

        {/* Instant Booking */}
        <Card style={styles.section}>
          <View style={styles.instantBookingRow}>
            <View style={styles.instantBookingLeft}>
              <Text style={styles.sectionTitle}>Instant Booking</Text>
              <Text style={styles.instantBookingSubtitle}>
                Allow guests to book without approval
              </Text>
            </View>
            <Switch
              value={instantBooking}
              onValueChange={setInstantBooking}
              trackColor={{ false: Colors.gray300, true: Colors.brand }}
              thumbColor={Colors.white}
            />
          </View>
        </Card>

        {/* Submit Button */}
        <Button
          title={isEditing ? 'Update Room' : 'Create Room'}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitButton}
        />

        <Text style={styles.disclaimer}>
          * Required fields. Your listing will be reviewed by admin before going live.
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
    marginBottom: Theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  imagesContainer: {
    marginBottom: Theme.spacing.md,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: Theme.spacing.sm,
  },
  image: {
    width: 150,
    height: 100,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    marginTop: Theme.spacing.sm,
  },
  maxImagesNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  propertyDetailsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    alignItems: 'flex-start',
  },
  guestsInput: {
    flex: 1,
  },
  bedsInput: {
    flex: 1.5, // Make beds input bigger for better visibility
  },
  bathsInput: {
    flex: 1,
  },
  priceNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Theme.spacing.sm,
  },
  submitButton: {
    marginTop: Theme.spacing.md,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  roomTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  roomTypeButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  roomTypeButtonActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  roomTypeText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
  },
  roomTypeTextActive: {
    color: Colors.white,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  amenityButton: {
    width: '30%',
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  amenityButtonActive: {
    backgroundColor: Colors.brand + '15',
    borderColor: Colors.brand,
  },
  amenityIcon: {
    marginBottom: Theme.spacing.xs,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  amenityTextActive: {
    color: Colors.brand,
  },
  houseRulesInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 120,
  },
  instantBookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instantBookingLeft: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  instantBookingSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
});
