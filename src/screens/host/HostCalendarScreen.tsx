/**
 * Host Calendar Screen - Manage availability and unavailable dates
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

interface Room {
  _id: string;
  title: string;
  locationName: string;
  unavailableDates: string[];
}

export default function HostCalendarScreen({ navigation }: any) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      updateMarkedDates();
    }
  }, [selectedRoom]);

  const loadRooms = async () => {
    try {
      setError(null);
      const response = await api.hosts.rooms();
      if (response.success && response.data) {
        const roomsData = response.data as Room[];
        setRooms(roomsData.filter((r: any) => r.status === 'approved'));
        if (roomsData.length > 0) {
          setSelectedRoom(roomsData[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load rooms:', err);
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Calendar', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const updateMarkedDates = () => {
    if (!selectedRoom) return;

    const marked: any = {};

    // Mark unavailable dates
    selectedRoom.unavailableDates?.forEach((dateStr) => {
      marked[dateStr] = {
        selected: true,
        selectedColor: Colors.error,
        marked: true,
        dotColor: Colors.white,
      };
    });

    // Mark today
    const today = new Date().toISOString().split('T')[0];
    if (!marked[today]) {
      marked[today] = {
        selected: false,
        marked: true,
        dotColor: Colors.brand,
      };
    }

    setMarkedDates(marked);
  };

  const handleDayPress = (day: any) => {
    if (!selectedRoom) return;

    const dateStr = day.dateString;
    const unavailableDates = selectedRoom.unavailableDates || [];
    const isUnavailable = unavailableDates.includes(dateStr);

    if (isUnavailable) {
      // Remove from unavailable dates
      const updatedDates = unavailableDates.filter((d) => d !== dateStr);
      setSelectedRoom({ ...selectedRoom, unavailableDates: updatedDates });
    } else {
      // Add to unavailable dates
      setSelectedRoom({
        ...selectedRoom,
        unavailableDates: [...unavailableDates, dateStr],
      });
    }
  };

  const handleSave = async () => {
    if (!selectedRoom) return;

    setSaving(true);
    try {
      const response = await api.hosts.updateRoomAvailability(
        selectedRoom._id,
        selectedRoom.unavailableDates || []
      );

      if (response.success) {
        Alert.alert('Success', 'Calendar updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update calendar');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update calendar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Calendar',
      'This will clear all unavailable dates. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (selectedRoom) {
              setSelectedRoom({ ...selectedRoom, unavailableDates: [] });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading message="Loading calendar..." />;
  }

  if (error && rooms.length === 0) {
    return <ErrorState title="Failed to Load Calendar" message={error} onRetry={loadRooms} />;
  }

  if (rooms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="home-outline" size={56} color={Colors.gray400} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No Active Listings</Text>
        <Text style={styles.emptyText}>
          You need at least one approved listing to manage calendar
        </Text>
        <Button
          title="Add Listing"
          onPress={() => navigation.navigate('AddRoom')}
          style={styles.addButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Room Selector */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Select Property</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {rooms.map((room) => (
              <TouchableOpacity
                key={room._id}
                style={[
                  styles.roomTab,
                  selectedRoom?._id === room._id && styles.roomTabActive,
                ]}
                onPress={() => setSelectedRoom(room)}
              >
                <Text
                  style={[
                    styles.roomTabText,
                    selectedRoom?._id === room._id && styles.roomTabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {room.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to use:</Text>
          <Text style={styles.instructionsText}>
            • Tap on a date to mark it as unavailable{'\n'}
            • Tap again to make it available{'\n'}
            • Red dates are unavailable for booking{'\n'}
            • Don't forget to save your changes
          </Text>
        </Card>

        {/* Calendar */}
        <Card style={styles.calendarCard}>
          <Calendar
            current={new Date().toISOString().split('T')[0]}
            minDate={new Date().toISOString().split('T')[0]}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: Colors.white,
              calendarBackground: Colors.white,
              textSectionTitleColor: Colors.textSecondary,
              selectedDayBackgroundColor: Colors.brand,
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.brand,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.gray300,
              dotColor: Colors.brand,
              selectedDotColor: Colors.white,
              arrowColor: Colors.brand,
              monthTextColor: Colors.textPrimary,
              textDayFontWeight: Theme.fontWeight.medium,
              textMonthFontWeight: Theme.fontWeight.bold,
              textDayHeaderFontWeight: Theme.fontWeight.semibold,
              textDayFontSize: Theme.fontSize.sm,
              textMonthFontSize: Theme.fontSize.lg,
              textDayHeaderFontSize: Theme.fontSize.xs,
            }}
          />
        </Card>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {selectedRoom?.unavailableDates?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Unavailable Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {365 - (selectedRoom?.unavailableDates?.length || 0)}
              </Text>
              <Text style={styles.statLabel}>Available Days</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
          <Button
            title="Reset All"
            variant="outline"
            onPress={handleReset}
            style={styles.resetButton}
          />
        </View>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Icon name="bulb-outline" size={24} color={Colors.warning} style={styles.tipsIcon} />
          <Text style={styles.tipsTitle}>Calendar Tips</Text>
          <Text style={styles.tipsText}>
            • Update your calendar regularly{'\n'}
            • Block dates for personal use or maintenance{'\n'}
            • Keep at least 2-3 days buffer between bookings{'\n'}
            • Consider blocking holidays if you prefer
          </Text>
        </Card>
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
  roomTab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: Theme.spacing.sm,
    borderRadius: 14,
    backgroundColor: '#F4F4F8',
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  roomTabActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  roomTabText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
  },
  roomTabTextActive: {
    color: Colors.white,
  },
  instructionsCard: {
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  instructionsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  calendarCard: {
    marginBottom: Theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  statsCard: {
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.error,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray100,
    marginHorizontal: Theme.spacing.md,
  },
  actions: {
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  saveButton: {
    flex: 1,
  },
  resetButton: {
    flex: 1,
  },
  tipsCard: {
    backgroundColor: Colors.white,
    marginBottom: Theme.spacing.xl,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  tipsIcon: {
    marginBottom: Theme.spacing.sm,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  tipsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F4F4F8',
  },
  emptyIcon: {
    marginBottom: Theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginTop: Theme.spacing.md,
  },
});
