/**
 * HotelDetailScreen — RateHawk hotel details and booking initiation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { api } from '../../api/client';
import CachedImage from '../../components/CachedImage';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotelData {
  hotelId: string;
  name: string;
  locationName: string;
  address: string;
  starRating: number;
  images: { url: string }[];
  priceBdt: number;
  priceUsd: number;
  mealType: string;
  roomName: string;
  freeCancellationBefore: string | null;
  searchHash: string | null;
  matchHash: string | null;
  checkIn: string;
  checkOut: string;
  allotment: number;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast Included',
  'half-board': 'Half Board',
  'full-board': 'Full Board',
  'all-inclusive': 'All Inclusive',
  dinner: 'Dinner Included',
  lunch: 'Lunch Included',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const calcNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / 86400000));
};

export default function HotelDetailScreen({ navigation, route }: any) {
  const { hotelId, checkIn, checkOut, guests } = route.params || {};

  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  const loadHotel = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.ratehawk.getHotel<HotelData>(hotelId, {
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        adults: String(guests || 1),
      }) as any;

      if (res?.success && res?.data) {
        setHotel(res.data);
      } else {
        Alert.alert('Error', 'Hotel not found');
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Failed to load hotel details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [hotelId, checkIn, checkOut, guests, navigation]);

  useEffect(() => {
    loadHotel();
  }, [loadHotel]);

  const handleBookNow = async () => {
    if (!hotel) return;

    const firstName = guestFirstName.trim();
    const lastName = guestLastName.trim();

    if (!firstName || !lastName) {
      Alert.alert('Guest Information Required', 'Please enter first and last name');
      setShowGuestForm(true);
      return;
    }

    try {
      setBooking(true);
      const nights = calcNights(hotel.checkIn, hotel.checkOut);

      const res = await api.ratehawk.createBooking<{
        bookingId: string;
        gatewayUrl: string;
      }>({
        hotelId: hotel.hotelId,
        hotelName: hotel.name,
        roomName: hotel.roomName,
        locationName: hotel.locationName,
        checkIn: hotel.checkIn,
        checkOut: hotel.checkOut,
        guests: guests || 1,
        nights,
        guestFirstName: firstName,
        guestLastName: lastName,
        amountBdt: hotel.priceBdt,
        amountUsd: hotel.priceUsd,
        mealType: hotel.mealType,
        searchHash: hotel.searchHash,
        matchHash: hotel.matchHash,
        bookHash: null,
        images: hotel.images.slice(0, 1).map((img) => img.url),
      }) as any;

      if (res?.success && res?.data?.gatewayUrl) {
        // Open EPS gateway in browser
        Linking.openURL(res.data.gatewayUrl);
        Alert.alert(
          'Payment Started',
          'Complete your payment in the browser. After payment, your booking will be confirmed.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', res?.message || 'Failed to initiate booking');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.brand} />
        <Text style={styles.loadingText}>Loading hotel details...</Text>
      </View>
    );
  }

  if (!hotel) return null;

  const nights = calcNights(hotel.checkIn, hotel.checkOut);
  const hasMeal = hotel.mealType && hotel.mealType !== 'nomeal';
  const mealLabel = MEAL_LABELS[hotel.mealType] || null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          {hotel.images.length > 0 ? (
            <CachedImage
              source={{ uri: hotel.images[imgIdx]?.url }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.imagePlaceholder]}>
              <Icon name="business-outline" size={56} color={Colors.gray300} />
            </View>
          )}

          {hotel.images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.arrowBtn, styles.arrowLeft]}
                onPress={() => setImgIdx((p) => (p === 0 ? hotel.images.length - 1 : p - 1))}
              >
                <Icon name="chevron-back" size={20} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.arrowBtn, styles.arrowRight]}
                onPress={() => setImgIdx((p) => (p === hotel.images.length - 1 ? 0 : p + 1))}
              >
                <Icon name="chevron-forward" size={20} color={Colors.white} />
              </TouchableOpacity>
              <View style={styles.imgCounter}>
                <Text style={styles.imgCounterText}>{imgIdx + 1}/{hotel.images.length}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.body}>
          {/* Stars */}
          {hotel.starRating > 0 && (
            <View style={styles.starsRow}>
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Icon key={i} name="star" size={14} color="#FFC107" />
              ))}
            </View>
          )}

          {/* Name */}
          <Text style={styles.hotelName}>{hotel.name}</Text>

          {/* Location */}
          {hotel.locationName && (
            <View style={styles.row}>
              <Icon name="location-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.locationText}>{hotel.locationName}</Text>
            </View>
          )}
          {hotel.address && hotel.address !== hotel.locationName && (
            <Text style={styles.addressText}>{hotel.address}</Text>
          )}

          {/* Stay info */}
          <View style={styles.stayCard}>
            <View style={styles.stayRow}>
              <View style={styles.stayItem}>
                <Text style={styles.stayLabel}>Check-in</Text>
                <Text style={styles.stayValue}>{formatDate(hotel.checkIn)}</Text>
              </View>
              <View style={styles.stayDivider} />
              <View style={styles.stayItem}>
                <Text style={styles.stayLabel}>Check-out</Text>
                <Text style={styles.stayValue}>{formatDate(hotel.checkOut)}</Text>
              </View>
              <View style={styles.stayDivider} />
              <View style={styles.stayItem}>
                <Text style={styles.stayLabel}>Guests</Text>
                <Text style={styles.stayValue}>{guests || 1}</Text>
              </View>
            </View>
          </View>

          {/* Room info */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Room Details</Text>
            {hotel.roomName ? (
              <View style={styles.row}>
                <Icon name="bed-outline" size={15} color={Colors.textTertiary} />
                <Text style={styles.infoText}>{hotel.roomName}</Text>
              </View>
            ) : null}
            {hasMeal && mealLabel && (
              <View style={styles.row}>
                <Icon name="restaurant-outline" size={15} color="#F59E0B" />
                <Text style={styles.infoText}>{mealLabel}</Text>
              </View>
            )}
            {hotel.freeCancellationBefore && (
              <View style={styles.row}>
                <Icon name="shield-checkmark-outline" size={15} color={Colors.success} />
                <Text style={[styles.infoText, { color: Colors.success }]}>Free cancellation available</Text>
              </View>
            )}
          </View>

          {/* Guest Name Form */}
          {showGuestForm && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Guest Information</Text>
              <Text style={styles.guestHint}>Enter name as it appears on ID/passport</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <View style={styles.inputBox}>
                  <Icon name="person-outline" size={16} color={Colors.textTertiary} />
                  <Text
                    style={[styles.inputText, !guestFirstName && { color: Colors.textTertiary }]}
                    onPress={() => {
                      Alert.prompt(
                        'First Name',
                        'Enter guest first name',
                        (text) => setGuestFirstName(text),
                        'plain-text',
                        guestFirstName
                      );
                    }}
                  >
                    {guestFirstName || 'e.g. John'}
                  </Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <View style={styles.inputBox}>
                  <Icon name="person-outline" size={16} color={Colors.textTertiary} />
                  <Text
                    style={[styles.inputText, !guestLastName && { color: Colors.textTertiary }]}
                    onPress={() => {
                      Alert.prompt(
                        'Last Name',
                        'Enter guest last name',
                        (text) => setGuestLastName(text),
                        'plain-text',
                        guestLastName
                      );
                    }}
                  >
                    {guestLastName || 'e.g. Doe'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Price summary */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Price Summary</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Room price</Text>
              <Text style={styles.priceValue}>৳{hotel.priceBdt.toLocaleString()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Nights</Text>
              <Text style={styles.priceValue}>{nights}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <View>
                <Text style={styles.totalValue}>৳{hotel.priceBdt.toLocaleString()}</Text>
                <Text style={styles.usdValue}>${hotel.priceUsd} USD</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceValue}>৳{hotel.priceBdt.toLocaleString()}</Text>
          <Text style={styles.footerPriceLabel}>/{nights > 1 ? `${nights} nights` : 'night'}</Text>
        </View>

        {!showGuestForm ? (
          <Button
            title="Enter Guest Details"
            onPress={() => setShowGuestForm(true)}
            style={styles.bookBtn}
            textStyle={styles.bookBtnText}
          />
        ) : (
          <Button
            title="Confirm & Pay"
            onPress={handleBookNow}
            loading={booking}
            style={styles.bookBtn}
            textStyle={styles.bookBtnText}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  imageContainer: { position: 'relative' },
  heroImage: { width: SCREEN_WIDTH, height: 260 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray100 },
  arrowBtn: {
    position: 'absolute', top: '50%', marginTop: -20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  imgCounter: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  imgCounterText: { fontSize: 12, color: Colors.white, fontWeight: Theme.fontWeight.medium },
  body: { padding: 16, gap: 14 },
  starsRow: { flexDirection: 'row', gap: 3, marginBottom: 4 },
  hotelName: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.4, lineHeight: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  addressText: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  stayCard: {
    backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, padding: 16, marginTop: 4,
  },
  stayRow: { flexDirection: 'row', alignItems: 'center' },
  stayItem: { flex: 1, alignItems: 'center' },
  stayDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  stayLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 4, fontWeight: Theme.fontWeight.medium },
  stayValue: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 10 },
  infoText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  guestHint: { fontSize: 12, color: Colors.textTertiary, marginBottom: 12 },
  inputWrapper: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.textSecondary, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: Colors.gray50,
  },
  inputText: { fontSize: 15, color: Colors.textPrimary, flex: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  priceValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: Theme.fontWeight.medium },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.brand, textAlign: 'right' },
  usdValue: { fontSize: 11, color: Colors.textTertiary, textAlign: 'right', marginTop: 2 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 24,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
    ...Theme.shadows.md,
  },
  footerPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  footerPriceValue: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  footerPriceLabel: { fontSize: 12, color: Colors.textSecondary },
  bookBtn: { backgroundColor: Colors.brand, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13 },
  bookBtnText: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
});
