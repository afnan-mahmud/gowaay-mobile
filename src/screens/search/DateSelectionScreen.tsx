/**
 * Date Selection Screen - Step 2: Select check-in and check-out dates
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import Button from '../../components/Button';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';

export default function DateSelectionScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { location, searchQuery, returnToBooking, initialCheckIn, initialCheckOut, roomId } = route.params || {};
  const [checkIn, setCheckIn] = useState(initialCheckIn || '');
  const [checkOut, setCheckOut] = useState(initialCheckOut || '');

  const handleDayPress = (day: any) => {
    if (!checkIn || (checkIn && checkOut)) {
      // First selection or reset
      setCheckIn(day.dateString);
      setCheckOut('');
    } else if (checkIn && !checkOut) {
      // Second selection
      if (day.dateString > checkIn) {
        setCheckOut(day.dateString);
      } else {
        // Selected date is before check-in, reset
        setCheckIn(day.dateString);
        setCheckOut('');
      }
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};

    if (checkIn) {
      marked[checkIn] = {
        startingDay: true,
        color: Colors.brand,
        textColor: Colors.white,
      };
    }

    if (checkOut) {
      marked[checkOut] = {
        endingDay: true,
        color: Colors.brand,
        textColor: Colors.white,
      };

      // Mark days in between
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      let current = new Date(start);
      current.setDate(current.getDate() + 1);

      while (current < end) {
        const dateString = current.toISOString().split('T')[0];
        marked[dateString] = {
          color: Colors.brandLight,
          textColor: Colors.brand,
        };
        current.setDate(current.getDate() + 1);
      }
    }

    return marked;
  };

  const handleContinue = () => {
    if (returnToBooking) {
      // Return to BookingFlowScreen with updated dates and preserve room object
      const { room } = route.params || {};
      navigation.navigate('BookingFlow', {
        room: room, // Preserve room object
        updatedCheckIn: checkIn,
        updatedCheckOut: checkOut,
      });
    } else {
      // Normal flow - navigate to GuestSelection
      navigation.navigate('GuestSelection', {
        location,
        searchQuery,
        checkIn,
        checkOut,
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 14 + insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.subtitle}>
            {returnToBooking ? 'Edit dates' : 'Searching in'}
          </Text>
          <Text style={styles.title}>{location || 'Select Dates'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>When's your trip?</Text>

        <View style={styles.dateDisplay}>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Check-in</Text>
            <Text style={[styles.dateValue, !checkIn && styles.dateValueEmpty]}>
              {checkIn ? formatDate(checkIn) : 'Add date'}
            </Text>
          </View>
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>→</Text>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Check-out</Text>
            <Text style={[styles.dateValue, !checkOut && styles.dateValueEmpty]}>
              {checkOut ? formatDate(checkOut) : 'Add date'}
            </Text>
          </View>
        </View>

        <Calendar
          onDayPress={handleDayPress}
          markingType="period"
          markedDates={getMarkedDates()}
          minDate={today}
          theme={{
            backgroundColor: Colors.white,
            calendarBackground: Colors.white,
            textSectionTitleColor: Colors.textSecondary,
            selectedDayBackgroundColor: Colors.brand,
            selectedDayTextColor: Colors.white,
            todayTextColor: Colors.brand,
            dayTextColor: Colors.textPrimary,
            textDisabledColor: Colors.textTertiary,
            monthTextColor: Colors.textPrimary,
            textMonthFontWeight: 'bold',
            textDayFontSize: 16,
            textMonthFontSize: 18,
          }}
        />

        {checkIn && checkOut && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Trip Summary</Text>
            <Text style={styles.summaryText}>
              {formatDate(checkIn)} - {formatDate(checkOut)}
            </Text>
            <Text style={styles.summaryNights}>
              {Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setCheckIn('');
            setCheckOut('');
          }}
        >
          <Text style={styles.clearButtonText}>Clear dates</Text>
        </TouchableOpacity>
        <Button
          title={returnToBooking ? "Save Dates" : "Continue"}
          onPress={handleContinue}
          disabled={!checkIn || !checkOut}
          style={styles.continueButton}
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
  sectionTitle: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 16, letterSpacing: -0.3 },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  dateBox: {
    flex: 1, padding: 14, backgroundColor: Colors.gray50,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.gray200,
  },
  dateLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 17, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  dateValueEmpty: { color: Colors.textTertiary, fontWeight: Theme.fontWeight.regular },
  dateSeparator: { alignItems: 'center', justifyContent: 'center' },
  dateSeparatorText: { fontSize: 22, color: Colors.gray400 },
  summaryCard: {
    marginTop: 20, padding: 16, backgroundColor: '#FFF1F2',
    borderRadius: 16, borderWidth: 1, borderColor: '#FECDD3',
  },
  summaryTitle: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.brand, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryText: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  summaryNights: { fontSize: 13, color: Colors.textSecondary },
  footer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: Colors.gray100, gap: 12,
    backgroundColor: Colors.white,
  },
  clearButton: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  clearButtonText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textSecondary, textDecorationLine: 'underline' },
  continueButton: { flex: 2 },
});
