/**
 * Host Calendar Screen — Glassmorphism redesign
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

const { width: SW } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const GLASS_LIGHT  = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

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

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { if (selectedRoom) updateMarkedDates(); }, [selectedRoom]);

  const loadRooms = async () => {
    try {
      setError(null);
      const response = await api.hosts.rooms();
      if (response.success && response.data) {
        const roomsData = response.data as Room[];
        setRooms(roomsData.filter((r: any) => r.status === 'approved'));
        if (roomsData.length > 0) setSelectedRoom(roomsData[0]);
      }
    } catch (err: any) {
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
    selectedRoom.unavailableDates?.forEach(dateStr => {
      marked[dateStr] = { selected: true, selectedColor: Colors.error, marked: true, dotColor: Colors.white };
    });
    const today = new Date().toISOString().split('T')[0];
    if (!marked[today]) marked[today] = { selected: false, marked: true, dotColor: Colors.brand };
    setMarkedDates(marked);
  };

  const handleDayPress = (day: any) => {
    if (!selectedRoom) return;
    const dateStr = day.dateString;
    const unavailableDates = selectedRoom.unavailableDates || [];
    const isUnavailable = unavailableDates.includes(dateStr);
    setSelectedRoom({
      ...selectedRoom,
      unavailableDates: isUnavailable ? unavailableDates.filter(d => d !== dateStr) : [...unavailableDates, dateStr],
    });
  };

  const handleSave = async () => {
    if (!selectedRoom) return;
    setSaving(true);
    try {
      const response = await api.hosts.updateRoomAvailability(selectedRoom._id, selectedRoom.unavailableDates || []);
      if (response.success) Alert.alert('Success', 'Calendar updated successfully');
      else Alert.alert('Error', response.message || 'Failed to update calendar');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update calendar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Calendar', 'This will clear all unavailable dates. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { if (selectedRoom) setSelectedRoom({ ...selectedRoom, unavailableDates: [] }); } },
    ]);
  };

  if (loading) return <Loading message="Loading calendar..." />;
  if (error && rooms.length === 0) return <ErrorState title="Failed to Load Calendar" message={error} onRetry={loadRooms} />;

  if (rooms.length === 0) {
    return (
      <View style={S.emptyScreen}>
        <View style={S.emptyIconWrap}><Icon name="home-outline" size={32} color={Colors.brand} /></View>
        <Text style={S.emptyTitle}>No Active Listings</Text>
        <Text style={S.emptyText}>You need at least one approved listing to manage calendar</Text>
        <Button title="Add Listing" onPress={() => navigation.navigate('AddRoom')} style={S.addBtn} />
      </View>
    );
  }

  const unavailableCount = selectedRoom?.unavailableDates?.length || 0;

  return (
    <ScrollView style={S.root} showsVerticalScrollIndicator={false}>
      {/* ── Hero strip ── */}
      <View style={S.hero}>
        <View style={S.heroCircle} />
        <View style={S.heroContent}>
          <Text style={S.heroTitle}>Availability</Text>
          <Text style={S.heroSub}>Manage unavailable dates</Text>

          {/* Stat pills on hero */}
          <View style={S.heroPills}>
            <View style={S.heroPill}>
              <Text style={S.heroPillValue}>{unavailableCount}</Text>
              <Text style={S.heroPillLabel}>Blocked</Text>
            </View>
            <View style={S.heroPillDivider} />
            <View style={S.heroPill}>
              <Text style={[S.heroPillValue, { color: '#86EFAC' }]}>{365 - unavailableCount}</Text>
              <Text style={S.heroPillLabel}>Available</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={S.body}>
        {/* ── Property selector ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Select Property</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.roomTabsContent}>
            {rooms.map(room => {
              const active = selectedRoom?._id === room._id;
              return (
                <TouchableOpacity key={room._id} style={[S.roomTab, active && S.roomTabActive]} onPress={() => setSelectedRoom(room)}>
                  <Text style={[S.roomTabText, active && S.roomTabTextActive]} numberOfLines={1}>{room.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Instructions ── */}
        <View style={S.instructionsCard}>
          <View style={S.instructionsHeader}>
            <View style={S.instructionsIconWrap}><Icon name="information-circle-outline" size={18} color={Colors.info} /></View>
            <Text style={S.instructionsTitle}>How to use</Text>
          </View>
          <Text style={S.instructionsText}>
            Tap a date to mark it unavailable · Tap again to make it available · Red dates are blocked for booking
          </Text>
        </View>

        {/* ── Calendar ── */}
        <View style={S.calendarCard}>
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
        </View>

        {/* ── Legend ── */}
        <View style={S.legendRow}>
          <View style={S.legendItem}>
            <View style={[S.legendDot, { backgroundColor: Colors.error }]} />
            <Text style={S.legendText}>Unavailable</Text>
          </View>
          <View style={S.legendItem}>
            <View style={[S.legendDot, { backgroundColor: Colors.brand }]} />
            <Text style={S.legendText}>Today</Text>
          </View>
          <View style={S.legendItem}>
            <View style={[S.legendDot, { backgroundColor: Colors.gray200 }]} />
            <Text style={S.legendText}>Available</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={S.actionsRow}>
          <Button title="Save Changes" onPress={handleSave} loading={saving} style={S.saveBtn} />
          <Button title="Reset All" variant="outline" onPress={handleReset} style={S.resetBtn} />
        </View>

        {/* ── Tips ── */}
        <View style={S.tipsCard}>
          <View style={S.tipsHeader}>
            <View style={S.tipsIconWrap}><Icon name="bulb-outline" size={18} color={Colors.warning} /></View>
            <Text style={S.tipsTitle}>Calendar Tips</Text>
          </View>
          <Text style={S.tipsText}>
            • Update your calendar regularly{'\n'}
            • Block dates for personal use or maintenance{'\n'}
            • Keep at least 2-3 days buffer between bookings
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  // Hero
  hero: { backgroundColor: Colors.brand, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', paddingTop: STATUS_H + 16, paddingBottom: 24 },
  heroCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -50 },
  heroContent: { paddingHorizontal: 22 },
  heroTitle: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: 20 },
  heroPills: { flexDirection: 'row', backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, alignSelf: 'flex-start' },
  heroPill: { alignItems: 'center' },
  heroPillValue: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: '#FCA5A5', letterSpacing: -0.3 },
  heroPillLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  heroPillDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 20 },

  body: { padding: 16, paddingTop: 20 },

  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.3, marginBottom: 12 },
  roomTabsContent: { gap: 8 },
  roomTab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray200 },
  roomTabActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  roomTabText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  roomTabTextActive: { color: Colors.white },

  instructionsCard: { backgroundColor: Colors.info + '10', borderRadius: 18, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.info + '25' },
  instructionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  instructionsIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.info + '20', alignItems: 'center', justifyContent: 'center' },
  instructionsTitle: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  instructionsText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  calendarCard: { backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gray100, marginBottom: 16, ...Theme.shadows.sm },

  legendRow: { flexDirection: 'row', gap: 20, justifyContent: 'center', marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.textSecondary },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  saveBtn: { flex: 1 },
  resetBtn: { flex: 1 },

  tipsCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Colors.gray100, borderLeftWidth: 4, borderLeftColor: Colors.warning, ...Theme.shadows.sm, marginBottom: 30 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  tipsIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.warning + '15', alignItems: 'center', justifyContent: 'center' },
  tipsTitle: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  tipsText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },

  // Empty screen
  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F4F4F8' },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.brand + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 8, letterSpacing: -0.3 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  addBtn: { marginTop: 12 },
});
