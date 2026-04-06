/**
 * Admin Reviews List Screen — view all reviews, super_admin can edit
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import { Toast } from '../../components/Toast';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

interface Review {
  _id: string;
  userId: { _id: string; name: string; email?: string };
  roomId: { _id: string; title: string };
  hostId: { _id: string; displayName: string };
  rating: number;
  comment: string;
  hidden: boolean;
  createdAt: string;
}

export default function AdminReviewsListScreen({ navigation }: any) {
  const { user } = useAuth();
  const isSuperAdmin = user?.adminLevel === 'super_admin';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const response = await api.admin.reviews({ page: 1, limit: 50 });
      if (response.success && response.data) {
        const data = response.data as any;
        setReviews(data.reviews || data || []);
      }
    } catch (error) {
      Toast.show({ type: 'error', title: 'Error', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { loadReviews(); });
    return unsubscribe;
  }, [navigation, loadReviews]);

  const handleRefresh = () => { setRefreshing(true); loadReviews(); };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    if (editComment.trim().length < 10) {
      Alert.alert('Error', 'Comment must be at least 10 characters');
      return;
    }
    try {
      setSaving(true);
      const response = await api.admin.editReview(editingReview._id, {
        rating: editRating,
        comment: editComment.trim(),
      });
      if (response.success) {
        Toast.show({ type: 'success', title: 'Success', message: 'Review updated' });
        setEditModal(false);
        loadReviews();
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && setEditRating(i)}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Icon name={i <= rating ? 'star' : 'star-outline'} size={interactive ? 28 : 14} color="#FFC107" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const renderReview = ({ item }: { item: Review }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('RoomDetail', { roomId: item.roomId._id })}
    >
      <Card style={[styles.card, item.hidden && styles.cardHidden]}>
        <View style={styles.cardHeader}>
          <View style={styles.guestRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.userId.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>{item.userId.name}</Text>
              <Text style={styles.subText} numberOfLines={1}>{item.userId.email}</Text>
            </View>
            {item.hidden && (
              <View style={styles.hiddenBadge}>
                <Text style={styles.hiddenBadgeText}>Hidden</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.propertyRow}>
          <Icon name="home-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.propertyName} numberOfLines={1}>{item.roomId.title}</Text>
        </View>
        <View style={styles.propertyRow}>
          <Icon name="person-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.hostName}>Host: {item.hostId.displayName}</Text>
        </View>

        <View style={styles.ratingRow}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        <Text style={styles.comment} numberOfLines={3}>{item.comment}</Text>

        {isSuperAdmin && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}
          >
            <Icon name="create-outline" size={14} color="#8B5CF6" />
            <Text style={styles.editButtonText}>Edit Review</Text>
          </TouchableOpacity>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reviews.length === 0 ? (
        <View style={styles.center}>
          <Icon name="star-outline" size={64} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Edit Review Modal */}
      <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            {editingReview && (
              <Text style={styles.modalSub}>{editingReview.userId.name} — {editingReview.roomId.title}</Text>
            )}

            <Text style={styles.modalLabel}>Rating</Text>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              {renderStars(editRating, true)}
            </View>

            <Text style={styles.modalLabel}>Comment</Text>
            <TextInput
              style={styles.modalInput}
              value={editComment}
              onChangeText={setEditComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSaveText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: 16 },
  card: {
    marginBottom: 14, padding: 14, borderRadius: 17,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  cardHidden: { opacity: 0.55 },
  cardHeader: { marginBottom: 10 },
  guestRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  avatarText: { color: Colors.white, fontSize: 15, fontWeight: Theme.fontWeight.bold },
  guestName: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  subText: { fontSize: 12, color: Colors.textTertiary },
  hiddenBadge: {
    backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  hiddenBadgeText: { fontSize: 10, fontWeight: Theme.fontWeight.semibold, color: '#DC2626' },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  propertyName: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  hostName: { fontSize: 13, color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 8 },
  ratingText: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  dateText: { fontSize: 11, color: Colors.textTertiary, marginLeft: 'auto' },
  comment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  editButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 10, paddingVertical: 8, backgroundColor: '#F3E8FF',
    borderRadius: 10, gap: 4, borderWidth: 1, borderColor: '#E9D5FF',
  },
  editButtonText: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: '#8B5CF6' },
  emptyTitle: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginTop: 12 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContainer: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 380, ...Theme.shadows.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textSecondary, marginBottom: 8 },
  modalInput: {
    borderWidth: 1, borderColor: Colors.gray200, borderRadius: 12,
    padding: 12, fontSize: 14, color: Colors.textPrimary,
    minHeight: 100, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.gray100, alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.textSecondary },
  modalSaveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#8B5CF6', alignItems: 'center',
  },
  modalSaveText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
});
