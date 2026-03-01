/**
 * Admin WhatsApp Chats Screen — Glassmorphism design
 * Shows all WhatsApp Business conversations and AI bot replies.
 * Admins can stop the AI bot and reply manually. Admin name shown below admin messages.
 * Accessible by super_admin, admin, and moderator.
 * Features: Gallery, Catalog, Quick Reply via 3-dot menu.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { api, ApiResponse } from '../../api/client';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

const { width: SW } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const ADMIN_BG = '#1E293B';
const GLASS_LIGHT = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';
const WA_GREEN = '#25D366';
const BOT_BLUE = '#3B82F6';
const ADMIN_PURPLE = '#8B5CF6';

interface ConversationItem {
  customerNumber: string;
  lastMessage: string;
  lastMessageAt: string;
  lastDirection: 'incoming' | 'outgoing';
  lastSenderType: 'customer' | 'bot' | 'host' | 'admin';
  totalMessages: number;
}

interface ChatMessage {
  _id: string;
  customerNumber: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  messageType: string;
  senderType: 'customer' | 'bot' | 'host' | 'admin';
  adminName?: string;
  createdAt: string;
}

interface CatalogProduct {
  id: string;
  retailer_id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  image_url: string;
  url: string;
  availability: string;
}

interface QuickReplyItem {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
}

interface ConversationsResponse {
  conversations: ConversationItem[];
  pagination: { page: number; total: number; pages: number };
}

interface ChatDetailResponse {
  messages: ChatMessage[];
  pagination: { page: number; total: number; pages: number };
}

interface ConvStatusResponse {
  botEnabled: boolean;
  step: string;
}

type PanelType = null | 'gallery' | 'catalog' | 'quickReply';

export default function AdminWhatsAppChatsScreen({ navigation }: any) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Reply & bot state
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [botEnabled, setBotEnabled] = useState(true);
  const [togglingBot, setTogglingBot] = useState(false);

  // 3-dot menu & panels
  const [showMenu, setShowMenu] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // Gallery state
  const [galleryUri, setGalleryUri] = useState<string | null>(null);
  const [galleryType, setGalleryType] = useState<'image' | 'video'>('image');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Catalog state
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [sendingCatalog, setSendingCatalog] = useState<string | null>(null);

  // Quick Reply state
  const [quickReplies, setQuickReplies] = useState<QuickReplyItem[]>([]);
  const [quickReplyLoading, setQuickReplyLoading] = useState(false);
  const [showAddQR, setShowAddQR] = useState(false);
  const [newQRTitle, setNewQRTitle] = useState('');
  const [newQRMessage, setNewQRMessage] = useState('');
  const [savingQR, setSavingQR] = useState(false);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = useCallback(async (reset = true) => {
    try {
      if (reset) { setError(null); setPage(1); setHasMore(true); }
      const p = reset ? 1 : page;
      const response: ApiResponse<ConversationsResponse> = await api.admin.whatsappChats<ConversationsResponse>({ page: p, limit: 30 });
      if (response.success && response.data) {
        const items = response.data.conversations || [];
        if (reset) setConversations(items);
        else setConversations(prev => [...prev, ...items]);
        setHasMore(p < (response.data.pagination?.pages || 1));
        if (!reset) setPage(p);
      } else {
        setError(response.message || 'Failed to load conversations');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [page]);

  const loadMessages = useCallback(async (phone: string, reset = true) => {
    try {
      if (reset) { setError(null); setMsgPage(1); setMsgHasMore(true); }
      const p = reset ? 1 : msgPage;
      const response: ApiResponse<ChatDetailResponse> = await api.admin.whatsappChatDetail<ChatDetailResponse>(phone, { page: p, limit: 50 });
      if (response.success && response.data) {
        const items = response.data.messages || [];
        if (reset) setMessages(items);
        else setMessages(prev => [...prev, ...items]);
        setMsgHasMore(p < (response.data.pagination?.pages || 1));
        if (!reset) setMsgPage(p);
      } else {
        setError(response.message || 'Failed to load messages');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [msgPage]);

  const loadConvStatus = async (phone: string) => {
    try {
      const res: ApiResponse<ConvStatusResponse> = await api.admin.whatsappChatStatus<ConvStatusResponse>(phone);
      if (res.success && res.data) {
        setBotEnabled(res.data.botEnabled);
      }
    } catch { /* ignore */ }
  };

  const openConversation = (phone: string) => {
    setSelectedPhone(phone);
    setView('detail');
    setLoading(true);
    setMessages([]);
    setReplyText('');
    setBotEnabled(true);
    setActivePanel(null);
    setShowMenu(false);
    loadMessages(phone, true);
    loadConvStatus(phone);
  };

  const goBack = () => {
    setView('list');
    setSelectedPhone('');
    setMessages([]);
    setReplyText('');
    setActivePanel(null);
    setShowMenu(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (view === 'list') loadConversations(true);
    else {
      loadMessages(selectedPhone, true);
      loadConvStatus(selectedPhone);
    }
  };

  const loadMoreConversations = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setPage(prev => prev + 1);
    loadConversations(false);
  };

  const loadMoreMessages = () => {
    if (loadingMore || !msgHasMore) return;
    setLoadingMore(true);
    setMsgPage(prev => prev + 1);
    loadMessages(selectedPhone, false);
  };

  // ─── Send admin reply ──────────────────────────────
  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    const msg = replyText.trim();
    setSending(true);
    try {
      const res = await api.admin.whatsappReply(selectedPhone, msg);
      if (res.success && res.data) {
        const newMsg = res.data as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        setReplyText('');
        setBotEnabled(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      } else {
        Toast.show({ type: 'error', title: 'Send Failed', message: res.message || 'Could not send' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Send Failed', message: getErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  // ─── Toggle AI bot ─────────────────────────────────
  const toggleBot = () => {
    const newState = !botEnabled;
    const action = newState ? 'Resume AI Bot' : 'Stop AI Bot';
    const desc = newState
      ? 'AI bot will start replying to this customer again.'
      : 'AI bot will stop replying. You will need to reply manually.';

    Alert.alert(action, desc, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: newState ? 'default' : 'destructive',
        onPress: async () => {
          setTogglingBot(true);
          try {
            const res = await api.admin.whatsappToggleBot(selectedPhone, newState);
            if (res.success) {
              setBotEnabled(newState);
              Toast.show({
                type: 'success',
                title: newState ? 'AI Bot Resumed' : 'AI Bot Stopped',
                message: newState ? 'Bot is replying again' : 'You can now reply manually',
              });
              loadMessages(selectedPhone, true);
            }
          } catch (err: any) {
            Toast.show({ type: 'error', title: 'Failed', message: getErrorMessage(err) });
          } finally {
            setTogglingBot(false);
          }
        },
      },
    ]);
  };

  // ─── Gallery handlers ──────────────────────────────
  const handleGalleryOpen = () => {
    setShowMenu(false);
    launchImageLibrary(
      { mediaType: 'mixed', maxWidth: 1920, maxHeight: 1920, quality: 0.8 },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to pick media');
          return;
        }
        const asset = response.assets?.[0];
        if (asset?.uri) {
          const isVideo = asset.type?.startsWith('video/');
          setGalleryUri(asset.uri);
          setGalleryType(isVideo ? 'video' : 'image');
          setGalleryCaption('');
          setActivePanel('gallery');
        }
      }
    );
  };

  const handleGallerySend = async () => {
    if (!galleryUri || !selectedPhone || galleryUploading) return;
    setGalleryUploading(true);
    try {
      const uploadRes = await api.uploads.image(galleryUri);
      if (!uploadRes.success || !(uploadRes.data as any)?.url) {
        Toast.show({ type: 'error', title: 'Upload Failed', message: 'Could not upload media' });
        return;
      }
      const mediaUrl = (uploadRes.data as any).url;
      let res: any;
      if (galleryType === 'video') {
        res = await api.admin.whatsappSendVideo(selectedPhone, mediaUrl, galleryCaption);
      } else {
        res = await api.admin.whatsappSendImage(selectedPhone, mediaUrl, galleryCaption);
      }
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data as ChatMessage]);
        setActivePanel(null);
        setGalleryUri(null);
        setGalleryCaption('');
        setBotEnabled(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      } else {
        Toast.show({ type: 'error', title: 'Send Failed', message: res.message || 'Could not send media' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Send Failed', message: getErrorMessage(err) });
    } finally {
      setGalleryUploading(false);
    }
  };

  // ─── Catalog handlers ──────────────────────────────
  const handleCatalogOpen = async () => {
    setShowMenu(false);
    setActivePanel('catalog');
    if (catalogProducts.length > 0) return;
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await api.admin.whatsappCatalog({ limit: 50 });
      if (res.success && (res.data as any)?.products) {
        setCatalogProducts((res.data as any).products);
      } else {
        setCatalogError(res.message || 'Failed to load catalog');
      }
    } catch {
      setCatalogError('Failed to load catalog');
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleSendCatalogItem = async (product: CatalogProduct) => {
    if (!selectedPhone || sendingCatalog) return;
    setSendingCatalog(product.id);
    try {
      const res = await api.admin.whatsappSendCatalog(selectedPhone, product);
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data as ChatMessage]);
        setBotEnabled(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      } else {
        Toast.show({ type: 'error', title: 'Send Failed', message: res.message || 'Could not send catalog item' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', title: 'Send Failed', message: getErrorMessage(err) });
    } finally {
      setSendingCatalog(null);
    }
  };

  // ─── Quick Reply handlers ──────────────────────────
  const handleQuickReplyOpen = async () => {
    setShowMenu(false);
    setActivePanel('quickReply');
    setShowAddQR(false);
    setQuickReplyLoading(true);
    try {
      const res = await api.admin.quickReplies();
      if (res.success && res.data) {
        setQuickReplies(res.data as QuickReplyItem[]);
      }
    } catch { /* ignore */ } finally {
      setQuickReplyLoading(false);
    }
  };

  const handleSaveQuickReply = async () => {
    if (!newQRTitle.trim() || !newQRMessage.trim() || savingQR) return;
    setSavingQR(true);
    try {
      const res = await api.admin.createQuickReply({ title: newQRTitle.trim(), message: newQRMessage.trim() });
      if (res.success && res.data) {
        setQuickReplies(prev => [res.data as QuickReplyItem, ...prev]);
        setNewQRTitle('');
        setNewQRMessage('');
        setShowAddQR(false);
      }
    } catch { /* ignore */ } finally {
      setSavingQR(false);
    }
  };

  const handleDeleteQuickReply = (id: string) => {
    Alert.alert('Delete Quick Reply', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const res = await api.admin.deleteQuickReply(id);
            if (res.success) setQuickReplies(prev => prev.filter(r => r._id !== id));
          } catch { /* ignore */ }
        }
      },
    ]);
  };

  const handleUseQuickReply = (message: string) => {
    setReplyText(message);
    setActivePanel(null);
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 13 && phone.startsWith('880')) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`;
    }
    return `+${phone}`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatMessageDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.direction === 'incoming') {
      return msg.senderType === 'host' ? 'Host' : 'Customer';
    }
    if (msg.senderType === 'admin') return msg.adminName || 'Admin';
    return 'AI Bot';
  };

  const getSenderColor = (msg: ChatMessage) => {
    if (msg.direction === 'incoming') return WA_GREEN;
    if (msg.senderType === 'admin') return ADMIN_PURPLE;
    return BOT_BLUE;
  };

  if (loading && view === 'list' && conversations.length === 0) return <Loading message="Loading WhatsApp chats..." />;
  if (error && view === 'list' && conversations.length === 0) return <ErrorState title="Failed to Load" message={error} onRetry={() => { setLoading(true); loadConversations(true); }} />;

  // ─── CHAT DETAIL VIEW ────────────────────────────────────────────────
  if (view === 'detail') {
    return (
      <KeyboardAvoidingView
        style={S.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header with bot toggle */}
        <View style={S.detailHeader}>
          <View style={S.detailHeaderBg} />
          <View style={S.detailHeaderContent}>
            <TouchableOpacity onPress={goBack} style={S.backBtn} activeOpacity={0.7}>
              <Icon name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <View style={S.detailHeaderInfo}>
              <View style={S.waIconWrap}>
                <Icon name="logo-whatsapp" size={20} color={WA_GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.detailHeaderTitle}>{formatPhone(selectedPhone)}</Text>
                <Text style={S.detailHeaderSub}>{messages.length} messages</Text>
              </View>
            </View>
            {/* Bot toggle */}
            <TouchableOpacity
              onPress={toggleBot}
              disabled={togglingBot}
              style={[S.botToggle, botEnabled ? S.botToggleOn : S.botToggleOff]}
              activeOpacity={0.7}
            >
              {togglingBot ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Icon name={botEnabled ? 'flash' : 'flash-off'} size={16} color={Colors.white} />
                  <Text style={S.botToggleText}>{botEnabled ? 'AI On' : 'AI Off'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        {loading && messages.length === 0 ? (
          <Loading message="Loading messages..." />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            style={S.chatList}
            contentContainerStyle={S.chatListContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.3}
            onContentSizeChange={() => {
              if (messages.length > 0 && !loadingMore) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListHeaderComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.brand} style={{ paddingVertical: 10 }} /> : null}
            ListEmptyComponent={
              <View style={S.emptyWrap}>
                <Icon name="chatbubble-ellipses-outline" size={48} color={Colors.textSecondary} />
                <Text style={S.emptyText}>No messages yet</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const isOutgoing = item.direction === 'outgoing';
              const isAdmin = item.senderType === 'admin';
              const isSystem = item.messageType === 'system';
              const showDateHeader = index === 0 || formatMessageDate(item.createdAt) !== formatMessageDate(messages[index - 1]?.createdAt);

              if (isSystem) {
                return (
                  <>
                    {showDateHeader && (
                      <View style={S.dateBadge}>
                        <Text style={S.dateBadgeText}>{formatMessageDate(item.createdAt)}</Text>
                      </View>
                    )}
                    <View style={S.systemMsgWrap}>
                      <Text style={S.systemMsgText}>{item.content}</Text>
                    </View>
                  </>
                );
              }

              return (
                <>
                  {showDateHeader && (
                    <View style={S.dateBadge}>
                      <Text style={S.dateBadgeText}>{formatMessageDate(item.createdAt)}</Text>
                    </View>
                  )}
                  <View style={[S.msgRow, isOutgoing ? S.msgRowRight : S.msgRowLeft]}>
                    <View style={[
                      S.msgBubble,
                      isOutgoing
                        ? (isAdmin ? S.msgBubbleAdmin : S.msgBubbleBot)
                        : S.msgBubbleUser
                    ]}>
                      <Text style={[S.msgSender, { color: getSenderColor(item) }]}>
                        {getSenderLabel(item)}
                      </Text>
                      <Text style={[S.msgText, isOutgoing ? S.msgTextBot : S.msgTextUser]}>
                        {item.content}
                      </Text>
                      <View style={S.msgFooter}>
                        <Text style={[S.msgTime, isOutgoing ? S.msgTimeBot : S.msgTimeUser]}>
                          {formatMessageTime(item.createdAt)}
                        </Text>
                      </View>
                      {isAdmin && item.adminName && (
                        <Text style={S.adminLabel}>— {item.adminName}</Text>
                      )}
                    </View>
                  </View>
                </>
              );
            }}
          />
        )}

        {/* Attachment Panel */}
        {activePanel && (
          <View style={S.panelContainer}>
            {/* Gallery Panel */}
            {activePanel === 'gallery' && galleryUri && (
              <View style={S.panelInner}>
                <View style={S.panelHeader}>
                  <View style={S.panelTitleRow}>
                    <Icon name="image-outline" size={18} color={BOT_BLUE} />
                    <Text style={S.panelTitle}>Gallery</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setActivePanel(null); setGalleryUri(null); }}>
                    <Icon name="close" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={S.galleryPreview}>
                  <Image source={{ uri: galleryUri }} style={S.galleryImage} resizeMode="contain" />
                </View>
                <TextInput
                  style={S.galleryCaptionInput}
                  placeholder="Add a caption (optional)..."
                  placeholderTextColor={Colors.textSecondary}
                  value={galleryCaption}
                  onChangeText={setGalleryCaption}
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[S.panelSendBtn, galleryUploading && S.panelSendBtnDisabled]}
                  onPress={handleGallerySend}
                  disabled={galleryUploading}
                  activeOpacity={0.7}
                >
                  {galleryUploading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Icon name="send" size={16} color={Colors.white} />
                      <Text style={S.panelSendText}>Send {galleryType === 'video' ? 'Video' : 'Image'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Catalog Panel */}
            {activePanel === 'catalog' && (
              <View style={S.panelInner}>
                <View style={S.panelHeader}>
                  <View style={S.panelTitleRow}>
                    <Icon name="bag-outline" size={18} color={WA_GREEN} />
                    <Text style={S.panelTitle}>WhatsApp Catalog</Text>
                  </View>
                  <TouchableOpacity onPress={() => setActivePanel(null)}>
                    <Icon name="close" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {catalogLoading ? (
                  <View style={S.panelCenter}>
                    <ActivityIndicator size="small" color={Colors.brand} />
                    <Text style={S.panelCenterText}>Loading catalog...</Text>
                  </View>
                ) : catalogError ? (
                  <View style={S.panelCenter}>
                    <Text style={S.panelErrorText}>{catalogError}</Text>
                    <TouchableOpacity onPress={handleCatalogOpen} style={S.panelRetryBtn}>
                      <Text style={S.panelRetryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : catalogProducts.length === 0 ? (
                  <View style={S.panelCenter}>
                    <Text style={S.panelCenterText}>No products in catalog</Text>
                  </View>
                ) : (
                  <ScrollView horizontal={false} style={S.catalogGrid} contentContainerStyle={S.catalogGridContent}>
                    {catalogProducts.map((product) => (
                      <View key={product.id} style={S.catalogCard}>
                        {product.image_url ? (
                          <Image source={{ uri: product.image_url }} style={S.catalogImage} resizeMode="cover" />
                        ) : (
                          <View style={[S.catalogImage, S.catalogImagePlaceholder]}>
                            <Icon name="bag-outline" size={24} color={Colors.textSecondary} />
                          </View>
                        )}
                        <View style={S.catalogInfo}>
                          <Text style={S.catalogName} numberOfLines={2}>{product.name}</Text>
                          {product.price ? <Text style={S.catalogPrice}>{product.price}</Text> : null}
                          <TouchableOpacity
                            style={[S.catalogSendBtn, sendingCatalog === product.id && S.catalogSendBtnDisabled]}
                            onPress={() => handleSendCatalogItem(product)}
                            disabled={!!sendingCatalog}
                            activeOpacity={0.7}
                          >
                            {sendingCatalog === product.id ? (
                              <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                              <>
                                <Icon name="send" size={12} color={Colors.white} />
                                <Text style={S.catalogSendText}>Send</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Quick Reply Panel */}
            {activePanel === 'quickReply' && (
              <View style={S.panelInner}>
                <View style={S.panelHeader}>
                  <View style={S.panelTitleRow}>
                    <Icon name="chatbox-outline" size={18} color={ADMIN_PURPLE} />
                    <Text style={S.panelTitle}>Quick Replies</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => setShowAddQR(!showAddQR)}>
                      <Icon name="add-circle-outline" size={22} color={WA_GREEN} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActivePanel(null)}>
                      <Icon name="close" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {showAddQR && (
                  <View style={S.addQRBox}>
                    <TextInput
                      style={S.addQRInput}
                      placeholder="Title (e.g. Greeting)"
                      placeholderTextColor={Colors.textSecondary}
                      value={newQRTitle}
                      onChangeText={setNewQRTitle}
                      maxLength={100}
                    />
                    <TextInput
                      style={[S.addQRInput, { height: 60 }]}
                      placeholder="Message content..."
                      placeholderTextColor={Colors.textSecondary}
                      value={newQRMessage}
                      onChangeText={setNewQRMessage}
                      multiline
                      maxLength={4096}
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[S.addQRSaveBtn, (!newQRTitle.trim() || !newQRMessage.trim() || savingQR) && S.panelSendBtnDisabled]}
                        onPress={handleSaveQuickReply}
                        disabled={!newQRTitle.trim() || !newQRMessage.trim() || savingQR}
                        activeOpacity={0.7}
                      >
                        {savingQR ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <Text style={S.addQRSaveText}>Save</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={S.addQRCancelBtn}
                        onPress={() => { setShowAddQR(false); setNewQRTitle(''); setNewQRMessage(''); }}
                        activeOpacity={0.7}
                      >
                        <Text style={S.addQRCancelText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {quickReplyLoading ? (
                  <View style={S.panelCenter}>
                    <ActivityIndicator size="small" color={Colors.brand} />
                  </View>
                ) : quickReplies.length === 0 ? (
                  <View style={S.panelCenter}>
                    <Text style={S.panelCenterText}>No quick replies saved yet</Text>
                  </View>
                ) : (
                  <ScrollView style={S.qrList} contentContainerStyle={{ paddingBottom: 8 }}>
                    {quickReplies.map((qr) => (
                      <TouchableOpacity
                        key={qr._id}
                        style={S.qrItem}
                        onPress={() => handleUseQuickReply(qr.message)}
                        activeOpacity={0.7}
                      >
                        <View style={S.qrItemContent}>
                          <Text style={S.qrItemTitle}>{qr.title}</Text>
                          <Text style={S.qrItemMessage} numberOfLines={2}>{qr.message}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteQuickReply(qr._id)}
                          style={S.qrDeleteBtn}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Icon name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        )}

        {/* Reply Input Bar */}
        <View style={S.replyBar}>
          {/* 3-dot menu button */}
          <View>
            <TouchableOpacity
              style={S.menuBtn}
              onPress={() => setShowMenu(!showMenu)}
              activeOpacity={0.7}
            >
              <Icon name="ellipsis-vertical" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showMenu && (
              <View style={S.menuPopup}>
                <TouchableOpacity style={S.menuItem} onPress={handleGalleryOpen} activeOpacity={0.7}>
                  <Icon name="image-outline" size={18} color={BOT_BLUE} />
                  <Text style={S.menuItemText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.menuItem} onPress={handleCatalogOpen} activeOpacity={0.7}>
                  <Icon name="bag-outline" size={18} color={WA_GREEN} />
                  <Text style={S.menuItemText}>Catalog</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.menuItem} onPress={handleQuickReplyOpen} activeOpacity={0.7}>
                  <Icon name="chatbox-outline" size={18} color={ADMIN_PURPLE} />
                  <Text style={S.menuItemText}>Quick Reply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TextInput
            style={S.replyInput}
            placeholder={botEnabled ? 'Send a reply (will stop AI)...' : 'Type your reply...'}
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
      </KeyboardAvoidingView>
    );
  }

  // ─── CONVERSATIONS LIST VIEW ─────────────────────────────────────────
  return (
    <View style={S.root}>
      {/* Hero Header */}
      <View style={S.heroWrapper}>
        <View style={S.heroBg} />
        <View style={S.heroCircle1} />
        <View style={S.heroCircle2} />
        <View style={S.heroContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn} activeOpacity={0.7}>
            <Icon name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={S.heroTitleRow}>
            <View style={S.waHeaderIcon}>
              <Icon name="logo-whatsapp" size={26} color={WA_GREEN} />
            </View>
            <View>
              <Text style={S.heroTitle}>WhatsApp Chats</Text>
              <Text style={S.heroSub}>{conversations.length} conversations</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.customerNumber}
        style={S.list}
        contentContainerStyle={S.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        onEndReached={loadMoreConversations}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.brand} style={{ paddingVertical: 16 }} /> : null}
        ListEmptyComponent={
          <View style={S.emptyWrap}>
            <Icon name="chatbubble-ellipses-outline" size={52} color={Colors.textSecondary} />
            <Text style={S.emptyTitle}>No Conversations Yet</Text>
            <Text style={S.emptyText}>WhatsApp chats will appear here once customers start messaging.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isBot = item.lastSenderType === 'bot';
          const isAdminMsg = item.lastSenderType === 'admin';
          return (
            <TouchableOpacity
              style={S.convCard}
              activeOpacity={0.7}
              onPress={() => openConversation(item.customerNumber)}
            >
              <View style={S.convLeft}>
                <View style={S.convAvatar}>
                  <Icon name="person" size={22} color={Colors.white} />
                </View>
              </View>
              <View style={S.convCenter}>
                <Text style={S.convPhone}>{formatPhone(item.customerNumber)}</Text>
                <View style={S.convPreviewRow}>
                  {item.lastDirection === 'outgoing' && (
                    <Icon name="checkmark-done-outline" size={14} color={isAdminMsg ? ADMIN_PURPLE : BOT_BLUE} style={{ marginRight: 4 }} />
                  )}
                  <Text style={S.convPreview} numberOfLines={1}>
                    {isAdminMsg ? '👤 ' : isBot ? '🤖 ' : ''}{item.lastMessage || 'No messages'}
                  </Text>
                </View>
              </View>
              <View style={S.convRight}>
                <Text style={S.convTime}>{formatTime(item.lastMessageAt)}</Text>
                <View style={S.convBadge}>
                  <Text style={S.convBadgeText}>{item.totalMessages}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  // ─── Hero Header ───────────────────────────────────
  heroWrapper: { overflow: 'visible' },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: ADMIN_BG,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(37,211,102,0.10)', top: -40, right: -30,
  },
  heroCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(59,130,246,0.08)', top: 20, left: -30,
  },
  heroContent: {
    paddingTop: STATUS_H + 12,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  waHeaderIcon: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  heroTitle: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 1 },

  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ─── Conversations List ────────────────────────────
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 12 },

  convCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  convLeft: { marginRight: 12 },
  convAvatar: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: WA_GREEN, alignItems: 'center', justifyContent: 'center',
  },
  convCenter: { flex: 1, marginRight: 8 },
  convPhone: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary, marginBottom: 3 },
  convPreviewRow: { flexDirection: 'row', alignItems: 'center' },
  convPreview: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  convRight: { alignItems: 'flex-end' },
  convTime: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  convBadge: {
    backgroundColor: WA_GREEN, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: 'center',
  },
  convBadgeText: { fontSize: 11, fontWeight: Theme.fontWeight.bold, color: Colors.white },

  // ─── Detail Header ─────────────────────────────────
  detailHeader: { overflow: 'visible' },
  detailHeaderBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: ADMIN_BG,
  },
  detailHeaderContent: {
    paddingTop: STATUS_H + 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  detailHeaderInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 14, flex: 1 },
  waIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: GLASS_LIGHT, borderWidth: 1, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  detailHeaderTitle: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  detailHeaderSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  // Bot toggle
  botToggle: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6,
    marginLeft: 8,
  },
  botToggleOn: { backgroundColor: 'rgba(37,211,102,0.35)' },
  botToggleOff: { backgroundColor: 'rgba(239,68,68,0.35)' },
  botToggleText: {
    fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.white, marginLeft: 4,
  },

  // ─── Chat Messages ─────────────────────────────────
  chatList: { flex: 1, backgroundColor: '#ECE5DD' },
  chatListContent: { padding: 12, paddingBottom: 8 },

  dateBadge: {
    alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginVertical: 10,
  },
  dateBadgeText: { fontSize: 11, color: '#555', fontWeight: Theme.fontWeight.medium },

  systemMsgWrap: {
    alignSelf: 'center', backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginVertical: 6,
  },
  systemMsgText: { fontSize: 12, color: ADMIN_PURPLE, fontWeight: Theme.fontWeight.medium, textAlign: 'center' },

  msgRow: { marginBottom: 4, maxWidth: '82%' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },

  msgBubble: {
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 4,
    ...Theme.shadows.sm,
  },
  msgBubbleUser: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 4,
  },
  msgBubbleBot: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },
  msgBubbleAdmin: {
    backgroundColor: '#EDE9FE',
    borderTopRightRadius: 4,
  },

  msgSender: { fontSize: 11, fontWeight: Theme.fontWeight.bold, marginBottom: 2 },

  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextUser: { color: Colors.textPrimary },
  msgTextBot: { color: Colors.textPrimary },

  msgFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 3 },
  msgTime: { fontSize: 10 },
  msgTimeUser: { color: Colors.textSecondary },
  msgTimeBot: { color: 'rgba(0,0,0,0.4)' },

  adminLabel: {
    fontSize: 10, color: ADMIN_PURPLE, fontWeight: Theme.fontWeight.medium,
    marginTop: 2, fontStyle: 'italic',
  },

  // ─── Reply Bar ─────────────────────────────────────
  replyBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: Colors.white,
    paddingHorizontal: 8, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  replyInput: {
    flex: 1, backgroundColor: '#F1F5F9',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary,
    maxHeight: 100, marginRight: 8,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: WA_GREEN,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#A8D8B9' },

  // ─── 3-dot Menu ────────────────────────────────────
  menuBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  menuPopup: {
    position: 'absolute', bottom: 48, left: 0,
    backgroundColor: Colors.white,
    borderRadius: 16, paddingVertical: 4,
    width: 170,
    ...Theme.shadows.md,
    borderWidth: 1, borderColor: Colors.gray100,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  menuItemText: {
    fontSize: 14, color: Colors.textPrimary, fontWeight: Theme.fontWeight.medium,
  },

  // ─── Attachment Panel ──────────────────────────────
  panelContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
    maxHeight: 300,
  },
  panelInner: {
    padding: 14,
  },
  panelHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  panelCenter: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  panelCenterText: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
  panelErrorText: { fontSize: 13, color: '#EF4444', marginBottom: 8 },
  panelRetryBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.gray100 },
  panelRetryText: { fontSize: 13, color: Colors.textPrimary, fontWeight: Theme.fontWeight.medium },
  panelSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: WA_GREEN, borderRadius: 12, paddingVertical: 10, gap: 8, marginTop: 10,
  },
  panelSendBtnDisabled: { opacity: 0.6 },
  panelSendText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.white },

  // Gallery
  galleryPreview: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', height: 120,
  },
  galleryImage: { width: '100%', height: 120, borderRadius: 12 },
  galleryCaptionInput: {
    backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 13, color: Colors.textPrimary, marginTop: 10,
  },

  // Catalog
  catalogGrid: { maxHeight: 200 },
  catalogGridContent: { gap: 10 },
  catalogCard: {
    flexDirection: 'row', backgroundColor: '#F8FAFC',
    borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gray100,
  },
  catalogImage: { width: 80, height: 80 },
  catalogImagePlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  catalogInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  catalogName: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textPrimary },
  catalogPrice: { fontSize: 12, color: WA_GREEN, fontWeight: Theme.fontWeight.medium, marginTop: 2 },
  catalogSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: WA_GREEN, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10,
    gap: 4, alignSelf: 'flex-start', marginTop: 4,
  },
  catalogSendBtnDisabled: { opacity: 0.6 },
  catalogSendText: { fontSize: 11, fontWeight: Theme.fontWeight.semibold, color: Colors.white },

  // Quick Reply
  qrList: { maxHeight: 180 },
  qrItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.gray100, marginBottom: 8,
  },
  qrItemContent: { flex: 1 },
  qrItemTitle: { fontSize: 13, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginBottom: 2 },
  qrItemMessage: { fontSize: 12, color: Colors.textSecondary },
  qrDeleteBtn: { padding: 6 },
  addQRBox: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.gray100,
  },
  addQRInput: {
    backgroundColor: Colors.white, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 13, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.gray200,
    marginBottom: 8,
  },
  addQRSaveBtn: {
    backgroundColor: WA_GREEN, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  addQRSaveText: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.white },
  addQRCancelBtn: {
    backgroundColor: Colors.gray100, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  addQRCancelText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.textSecondary },

  // ─── Empty State ───────────────────────────────────
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, marginTop: 14 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },
});
