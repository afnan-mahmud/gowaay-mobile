/**
 * Booking Flow Screen - Date selection, guests, and payment
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';

export default function BookingFlowScreen({ route, navigation }: any) {
  const { room: initialRoom, checkIn: initialCheckIn, checkOut: initialCheckOut, guests: initialGuests } = route.params || {};
  
  // Store room in state to persist across navigation
  const [room] = useState(initialRoom);
  
  // Initialize dates from route params if available
  const [checkIn, setCheckIn] = useState<Date | null>(
    initialCheckIn ? new Date(initialCheckIn) : null
  );
  const [checkOut, setCheckOut] = useState<Date | null>(
    initialCheckOut ? new Date(initialCheckOut) : null
  );
  const [guests, setGuests] = useState(initialGuests || 1);
  const [loading, setLoading] = useState(false);
  const [messageToHost, setMessageToHost] = useState('');

  // Validate room exists
  if (!room) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Room information not available</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    );
  }

  // Listen for updates from date/guest selection screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we're returning from date/guest selection with updated values
      const params = route.params || {};
      if (params.updatedCheckIn) {
        setCheckIn(new Date(params.updatedCheckIn));
        // Clear the param to avoid re-applying
        navigation.setParams({ updatedCheckIn: undefined });
      }
      if (params.updatedCheckOut) {
        setCheckOut(new Date(params.updatedCheckOut));
        // Clear the param to avoid re-applying
        navigation.setParams({ updatedCheckOut: undefined });
      }
      if (params.updatedGuests !== undefined && params.updatedGuests !== null) {
        setGuests(params.updatedGuests);
        // Clear the param to avoid re-applying
        navigation.setParams({ updatedGuests: undefined });
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return nights * room.totalPriceTk;
  };

  const handleCreateBooking = async () => {
    if (!checkIn || !checkOut) {
      Alert.alert('Error', 'Please select check-in and check-out dates');
      return;
    }

    if (guests < 1 || guests > room.maxGuests) {
      Alert.alert('Error', `Guests must be between 1 and ${room.maxGuests}`);
      return;
    }

    setLoading(true);
    
    try {
      // Format dates as YYYY-MM-DD for backend
      const formatDateForAPI = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const bookingData: any = {
        roomId: room._id,
        checkIn: formatDateForAPI(checkIn),
        checkOut: formatDateForAPI(checkOut),
        guests,
        mode: room.instantBooking ? 'instant' : 'request',
      };

      // Include optional message to host (request mode only)
      if (!room.instantBooking && messageToHost.trim()) {
        bookingData.messageToHost = messageToHost.trim();
      }

      console.log('📅 Creating booking with data:', bookingData);

      const response = await api.bookings.create(bookingData);
      
      console.log('📦 Booking API response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const bookingId = (response.data as any)._id || (response.data as any).id || (response.data as any).bookingId;
        const threadId = (response.data as any).threadId;
        
        console.log('✅ Booking created successfully, ID:', bookingId);
        
        // Check booking mode
        if (room.instantBooking) {
          // Instant booking - navigate to payment
        navigation.navigate('Payment', {
          bookingId,
          amount: calculateTotal(),
        });
      } else {
          // Request mode - navigate to chat with host
          navigation.navigate('Chat', {
            roomId: room._id,
            roomTitle: room.title,
            hostId: room.hostId._id,
            hostName: room.hostId.displayName,
            bookingId: bookingId,
            threadId: threadId,
          });
        }
      } else {
        const errorMessage = response.message || response.error || 'Failed to create booking';
        console.error('❌ Booking creation failed:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Booking creation error (catch):', error);
      Alert.alert('Error', error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const incrementGuests = () => {
    if (guests < room.maxGuests) {
      setGuests(guests + 1);
    }
  };

  const decrementGuests = () => {
    if (guests > 1) {
      setGuests(guests - 1);
    }
  };

  // Navigate to date selection screen
  const selectDates = () => {
    navigation.navigate('DateSelection', {
      location: room.locationName,
      returnToBooking: true,
      initialCheckIn: checkIn ? checkIn.toISOString().split('T')[0] : '',
      initialCheckOut: checkOut ? checkOut.toISOString().split('T')[0] : '',
      room: room, // Pass room object to preserve it
    });
  };

  // Navigate to guest selection screen
  const selectGuests = () => {
    navigation.navigate('GuestSelection', {
      location: room.locationName,
      checkIn: checkIn ? checkIn.toISOString().split('T')[0] : '',
      checkOut: checkOut ? checkOut.toISOString().split('T')[0] : '',
      returnToBooking: true,
      initialGuests: guests,
      maxGuests: room.maxGuests,
      room: room, // Pass room object to preserve it
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Room Summary */}
          <Card style={styles.summaryCard}>
            <Text style={styles.roomTitle}>{room.title}</Text>
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.roomLocation}>{room.locationName}</Text>
            </View>
            <Text style={styles.roomPrice}>
              ৳{room.totalPriceTk.toLocaleString()} / night
            </Text>
          </Card>

          {/* Dates Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Dates</Text>
            
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={selectDates}
            >
              <View style={styles.dateLabelContainer}>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>{formatDate(checkIn)}</Text>
              </View>
              <Icon name="calendar-outline" size={20} color={Colors.brand} style={styles.dateIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateSelector}
              onPress={selectDates}
            >
              <View style={styles.dateLabelContainer}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>{formatDate(checkOut)}</Text>
              </View>
              <Icon name="calendar-outline" size={20} color={Colors.brand} style={styles.dateIcon} />
            </TouchableOpacity>
            
            <Text style={styles.editHint}>Tap to edit dates</Text>

            {checkIn && checkOut && (
              <Card style={styles.nightsCard}>
                <Text style={styles.nightsText}>
                  {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}
                </Text>
              </Card>
            )}
          </View>

          {/* Guests Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guests</Text>
            <TouchableOpacity onPress={selectGuests}>
              <Card style={styles.guestSelector}>
                <View>
                  <Text style={styles.guestLabel}>Number of Guests</Text>
                  <Text style={styles.guestSubtext}>
                    Max: {room.maxGuests} guests
                  </Text>
                </View>
                <View style={styles.guestControls}>
                  <TouchableOpacity
                    style={[
                      styles.guestButton,
                      guests <= 1 && styles.guestButtonDisabled,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      decrementGuests();
                    }}
                    disabled={guests <= 1}
                  >
                    <Text style={styles.guestButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.guestCount}>{guests}</Text>
                  <TouchableOpacity
                    style={[
                      styles.guestButton,
                      guests >= room.maxGuests && styles.guestButtonDisabled,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      incrementGuests();
                    }}
                    disabled={guests >= room.maxGuests}
                  >
                    <Text style={styles.guestButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
            <Text style={styles.editHint}>Tap to edit guests</Text>
          </View>

          {/* Price Breakdown */}
          {checkIn && checkOut && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Details</Text>
              <Card style={styles.priceCard}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    ৳{room.totalPriceTk.toLocaleString()} × {calculateNights()} nights
                  </Text>
                  <Text style={styles.priceValue}>
                    ৳{(room.totalPriceTk * calculateNights()).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>Total</Text>
                  <Text style={styles.priceTotalValue}>
                    ৳{calculateTotal().toLocaleString()}
                  </Text>
                </View>
              </Card>
            </View>
          )}

          {/* Message to Host (request mode only) */}
          {!room.instantBooking && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Message to Host</Text>
              <Text style={styles.messageHint}>
                Introduce yourself and let the host know why you're visiting (optional)
              </Text>
              <Card style={styles.messageCard}>
                <TextInput
                  style={styles.messageInput}
                  value={messageToHost}
                  onChangeText={setMessageToHost}
                  placeholder="Hi! I'm planning a trip and would love to stay at your place..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{messageToHost.length}/500</Text>
              </Card>
              <Text style={styles.messageEncouragement}>
                A personal message helps hosts feel confident about their guests
              </Text>
            </View>
          )}

          {/* Booking Info */}
          <Card style={styles.infoCard}>
            <Icon name="information-circle-outline" size={20} color={Colors.info} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {room.instantBooking
                ? 'You will be charged after confirming the booking.'
                : 'Your booking request will be sent to the host for approval. You will only be charged if the host accepts.'}
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <Button
          title={
            room.instantBooking
              ? `Confirm & Pay - ৳${calculateTotal().toLocaleString()}`
              : 'Request to Book'
          }
          onPress={handleCreateBooking}
          loading={loading}
          disabled={!checkIn || !checkOut}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  content: { padding: 16 },
  summaryCard: { marginBottom: 16 },
  roomTitle: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 4, letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  roomLocation: { fontSize: 13, color: Colors.textSecondary },
  roomPrice: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.brand },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.2 },
  dateSelector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    marginBottom: 8, borderWidth: 1.5, borderColor: Colors.gray200,
  },
  dateLabelContainer: { flex: 1 },
  dateLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 15, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  dateIcon: {},
  editHint: { fontSize: 11, color: Colors.textTertiary, marginTop: 4, textAlign: 'center' },
  nightsCard: { backgroundColor: '#FFF1F2', borderColor: Colors.brand, marginTop: 8 },
  nightsText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.brand, textAlign: 'center' },
  guestSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guestLabel: { fontSize: 15, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary, marginBottom: 3 },
  guestSubtext: { fontSize: 12, color: Colors.textSecondary },
  guestControls: { flexDirection: 'row', alignItems: 'center' },
  guestButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.textPrimary, alignItems: 'center', justifyContent: 'center' },
  guestButtonDisabled: { backgroundColor: Colors.gray200 },
  guestButtonText: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  guestCount: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginHorizontal: 20, minWidth: 32, textAlign: 'center' },
  priceCard: {},
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  priceValue: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  priceDivider: { height: 1, backgroundColor: Colors.gray100, marginVertical: 12 },
  priceTotalLabel: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  priceTotalValue: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.brand },
  messageCard: { padding: 0, borderRadius: 16 },
  messageInput: { fontSize: 14, color: Colors.textPrimary, minHeight: 100, padding: 14, lineHeight: 20 },
  messageHint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, lineHeight: 18 },
  charCount: { fontSize: 11, color: Colors.textTertiary, textAlign: 'right', paddingRight: 14, paddingBottom: 10 },
  messageEncouragement: { fontSize: 11, color: Colors.textTertiary, marginTop: 4 },
  infoCard: { flexDirection: 'row', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  infoIcon: {},
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19 },
  footer: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.gray100, backgroundColor: Colors.white },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center', marginTop: 24 },
});
