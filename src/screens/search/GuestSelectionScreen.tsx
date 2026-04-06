/**
 * Guest Selection Screen - Step 3: Select number of guests
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';

export default function GuestSelectionScreen({ navigation, route }: any) {
  const { location, checkIn, checkOut, returnToBooking, initialGuests, maxGuests, roomId } = route.params || {};
  const [guests, setGuests] = useState(initialGuests || 2);

  const maxAllowedGuests = maxGuests || 20;

  const handleIncrement = () => {
    if (guests < maxAllowedGuests) {
      setGuests(guests + 1);
    }
  };

  const handleDecrement = () => {
    if (guests > 1) {
      setGuests(guests - 1);
    }
  };

  const handleSearch = () => {
    if (returnToBooking) {
      // Return to BookingFlowScreen with updated guests and preserve room object
      const { room } = route.params || {};
      navigation.navigate('BookingFlow', {
        room: room, // Preserve room object
        updatedGuests: guests,
      });
    } else {
      // Normal flow - navigate to search results
      navigation.navigate('SearchScreen', {
        location,
        checkIn,
        checkOut,
        guests,
        isSearching: true,
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.subtitle}>
            {returnToBooking ? 'Edit guests' : 'Almost there!'}
          </Text>
          <Text style={styles.title}>Number of guests</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Search</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Icon name="location-outline" size={14} color={Colors.textSecondary} style={styles.summaryLabelIcon} />
              <Text style={styles.summaryLabel}>Location</Text>
            </View>
            <Text style={styles.summaryValue}>{location}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Icon name="calendar-outline" size={14} color={Colors.textSecondary} style={styles.summaryLabelIcon} />
              <Text style={styles.summaryLabel}>Dates</Text>
            </View>
            <Text style={styles.summaryValue}>
              {formatDate(checkIn)} - {formatDate(checkOut)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Icon name="moon-outline" size={14} color={Colors.textSecondary} style={styles.summaryLabelIcon} />
              <Text style={styles.summaryLabel}>Nights</Text>
            </View>
            <Text style={styles.summaryValue}>{nights}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>How many guests?</Text>

        <View style={styles.guestSelector}>
          <View style={styles.guestInfo}>
            <Text style={styles.guestLabel}>Guests</Text>
            <Text style={styles.guestSubtext}>Ages 13 or above</Text>
          </View>

          <View style={styles.counter}>
            <TouchableOpacity
              style={[styles.counterButton, guests === 1 && styles.counterButtonDisabled]}
              onPress={handleDecrement}
              disabled={guests === 1}
            >
              <Text style={[styles.counterButtonText, guests === 1 && styles.counterButtonTextDisabled]}>
                −
              </Text>
            </TouchableOpacity>

            <Text style={styles.counterValue}>{guests}</Text>

            <TouchableOpacity
              style={[styles.counterButton, guests >= maxAllowedGuests && styles.counterButtonDisabled]}
              onPress={handleIncrement}
              disabled={guests >= maxAllowedGuests}
            >
              <Text style={[styles.counterButtonText, guests >= maxAllowedGuests && styles.counterButtonTextDisabled]}>
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Icon name="information-circle-outline" size={20} color={Colors.info} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            {returnToBooking 
              ? `This property can accommodate up to ${maxAllowedGuests} guests.`
              : `This property can accommodate up to ${maxAllowedGuests} guests. We'll show you places that fit your party size.`}
          </Text>
        </View>

        {/* Quick selection buttons */}
        <View style={styles.quickSelect}>
          <Text style={styles.quickSelectTitle}>Quick Select</Text>
          <View style={styles.quickSelectButtons}>
            {[1, 2, 4, 6].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.quickSelectButton,
                  guests === count && styles.quickSelectButtonActive,
                ]}
                onPress={() => setGuests(count)}
              >
                <Text
                  style={[
                    styles.quickSelectButtonText,
                    guests === count && styles.quickSelectButtonTextActive,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={returnToBooking 
            ? `Save - ${guests} ${guests === 1 ? 'guest' : 'guests'}` 
            : `Search ${guests} ${guests === 1 ? 'guest' : 'guests'}`}
          onPress={handleSearch}
          style={styles.searchButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  backButtonText: { fontSize: 22, color: Colors.textPrimary },
  headerContent: { flex: 1 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  title: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.2 },
  content: { flex: 1, padding: 16 },
  summaryCard: {
    padding: 16, backgroundColor: Colors.gray50, borderRadius: 16,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.gray200,
  },
  summaryTitle: {
    fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.textTertiary,
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center' },
  summaryLabelIcon: { marginRight: 4 },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  sectionTitle: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 16, letterSpacing: -0.3 },
  guestSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.brand, marginBottom: 16,
  },
  guestInfo: { flex: 1 },
  guestLabel: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 3 },
  guestSubtext: { fontSize: 12, color: Colors.textSecondary },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterButton: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: Colors.textPrimary, alignItems: 'center', justifyContent: 'center',
  },
  counterButtonDisabled: { backgroundColor: Colors.gray200 },
  counterButtonText: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  counterButtonTextDisabled: { color: Colors.gray400 },
  counterValue: { fontSize: 28, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, minWidth: 44, textAlign: 'center' },
  infoBox: {
    flexDirection: 'row', padding: 14, backgroundColor: '#EFF6FF',
    borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: '#BFDBFE', gap: 10,
  },
  infoIcon: {},
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19 },
  quickSelect: { marginBottom: 20 },
  quickSelectTitle: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.textTertiary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickSelectButtons: { flexDirection: 'row', gap: 10 },
  quickSelectButton: {
    flex: 1, paddingVertical: 14, backgroundColor: Colors.gray50,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200,
  },
  quickSelectButtonActive: { backgroundColor: '#FFF1F2', borderColor: Colors.brand },
  quickSelectButtonText: { fontSize: 17, fontWeight: Theme.fontWeight.semibold, color: Colors.textSecondary },
  quickSelectButtonTextActive: { color: Colors.brand },
  footer: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: Colors.gray100, backgroundColor: Colors.white,
  },
  searchButton: { paddingVertical: 12 },
});
