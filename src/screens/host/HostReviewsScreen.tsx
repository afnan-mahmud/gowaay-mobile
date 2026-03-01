/**
 * Host Reviews Screen — Glassmorphism redesign
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loading from '../../components/Loading';
import Icon from '../../components/Icon';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const GLASS_LIGHT  = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

interface Review {
  _id: string;
  userId: { _id: string; name: string };
  roomId: { _id: string; title: string };
  rating: number;
  comment: string;
  hostResponse?: string;
  hostResponseAt?: string;
  createdAt: string;
}

export default function HostReviewsScreen({ navigation }: any) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadReviews(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { loadReviews(); });
    return unsubscribe;
  }, [navigation]);

  const loadReviews = async () => {
    try {
      setError(null);
      const response = await api.reviews.getHostReviews({ page: 1, limit: 50 });
      if (response.success && response.data) {
        const data = response.data as any;
        setReviews(data.reviews || []);
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadReviews(); };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;
    try {
      setSubmitting(true);
      const response = await api.reviews.respondToReview(reviewId, { response: responseText.trim() });
      if (response.success) { setRespondingTo(null); setResponseText(''); loadReviews(); }
      else Alert.alert('Error', (response as any).message || 'Failed to submit response');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const responded = reviews.filter(r => r.hostResponse).length;

  const renderStarRow = (rating: number) => (
    <View style={S.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={[S.star, i <= rating && S.starFilled]}>★</Text>
      ))}
    </View>
  );

  const renderReview = ({ item }: { item: Review }) => (
    <View style={S.card}>
      {/* Header */}
      <View style={S.cardHeader}>
        <View style={S.avatar}>
          <Text style={S.avatarText}>{item.userId?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <View style={S.reviewerInfo}>
          <Text style={S.reviewerName}>{item.userId?.name || 'Guest'}</Text>
          <Text style={S.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        {renderStarRow(item.rating)}
      </View>

      {/* Room badge */}
      <View style={S.roomBadge}>
        <Icon name="home-outline" size={12} color={Colors.brand} />
        <Text style={S.roomBadgeText}>{item.roomId?.title || 'Unknown Room'}</Text>
      </View>

      {/* Comment */}
      <Text style={S.comment}>{item.comment}</Text>

      {/* Host response */}
      {item.hostResponse ? (
        <View style={S.responseBox}>
          <View style={S.responseBoxHeader}>
            <Icon name="chatbubble-outline" size={14} color={Colors.brand} />
            <Text style={S.responseLabel}>Your Response</Text>
          </View>
          <Text style={S.responseText}>{item.hostResponse}</Text>
        </View>
      ) : (
        <>
          {respondingTo === item._id ? (
            <View style={S.responseForm}>
              <TextInput
                style={S.responseInput}
                placeholder="Write your response..."
                placeholderTextColor={Colors.textTertiary}
                value={responseText}
                onChangeText={setResponseText}
                multiline
                maxLength={1000}
                numberOfLines={3}
              />
              <View style={S.responseActions}>
                <Text style={S.charCount}>{responseText.length}/1000</Text>
                <View style={S.responseBtns}>
                  <TouchableOpacity style={S.cancelBtn} onPress={() => { setRespondingTo(null); setResponseText(''); }} disabled={submitting}>
                    <Text style={S.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.submitBtn, (!responseText.trim() || submitting) && S.submitBtnDisabled]}
                    onPress={() => handleSubmitResponse(item._id)}
                    disabled={!responseText.trim() || submitting}
                  >
                    {submitting
                      ? <ActivityIndicator size="small" color={Colors.white} />
                      : <Text style={S.submitBtnText}>Submit</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={S.respondBtn} onPress={() => setRespondingTo(item._id)}>
              <Icon name="chatbubble-outline" size={14} color={Colors.brand} />
              <Text style={S.respondBtnText}>Respond</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  if (loading) return <Loading message="Loading reviews..." />;
  if (error && reviews.length === 0) return <ErrorState title="Failed to Load Reviews" message={error} onRetry={loadReviews} />;

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon="star-outline"
        title="No Reviews Yet"
        message="Once guests review your properties, they will appear here."
      />
    );
  }

  return (
    <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={item => item._id}
        contentContainerStyle={S.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
        ListHeaderComponent={
          <>
            {/* ── Hero strip ── */}
            <View style={S.hero}>
              <View style={S.heroCircle} />
              <View style={S.heroContent}>
                <Text style={S.heroTitle}>Reviews</Text>
                <Text style={S.heroSub}>{reviews.length} total review{reviews.length !== 1 ? 's' : ''}</Text>

                <View style={S.statsPills}>
                  <View style={S.statPill}>
                    <Text style={S.statPillValue}>{avgRating}</Text>
                    <Text style={S.statPillLabel}>Avg Rating</Text>
                  </View>
                  <View style={S.statPillDivider} />
                  <View style={S.statPill}>
                    <Text style={[S.statPillValue, { color: '#86EFAC' }]}>{responded}</Text>
                    <Text style={S.statPillLabel}>Responded</Text>
                  </View>
                  <View style={S.statPillDivider} />
                  <View style={S.statPill}>
                    <Text style={[S.statPillValue, { color: '#FCD34D' }]}>{reviews.length - responded}</Text>
                    <Text style={S.statPillLabel}>Pending Reply</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={S.listHeader}>
              <Text style={S.listHeaderTitle}>All Reviews</Text>
            </View>
          </>
        }
      />
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  // Hero
  hero: { backgroundColor: Colors.brand, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', paddingTop: STATUS_H + 16, paddingBottom: 24, marginBottom: 0 },
  heroCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -50 },
  heroContent: { paddingHorizontal: 22 },
  heroTitle: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: 20 },
  statsPills: { flexDirection: 'row', backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  statPill: { flex: 1, alignItems: 'center' },
  statPillValue: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.3 },
  statPillLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  statPillDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  listHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  listHeaderTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.3 },

  list: { paddingHorizontal: 16, paddingBottom: 30 },

  // Card
  card: { backgroundColor: Colors.white, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: Colors.white, fontSize: 16, fontWeight: Theme.fontWeight.bold },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, letterSpacing: -0.2 },
  reviewDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  starRow: { flexDirection: 'row', gap: 1 },
  star: { fontSize: 14, color: Colors.gray200 },
  starFilled: { color: '#F59E0B' },

  roomBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.brand + '10', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12 },
  roomBadgeText: { fontSize: 12, color: Colors.brand, fontWeight: Theme.fontWeight.medium },

  comment: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21, marginBottom: 12 },

  responseBox: { backgroundColor: '#F4F4F8', borderRadius: 14, padding: 12, borderLeftWidth: 3, borderLeftColor: Colors.brand },
  responseBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  responseLabel: { fontSize: 11, fontWeight: Theme.fontWeight.bold, color: Colors.brand, textTransform: 'uppercase', letterSpacing: 0.8 },
  responseText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  respondBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.brand + '40', borderRadius: 14, alignSelf: 'flex-start', backgroundColor: Colors.brand + '08' },
  respondBtnText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.brand },

  responseForm: { marginTop: 4 },
  responseInput: { borderWidth: 1, borderColor: Colors.gray200, borderRadius: 14, padding: 12, fontSize: 14, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', backgroundColor: Colors.gray50 },
  responseActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  charCount: { fontSize: 11, color: Colors.textSecondary },
  responseBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.gray200, borderRadius: 14, backgroundColor: Colors.white },
  cancelBtnText: { fontSize: 13, color: Colors.textSecondary },
  submitBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: Colors.brand, borderRadius: 14, minWidth: 80, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
});
