/**
 * Admin Chat Screen — Glassmorphism design
 * Shows all internal message threads between guests and hosts.
 * Admin/moderator can view conversations and reply as admin.
 * Moderators can see guest name + phone via info icon; host data is limited.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { api, ApiResponse } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const ADMIN_BG = '#1E293B';
const GLASS_LIGHT = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

interface ThreadItem {
  _id: string;
  roomId: { _id: string; title: string; images?: Array<{ url: string }> };
  userId: { _id: string; name: string; email?: string; phone?: string };
  hostId: { _id: string; displayName: string };
  lastMessageAt: string;
}

interface ChatMessage {
  _id: string;
  text: string;
  senderRole: 'guest' | 'host' | 'admin';
  blocked?: boolean;
  reason?: string;
  createdAt: string;
}

interface ThreadsResponse {
  threads: ThreadItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface MessagesResponse {
  messages: ChatMessage[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function AdminChatScreen({ navigation }: any) {
  const { user } = useAuth();
  const isModerator = user?.adminLevel === 'moderator';
  const flatListRef = useRef<FlatList>(null);

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedThread, setSelectedThread] = useState<ThreadItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      setError(null);
      const res = await api.chat.getThreads({ page: 1, limit: 50 }) as ApiResponse<ThreadsResponse>;
      if (res.success && res.data) {
        setThreads((res.data as any).threads || []);
      } else {
        setError(res.message || 'Failed to load threads');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const onRefresh = () => { setRefreshing(true); loadThreads(); };

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setMsgLoading(true);
      const res = await api.chat.getMessages(threadId, { page: 1, limit: 200 }) as ApiResponse<MessagesResponse>;
      if (res.success && res.data) {
        setMessages((res.data as any).messages || []);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Error', message: getErrorMessage(err) });
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const selectThread = (thread: ThreadItem) => {
    setSelectedThread(thread);
    setMessages([]);
    loadMessages(thread._id);
  };

  const goBack = () => {
    setSelectedThread(null);
    setMessages([]);
    setInfoVisible(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedThread || sending) return;
    const msg = replyText.trim();
    setReplyText('');
    setSending(true);
    try {
      const res = await api.chat.sendMessage({
        threadId: selectedThread._id,
        text: msg,
        senderRole: 'admin',
      });
      if (res.success) {
        loadMessages(selectedThread._id);
      } else {
        Toast.show({ type: 'error', title: 'Send Failed', message: res.message || 'Could not send message' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Send Failed', message: getErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getSenderColor = (role: string) => {
    switch (role) {
      case 'guest': return '#3B82F6';
      case 'host': return '#10B981';
      case 'admin': return '#8B5CF6';
      default: return Colors.textSecondary;
    }
  };

  // ─── Thread List ──────────────────────────────────────────────────
  if (!selectedThread) {
    if (loading) return <Loading message="Loading chats..." />;
    if (error && threads.length === 0) return <ErrorState title="Failed to Load" message={error} onRetry={loadThreads} />;

    return (
      <View style={S.root}>
        {/* Hero */}
        <View style={S.heroWrapper}>
          <View style={S.heroBg} />
          <View style={S.heroCircle1} />
          <View style={S.heroCircle2} />
          <View style={S.heroContent}>
            <Text style={S.heroEyebrow}>{isModerator ? 'Support' : 'Admin'}</Text>
            <Text style={S.heroTitle}>Chat Monitoring</Text>
            <Text style={S.heroSub}>Guest-Host conversations</Text>
          </View>
        </View>

        <FlatList
          data={threads}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
          contentContainerStyle={S.threadList}
          ListEmptyComponent={
            <View style={S.emptyContainer}>
              <Icon name="chatbubbles-outline" size={40} color={Colors.brand} />
              <Text style={S.emptyTitle}>No Conversations</Text>
              <Text style={S.emptyText}>No chat threads found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={S.threadCard} activeOpacity={0.7} onPress={() => selectThread(item)}>
              <View style={S.threadIcon}>
                <Icon name="chatbubbles" size={22} color={Colors.brand} />
              </View>
              <View style={S.threadInfo}>
                <Text style={S.threadRoom} numberOfLines={1}>{item.roomId?.title || 'Deleted Room'}</Text>
                <Text style={S.threadParties} numberOfLines={1}>
                  {item.userId?.name || 'Guest'}{!isModerator ? ` ↔ ${item.hostId?.displayName || 'Host'}` : ''}
                </Text>
              </View>
              <View style={S.threadMeta}>
                <Text style={S.threadDate}>{formatDate(item.lastMessageAt)}</Text>
                <Icon name="chevron-forward" size={16} color={Colors.gray400} />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ─── Chat Detail ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {/* Header */}
      <View style={S.chatHeader}>
        <View style={S.chatHeaderBg} />
        <View style={S.chatHeaderRow}>
          <TouchableOpacity onPress={goBack} style={S.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={S.chatHeaderInfo}>
            <Text style={S.chatHeaderTitle} numberOfLines={1}>{selectedThread.roomId?.title || 'Chat'}</Text>
            <Text style={S.chatHeaderSub} numberOfLines={1}>
              {selectedThread.userId?.name || 'Guest'}{!isModerator ? ` ↔ ${selectedThread.hostId?.displayName || 'Host'}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setInfoVisible(true)} style={S.infoBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="information-circle-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {msgLoading ? (
        <View style={S.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={S.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={S.emptyContainer}>
              <Icon name="chatbubble-outline" size={32} color={Colors.gray400} />
              <Text style={S.emptyText}>No messages yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isAdmin = item.senderRole === 'admin';
            const isHost = item.senderRole === 'host';
            const isRight = isAdmin;

            return (
              <View style={[S.msgRow, isRight ? S.msgRowRight : S.msgRowLeft]}>
                <View style={[S.msgBubble, isAdmin ? S.msgBubbleAdmin : isHost ? S.msgBubbleHost : S.msgBubbleGuest]}>
                  <Text style={[S.msgSenderLabel, { color: getSenderColor(item.senderRole) }]}>
                    {item.senderRole === 'guest' ? 'Guest' : item.senderRole === 'host' ? 'Host' : 'Admin'}
                  </Text>
                  {item.blocked && (
                    <View style={S.blockedBadge}>
                      <Icon name="alert-circle" size={12} color={Colors.error} />
                      <Text style={S.blockedText}>Blocked{item.reason ? `: ${item.reason}` : ''}</Text>
                    </View>
                  )}
                  <Text style={[S.msgText, isAdmin ? S.msgTextLight : S.msgTextDark]}>{item.text}</Text>
                  <Text style={[S.msgTime, isAdmin ? S.msgTimeLight : S.msgTimeDark]}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Reply Bar */}
      <View style={S.replyBar}>
        <TextInput
          style={S.replyInput}
          placeholder="Reply as admin..."
          placeholderTextColor={Colors.textSecondary}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={4096}
          editable={!sending}
        />
        <TouchableOpacity
          style={[S.sendBtn, (!replyText.trim() || sending) && S.sendBtnDisabled]}
          onPress={sendReply}
          disabled={!replyText.trim() || sending}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Icon name="send" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Guest Info Modal */}
      <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setInfoVisible(false)}>
          <View style={S.modalContent}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Guest Information</Text>
              <TouchableOpacity onPress={() => setInfoVisible(false)}>
                <Icon name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={S.modalBody}>
              <View style={S.infoRow}>
                <Icon name="person-outline" size={20} color={Colors.brand} />
                <View style={S.infoTextWrap}>
                  <Text style={S.infoLabel}>Name</Text>
                  <Text style={S.infoValue}>{selectedThread?.userId?.name || 'Unknown'}</Text>
                </View>
              </View>
              {selectedThread?.userId?.phone && (
                <View style={S.infoRow}>
                  <Icon name="call-outline" size={20} color={Colors.brand} />
                  <View style={S.infoTextWrap}>
                    <Text style={S.infoLabel}>Phone</Text>
                    <Text style={S.infoValue}>{selectedThread.userId.phone}</Text>
                  </View>
                </View>
              )}
              {selectedThread?.userId?.email && (
                <View style={S.infoRow}>
                  <Icon name="mail-outline" size={20} color={Colors.brand} />
                  <View style={S.infoTextWrap}>
                    <Text style={S.infoLabel}>Email</Text>
                    <Text style={S.infoValue}>{selectedThread.userId.email}</Text>
                  </View>
                </View>
              )}
              {!isModerator && selectedThread?.hostId && (
                <>
                  <View style={S.infoDivider} />
                  <Text style={S.infoSectionTitle}>Host Information</Text>
                  <View style={S.infoRow}>
                    <Icon name="business-outline" size={20} color="#10B981" />
                    <View style={S.infoTextWrap}>
                      <Text style={S.infoLabel}>Host Name</Text>
                      <Text style={S.infoValue}>{selectedThread.hostId.displayName}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  heroWrapper: { overflow: 'visible' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: ADMIN_BG, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.12)', top: -50, right: -40 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(59,130,246,0.10)', top: 30, left: -40 },
  heroContent: { paddingTop: STATUS_H + 20, paddingHorizontal: 22, paddingBottom: 28 },
  heroEyebrow: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: Theme.fontWeight.medium, marginBottom: 2 },
  heroTitle: { fontSize: 28, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.5, marginBottom: 2 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },

  threadList: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  threadIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.brand + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  threadInfo: { flex: 1 },
  threadRoom: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 2 },
  threadParties: { fontSize: 13, color: Colors.textSecondary },
  threadMeta: { alignItems: 'flex-end', gap: 4 },
  threadDate: { fontSize: 12, color: Colors.textSecondary },

  chatHeader: { overflow: 'hidden' },
  chatHeaderBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: ADMIN_BG },
  chatHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingTop: STATUS_H + 8, paddingBottom: 14, paddingHorizontal: 16 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  chatHeaderInfo: { flex: 1, marginHorizontal: 10 },
  chatHeaderTitle: { fontSize: 17, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  chatHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  infoBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { padding: 16, paddingBottom: 12 },

  msgRow: { marginBottom: 8 },
  msgRowLeft: { alignItems: 'flex-start' },
  msgRowRight: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  msgBubbleGuest: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray100 },
  msgBubbleHost: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5' },
  msgBubbleAdmin: { backgroundColor: '#8B5CF6' },
  msgSenderLabel: { fontSize: 11, fontWeight: Theme.fontWeight.semibold, marginBottom: 4 },
  msgText: { fontSize: 15, lineHeight: 21 },
  msgTextDark: { color: Colors.textPrimary },
  msgTextLight: { color: Colors.white },
  msgTime: { fontSize: 11, marginTop: 4 },
  msgTimeDark: { color: Colors.textSecondary },
  msgTimeLight: { color: 'rgba(255,255,255,0.7)' },

  blockedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.error + '15', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4, gap: 4 },
  blockedText: { fontSize: 11, color: Colors.error },

  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  replyInput: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.gray50,
    marginRight: 10,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginTop: 12, marginBottom: 4 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', maxWidth: 360, backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  modalBody: { padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  infoSectionTitle: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.textSecondary, marginBottom: 12, marginTop: 4 },
  infoDivider: { height: 1, backgroundColor: Colors.gray100, marginBottom: 16 },
});
