import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';

interface MessageMetadata {
  action?: 'booking_request' | 'booking_approved' | 'payment_required' | 'booking_rejected';
  bookingId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  amount?: number;
  roomTitle?: string;
  guestName?: string;
  hostName?: string;
}

interface Message {
  _id: string;
  text: string;
  senderRole: 'guest' | 'host' | 'admin' | 'system';
  type?: 'user' | 'system';
  metadata?: MessageMetadata;
  createdAt: string;
  blocked?: boolean;
}

interface Booking {
  _id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  amountTk: number;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export default function ChatScreen({ route, navigation }: any) {
  const { roomId, roomTitle, hostId, hostName, bookingId, threadId: initialThreadId, userId: paramUserId } = route.params || {};
  const { user } = useAuth();
  
  // Use userId from params if available, otherwise use user._id (normalized by AuthContext)
  const userId = paramUserId || user?._id;
  
    // Log params for debugging
    useEffect(() => {
      console.log('📋 ChatScreen params:', {
        roomId,
        roomTitle,
        hostId,
        hostName,
        bookingId,
        initialThreadId,
        paramUserId,
        userRole: user?.role,
        userId: userId,
        userObject: user,
      });
    }, []);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId || null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [approvingBooking, setApprovingBooking] = useState(false);
  const [rejectingBooking, setRejectingBooking] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const isHost = user?.role === 'host';
  const isGuest = user?.role === 'guest' || (!isHost && user?.role !== 'admin');

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (bookingId) {
      console.log('📥 ChatScreen: Loading booking with ID:', bookingId);
      console.log('👤 User role:', user?.role, 'isHost:', isHost);
      loadBooking();
    } else {
      console.log('⚠️ ChatScreen: No bookingId provided');
    }
  }, [bookingId]);

  // Reload booking when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (bookingId) {
        console.log('🔄 Screen focused, reloading booking...');
        loadBooking();
      }
    }, [bookingId])
  );

  // Poll for booking updates if booking is pending
  useEffect(() => {
    if (!bookingId || !booking || booking.status !== 'pending') return;
    
    const interval = setInterval(() => {
      console.log('🔄 Polling for booking updates...');
      loadBooking();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [bookingId, booking?.status]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!threadId) return;
    
    const interval = setInterval(() => {
      loadMessages(threadId, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [threadId]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      console.log('🔄 initializeChat: Starting chat initialization:', {
        hasInitialThreadId: !!initialThreadId,
        hasRoomId: !!roomId,
        hasHostId: !!hostId,
        hasUserId: !!userId,
        hasParamUserId: !!paramUserId,
        hasUserObject: !!user,
        userRole: user?.role,
      });

      // If we have threadId, just load messages
      if (initialThreadId) {
        console.log('✅ Using provided threadId:', initialThreadId);
        setThreadId(initialThreadId);
        await loadMessages(initialThreadId);
        return;
      }

      // Otherwise, try to find or create thread
      console.log('🔍 Searching for existing thread...');
      const threadResponse = await api.chat.getThreads({ page: 1, limit: 100 });
      
      console.log('📦 getThreads response:', {
        success: threadResponse.success,
        hasData: !!threadResponse.data,
      });

      if (threadResponse.success && threadResponse.data) {
        const threads = (threadResponse.data as any).threads || [];
        console.log(`📋 Found ${threads.length} threads`);
        
        // Find thread for this room and host/user combination
        const existingThread = threads.find((t: any) => {
          const threadRoomId = t.roomId?._id || t.roomId;
          const matchesRoom = threadRoomId === roomId || threadRoomId?.toString() === roomId?.toString();
          
          // Also check host/user match
          if (matchesRoom) {
            if (isHost) {
              const threadHostId = t.hostId?._id || t.hostId;
              return threadHostId?.toString() === hostId?.toString();
            } else {
              const threadUserId = t.userId?._id || t.userId;
              return threadUserId?.toString() === userId?.toString();
            }
          }
          return false;
        });

        if (existingThread) {
          const foundThreadId = existingThread._id || existingThread.id;
          console.log('✅ Found existing thread:', foundThreadId);
          setThreadId(foundThreadId);
          await loadMessages(foundThreadId);
        } else {
          console.log('📝 No existing thread found, creating new one...');
          // Create new thread
          await createThread();
        }
      } else {
        console.log('⚠️ Failed to get threads, creating new one...');
        await createThread();
      }
    } catch (error: any) {
      console.error('❌ initializeChat: Failed to initialize chat:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
      });
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const createThread = async () => {
    if (!roomId || !hostId || !userId) {
      console.error('❌ createThread: Missing required data:', {
        hasRoomId: !!roomId,
        hasHostId: !!hostId,
        hasUserId: !!userId,
        paramUserId,
        userId: user?._id,
      });
      Alert.alert('Error', 'Missing information to create chat thread. Please try logging in again.');
      return;
    }

    try {
      console.log('🔄 createThread: Creating thread with:', {
        roomId,
        userId: userId,
        hostId,
      });

      const response = await api.chat.createThread({
        roomId,
        userId: userId,
        hostId,
      });

      console.log('📦 createThread response:', {
        success: response.success,
        hasData: !!response.data,
        data: response.data,
      });

      if (response.success && response.data) {
        const newThreadId = (response.data as any).id || (response.data as any)._id;
        console.log('✅ Thread created successfully:', newThreadId);
        setThreadId(newThreadId);
        setMessages([]);
        
        // Load messages for the new thread
        if (newThreadId) {
          await loadMessages(newThreadId);
        }
      } else {
        console.error('❌ createThread failed:', response.message || response.error);
        Alert.alert('Error', response.message || 'Failed to create chat thread');
      }
    } catch (error: any) {
      console.error('❌ createThread: Exception caught:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to create chat thread');
    }
  };

  const loadMessages = async (tid: string, silent = false) => {
    if (!tid) {
      console.warn('⚠️ loadMessages: No threadId provided');
      return;
    }

    try {
      if (!silent) setLoading(true);

      console.log('📥 loadMessages: Loading messages for thread:', tid);
      const response = await api.chat.getMessages(tid, { page: 1, limit: 100 });
      
      console.log('📦 loadMessages response:', {
        success: response.success,
        hasData: !!response.data,
        responseType: typeof response,
      });

      if (response.success && response.data) {
        const msgs = (response.data as any).messages || [];
        console.log(`✅ Loaded ${msgs.length} messages`);
        setMessages(msgs); // Keep messages in chronological order (oldest first, newest last)
      } else {
        console.warn('⚠️ loadMessages: No messages found or failed:', response.message);
      }
    } catch (error: any) {
      console.error('❌ loadMessages: Failed to load messages:', error);
      if (!silent) {
        Toast.show({ type: 'error', title: 'Failed to Load Messages', message: getErrorMessage(error) });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadBooking = async () => {
    if (!bookingId) {
      console.log('⚠️ loadBooking: No bookingId provided');
      return;
    }

    try {
      console.log('📥 loadBooking: Fetching booking:', bookingId);
      const response = await api.bookings.get(bookingId);
      
      // SECURITY: Only log safe fields — do NOT dump full response (may contain phone/address after payment)
      console.log('📦 loadBooking: Response received, success:', response?.success);

      // Handle different response formats
      let bookingData: Booking | null = null;
      
      if (response && typeof response === 'object') {
        // Check if response has success property (ApiResponse format)
        if ('success' in response) {
          if (response.success && response.data) {
            bookingData = response.data as Booking;
          } else {
            console.error('❌ loadBooking: API returned success=false:', response.message || response.error);
            return;
          }
        } 
        // Check if response is direct booking object (has _id)
        else if ('_id' in response) {
          bookingData = response as Booking;
        }
        // Fallback: handle unexpected response shapes
        else {
          const anyResponse = response as any;
          if (anyResponse.data) {
            bookingData = anyResponse.data as Booking;
          } else if (anyResponse.booking) {
            bookingData = anyResponse.booking as Booking;
          } else if (anyResponse.bookingId) {
            console.warn('⚠️ loadBooking: Only bookingId returned, not full booking object');
          }
        }
      }

      if (bookingData && bookingData._id) {
        console.log('✅ loadBooking: Booking loaded successfully:', {
          id: bookingData._id,
          status: bookingData.status,
          paymentStatus: bookingData.paymentStatus,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          amountTk: bookingData.amountTk,
        });
        setBooking(bookingData);
      } else {
        console.warn('⚠️ loadBooking: Could not extract booking data from response');
        console.warn('Response structure:', Object.keys(response || {}));
      }
    } catch (error: any) {
      console.error('❌ loadBooking: Failed to load booking:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      // Don't show alert here as it's called frequently (polling)
      // Just log the error
    }
  };

  const handleSendMessage = async () => {
    const trimmedText = messageText.trim();
    
    if (!trimmedText) {
      console.warn('⚠️ handleSendMessage: Empty message text');
      return;
    }

    if (!threadId) {
      console.error('❌ handleSendMessage: No threadId available');
      Alert.alert('Error', 'Chat thread not initialized. Please try again.');
      
      // Try to initialize thread if we have roomId
      if (roomId && hostId && userId) {
        console.log('🔄 Attempting to create thread...');
        await createThread();
      }
      return;
    }

    console.log('📤 handleSendMessage: Sending message:', {
      threadId,
      text: trimmedText.substring(0, 50) + '...',
      isHost,
      senderRole: isHost ? 'host' : 'guest',
    });

    const tempMessage: Message = {
      _id: Date.now().toString(),
      text: trimmedText,
      senderRole: isHost ? 'host' : 'guest',
      createdAt: new Date().toISOString(),
    };

    // Optimistically add message
    setMessages(prev => [...prev, tempMessage]);
    const messageTextToSend = trimmedText;
    setMessageText('');
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setSending(true);
      
      // Prepare message data - include roomId, userId, hostId as fallback
      const messageData: any = {
        threadId,
        text: messageTextToSend,
      };

      // Add fallback data in case threadId lookup fails on backend
      if (roomId) messageData.roomId = roomId;
      if (userId) messageData.userId = userId;
      if (hostId) messageData.hostId = hostId;

      console.log('📦 Sending message data:', {
        threadId: messageData.threadId,
        hasRoomId: !!messageData.roomId,
        hasUserId: !!messageData.userId,
        hasHostId: !!messageData.hostId,
      });

      const response = await api.chat.sendMessage(messageData);

      console.log('📥 Message send response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        error: response.error,
      });

      if (response.success) {
        console.log('✅ Message sent successfully');
        // Reload messages to get the real one from server
        await loadMessages(threadId, true);
      } else {
        // Remove temp message on failure
        setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
        const errorMsg = response.message || response.error || 'Failed to send message';
        console.error('❌ Message send failed:', errorMsg);
        Alert.alert('Error', errorMsg);
      }
    } catch (error: any) {
      console.error('❌ handleSendMessage: Exception caught:', error);
      
      // Remove temp message on failure
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      
      Toast.show({ type: 'error', title: 'Message Not Sent', message: getErrorMessage(error) });
    } finally {
      setSending(false);
    }
  };

  const handleApproveBooking = async () => {
    if (!bookingId) {
      console.warn('⚠️ handleApproveBooking: No bookingId');
      return;
    }

    Alert.alert(
      'Approve Booking',
      'Are you sure you want to approve this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setApprovingBooking(true);
              console.log('✅ Approving booking:', bookingId);
              const response = await api.bookings.approve(bookingId);
              
              console.log('📦 Approve response:', response);
              
              if (response.success) {
                Alert.alert('Success', 'Booking approved successfully!');
                // Reload booking to update status
                await loadBooking();
              } else {
                Alert.alert('Error', response.message || 'Failed to approve booking');
              }
            } catch (error: any) {
              console.error('❌ Failed to approve booking:', error);
              Alert.alert('Error', error.message || 'Failed to approve booking');
            } finally {
              setApprovingBooking(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = async () => {
    if (!bookingId) {
      console.warn('⚠️ handleRejectBooking: No bookingId');
      return;
    }

    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setRejectingBooking(true);
              console.log('❌ Rejecting booking:', bookingId);
              const response = await api.bookings.reject(bookingId);
              
              console.log('📦 Reject response:', response);
              
              if (response.success) {
                Alert.alert('Success', 'Booking rejected');
                // Reload booking to update status
                await loadBooking();
              } else {
                Alert.alert('Error', response.message || 'Failed to reject booking');
              }
            } catch (error: any) {
              console.error('❌ Failed to reject booking:', error);
              Alert.alert('Error', error.message || 'Failed to reject booking');
            } finally {
              setRejectingBooking(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmAndPay = () => {
    if (!bookingId || !booking) return;

    navigation.navigate('Payment', {
      bookingId,
      amount: booking.amountTk,
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // ---- System Message Rendering ----
    if (item.type === 'system' || item.senderRole === 'system') {
      const meta = item.metadata;
      const isApproval = meta?.action === 'payment_required' || meta?.action === 'booking_approved';
      const isRejection = meta?.action === 'booking_rejected';
      const isRequest = meta?.action === 'booking_request';

      const headerBgColor = isApproval
        ? '#f0fdf4'
        : isRejection
        ? '#fef2f2'
        : isRequest
        ? '#eff6ff'
        : '#f9fafb';

      const headerTextColor = isApproval
        ? '#166534'
        : isRejection
        ? '#991b1b'
        : isRequest
        ? '#1e40af'
        : '#6b7280';

      const headerIconName = isApproval ? 'checkmark-circle' : isRejection ? 'close-circle' : isRequest ? 'clipboard-outline' : 'information-circle-outline';
      const lines = item.text.split('\n');
      const headerText = lines[0];
      const bodyText = lines.slice(1).filter(l => l.trim()).join('\n');

      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageCard}>
            {/* Header */}
            <View style={[styles.systemMessageHeader, { backgroundColor: headerBgColor }]}>
              <Icon name={headerIconName} size={14} color={headerTextColor} style={styles.systemMessageIcon} />
              <Text style={[styles.systemMessageHeaderText, { color: headerTextColor }]}>
                {headerText}
              </Text>
            </View>

            {/* Body */}
            {bodyText ? (
              <View style={styles.systemMessageBody}>
                <Text style={styles.systemMessageBodyText}>{bodyText}</Text>
              </View>
            ) : null}

            {/* Payment CTA */}
            {(meta?.action === 'payment_required') && meta?.bookingId && (
              <View style={styles.systemMessageAction}>
                <TouchableOpacity
                  style={styles.paymentButton}
                  onPress={() => {
                    navigation.navigate('Payment', {
                      bookingId: meta.bookingId,
                      amount: meta.amount || 0,
                    });
                  }}
                >
                  <Text style={styles.paymentButtonText}>💳 Complete Payment</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Timestamp */}
            <Text style={styles.systemMessageTime}>
              {new Date(item.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      );
    }

    // ---- Regular User Message Rendering ----
    const isMine = (isHost && item.senderRole === 'host') || (isGuest && item.senderRole === 'guest');
    
    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
            {item.blocked ? '[Message blocked - contains contact information]' : item.text}
          </Text>
          <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.theirMessageTime]}>
            {new Date(item.createdAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View>
        {/* Booking Request Info */}
        {roomTitle && (
          <View style={styles.requestInfo}>
            <Text style={styles.requestTitle}>
              {isGuest ? '📝 You requested to book' : '📝 Booking request for'}
            </Text>
            <Text style={styles.propertyName}>{roomTitle}</Text>
          </View>
        )}

        {/* Booking Details */}
        {booking && bookingId && (
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingInfoTitle}>Booking Details</Text>
            <Text style={styles.bookingInfoText}>
              Check-in: {new Date(booking.checkIn).toLocaleDateString()} • 
              Check-out: {new Date(booking.checkOut).toLocaleDateString()}
            </Text>
            <Text style={styles.bookingInfoText}>
              Guests: {booking.guests} • Total: ৳{booking.amountTk.toLocaleString()}
            </Text>
            <Text style={[styles.bookingStatus, getStatusStyle(booking.status)]}>
              Status: {booking.status.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: Colors.warning };
      case 'confirmed':
        return { color: Colors.success };
      case 'cancelled':
      case 'rejected':
        return { color: Colors.error };
      default:
        return { color: Colors.textSecondary };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messageList}
          ListHeaderComponent={renderHeader}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Action Buttons */}
        {booking && bookingId ? (
          <View style={styles.actionsContainer}>
            {/* Host: Show Accept/Reject buttons if booking is pending */}
            {isHost && booking.status === 'pending' && (
              <>
                <Button
                  title="Accept Booking"
                  onPress={handleApproveBooking}
                  loading={approvingBooking}
                  style={styles.actionButton}
                />
                <Button
                  title="Reject Booking"
                  onPress={handleRejectBooking}
                  loading={rejectingBooking}
                  variant="outline"
                  style={styles.actionButton}
                />
              </>
            )}

            {/* Guest: Show Confirm & Pay button if booking is confirmed but unpaid */}
            {isGuest && booking.status === 'confirmed' && booking.paymentStatus === 'unpaid' && (
              <Button
                title={`Confirm & Pay - ৳${booking.amountTk.toLocaleString()}`}
                onPress={handleConfirmAndPay}
                style={styles.actionButton}
              />
            )}

            {/* Show payment successful message */}
            {booking.paymentStatus === 'paid' && (
              <View style={styles.paidBanner}>
                <Text style={styles.paidBannerText}>✓ Payment Successful</Text>
              </View>
            )}
          </View>
        ) : bookingId ? (
          <View style={styles.actionsContainer}>
            <Text style={styles.loadingText}>Loading booking details...</Text>
          </View>
        ) : null}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F4F8' },
  messageList: { padding: 14 },
  requestInfo: {
    backgroundColor: '#EFF6FF', padding: 14, borderRadius: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#BFDBFE',
  },
  requestTitle: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginBottom: 4 },
  propertyName: { fontSize: 16, color: Colors.textPrimary, fontWeight: '700', letterSpacing: -0.2 },
  bookingInfo: {
    backgroundColor: Colors.white, padding: 14, borderRadius: 16,
    marginBottom: 14, borderWidth: 1, borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  bookingInfoTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  bookingInfoText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  bookingStatus: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  messageContainer: { marginBottom: 8, flexDirection: 'row' },
  myMessage: { justifyContent: 'flex-end' },
  theirMessage: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  myBubble: { backgroundColor: Colors.brand, borderBottomRightRadius: 6 },
  theirBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: Colors.gray200 },
  messageText: { fontSize: 15, lineHeight: 21 },
  myMessageText: { color: Colors.white },
  theirMessageText: { color: Colors.textPrimary },
  messageTime: { fontSize: 10, marginTop: 4 },
  myMessageTime: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  theirMessageTime: { color: Colors.textTertiary, textAlign: 'left' },
  actionsContainer: {
    padding: 14, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  actionButton: { marginBottom: 8 },
  paidBanner: {
    backgroundColor: '#ECFDF5', padding: 14, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0',
  },
  paidBannerText: { color: Colors.success, fontSize: 15, fontWeight: '700' },
  loadingText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', padding: 14 },
  inputContainer: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray100,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: Colors.gray50, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, marginRight: 10,
    fontSize: 15, color: Colors.textPrimary, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.gray200,
  },
  sendButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.brand, justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: Colors.gray300 },
  sendButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  systemMessageContainer: { alignItems: 'center', marginVertical: 10, paddingHorizontal: 4 },
  systemMessageCard: {
    width: '95%', borderRadius: 16, borderWidth: 1,
    borderColor: Colors.gray200, backgroundColor: Colors.white, overflow: 'hidden',
    ...Theme.shadows.sm,
  },
  systemMessageHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  systemMessageIcon: { marginRight: 8 },
  systemMessageHeaderText: { fontSize: 13, fontWeight: '700', flex: 1 },
  systemMessageBody: { paddingHorizontal: 14, paddingVertical: 12 },
  systemMessageBodyText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  systemMessageAction: { paddingHorizontal: 14, paddingBottom: 14 },
  paymentButton: { backgroundColor: Colors.brand, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  paymentButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  systemMessageTime: { fontSize: 10, color: Colors.textTertiary, paddingHorizontal: 14, paddingBottom: 8 },
});
