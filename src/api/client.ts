/**
 * API Client for React Native
 * Uses react-native-keychain for secure token storage
 * Includes automatic access token refresh via interceptor
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

// Keychain service identifiers
const ACCESS_TOKEN_SERVICE = 'com.gowaay.accessToken';
const REFRESH_TOKEN_SERVICE = 'com.gowaay.refreshToken';
const CREDENTIALS_SERVICE = 'com.gowaay.savedCredentials';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | any;
  errors?: Array<{ field: string; message: string }>;
}

class ApiClient {
  public client: AxiosInstance;
  private baseURL: string;
  private refreshPromise: Promise<string | null> | null = null;
  public onForceLogout?: () => void; // Called when refresh fails — forces logout

  constructor() {
    this.baseURL = API_BASE_URL;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // ── Request interceptor: attach access token ──────────────────────
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ── Response interceptor: auto-refresh on 401 ────────────────────
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh for 401 errors, and only once per request
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const newToken = await this.refreshAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          }

          // Refresh failed — force logout
          await this.clearAllTokens();
          this.onForceLogout?.();
        }

        return Promise.reject(error);
      }
    );
  }

  // ─── Token Refresh (deduplicates concurrent requests) ────────────────
  private async refreshAccessToken(): Promise<string | null> {
    // If a refresh is already in-flight, reuse it
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) return null;

        // Call the refresh endpoint directly (bypasses interceptor)
        const response = await axios.post(`${this.baseURL}/auth/refresh`, {
          refreshToken,
        });

        if (response.data?.success && response.data?.data?.token) {
          const newAccessToken = response.data.data.token;
          await this.setAuthToken(newAccessToken);
          return newAccessToken;
        }
        return null;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ─── Secure Token Storage ────────────────────────────────────────────

  /** Store access token securely in Keychain */
  async setAuthToken(token: string): Promise<void> {
    try {
      await Keychain.setGenericPassword('access_token', token, {
        service: ACCESS_TOKEN_SERVICE,
      });
    } catch (error) {
      // Fallback to AsyncStorage if Keychain fails (rare, e.g. simulator issues)
      console.warn('Keychain write failed, using AsyncStorage fallback:', error);
      await AsyncStorage.setItem('auth_token', token);
    }
  }

  /** Get access token from Keychain */
  async getAuthToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: ACCESS_TOKEN_SERVICE,
      });
      if (credentials) return credentials.password;
    } catch (error) {
      // Fallback to AsyncStorage
      const fallback = await AsyncStorage.getItem('auth_token');
      if (fallback) return fallback;
    }
    return null;
  }

  /** Store refresh token securely in Keychain */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await Keychain.setGenericPassword('refresh_token', token, {
        service: REFRESH_TOKEN_SERVICE,
      });
    } catch (error) {
      console.warn('Keychain write failed for refresh token:', error);
      await AsyncStorage.setItem('refresh_token', token);
    }
  }

  /** Get refresh token from Keychain */
  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: REFRESH_TOKEN_SERVICE,
      });
      if (credentials) return credentials.password;
    } catch (error) {
      const fallback = await AsyncStorage.getItem('refresh_token');
      if (fallback) return fallback;
    }
    return null;
  }

  /** Clear all auth tokens */
  async clearAllTokens(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_SERVICE });
      await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE });
    } catch (error) {
      // Silent
    }
    // Also clear AsyncStorage fallbacks
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
  }

  // Legacy aliases for backward compatibility
  async clearAuthToken(): Promise<void> {
    return this.clearAllTokens();
  }

  // ─── "Remember Me" — Save / Retrieve credentials ────────────────────

  /** Save email/password securely for "Remember Me" */
  async saveCredentials(email: string, password: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(email, password, {
        service: CREDENTIALS_SERVICE,
      });
    } catch (error) {
      console.warn('Failed to save credentials:', error);
    }
  }

  /** Get saved credentials */
  async getSavedCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: CREDENTIALS_SERVICE,
      });
      if (credentials) {
        return { email: credentials.username, password: credentials.password };
      }
    } catch (error) {
      // No saved credentials
    }
    return null;
  }

  /** Clear saved credentials */
  async clearSavedCredentials(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: CREDENTIALS_SERVICE });
    } catch (error) {
      // Silent
    }
  }

  // ─── HTTP Methods ────────────────────────────────────────────────────

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
        ...config,
      });

      return response.data;
    } catch (error: any) {
      const errorResponse = error.response?.data || {};

      return {
        success: false,
        error: errorResponse.error || error.message || 'Request failed',
        message: errorResponse.message || error.message || 'Request failed',
        errors: errorResponse.errors,
      } as ApiResponse<T>;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, { params });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  async deleteWithBody<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, data);
  }

  // Upload image (always authenticated)
  async uploadImage<T>(endpoint: string, uri: string): Promise<ApiResponse<T>> {
    const uploadEndpoint = endpoint;

    // Extract file extension from URI
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const fileName = `image_${Date.now()}.${fileType}`;

    // Determine MIME type
    let mimeType = 'image/jpeg';
    if (fileType === 'png') mimeType = 'image/png';
    else if (fileType === 'gif') mimeType = 'image/gif';
    else if (fileType === 'webp') mimeType = 'image/webp';

    const formData = new FormData();
    formData.append('image', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      type: mimeType,
      name: fileName,
    } as any);

    const token = await this.getAuthToken();
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log('Uploading image:', {
      endpoint: uploadEndpoint,
      uri: uri.substring(0, 50) + '...',
      fileName,
      mimeType,
      hasToken: !!token,
    });

    try {
      const response = await this.client.post(uploadEndpoint, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('Image upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Image upload failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        endpoint: uploadEndpoint,
      });

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Upload failed',
        message: error.response?.data?.message || error.message || 'Network error. Please check your connection and try again.',
      };
    }
  }

  // Upload multiple images
  async uploadMultipleImages<T>(endpoint: string, uris: string[]): Promise<ApiResponse<T>> {
    const formData = new FormData();
    uris.forEach((uri, index) => {
      formData.append('images', {
        uri,
        type: 'image/jpeg',
        name: `image_${index}.jpg`,
      } as any);
    });

    const token = await this.getAuthToken();
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await this.client.post(endpoint, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Upload failed',
        message: error.response?.data?.message || error.message || 'Upload failed',
      };
    }
  }
}

export const apiClient = new ApiClient();

// API endpoints (same structure as web version)
export const api = {
  // Auth
  auth: {
    register: (data: {
      name: string;
      email: string;
      password: string;
      phone: string;
      isHost?: boolean;
      hostData?: {
        displayName?: string;
        phone?: string;
        whatsapp?: string;
        locationName?: string;
        locationMapUrl?: string;
        nidFrontUrl?: string;
        nidBackUrl?: string;
        profilePictureUrl?: string;
      };
    }) => apiClient.post('/auth/register', data),
    login: (data: { email: string; password: string; rememberMe?: boolean }) =>
      apiClient.post('/auth/login', data),
    sendOtp: (data: { phone: string }) =>
      apiClient.post('/auth/send-otp', data),
    verifyOtp: (data: { phone: string; otp: string; name?: string }) =>
      apiClient.post('/auth/verify-otp', data),
    refresh: (data: { refreshToken: string }) =>
      apiClient.post('/auth/refresh', data),
    logout: () => apiClient.post('/auth/logout'),
    profile: () => apiClient.get('/auth/profile'),
    updateProfile: (data: { name?: string; phone?: string; profilePictureUrl?: string }) =>
      apiClient.put('/users/me', data),
    registerFCMToken: (data: { fcmToken: string }) =>
      apiClient.post('/auth/fcm-token', data),
  },

  // Users
  users: {
    getProfile: () => apiClient.get('/users/me'),
    update: (data: { name?: string; phone?: string }) => apiClient.put('/users/me', data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.post('/users/change-password', data),
  },

  // Rooms
  rooms: {
    list: <T = any>(params?: {
      page?: number;
      limit?: number;
      q?: string;
      location?: string;
      minPrice?: number;
      maxPrice?: number;
      type?: string;
      sort?: string;
    }) => apiClient.get<T>('/rooms/search', params),
    search: <T = any>(queryString: string) => apiClient.get<T>(`/rooms/search?${queryString}`),
    get: <T = any>(id: string) => apiClient.get<T>(`/rooms/${id}`),
    detail: <T = any>(id: string) => apiClient.get<T>(`/rooms/${id}`),
    create: (data: any) => apiClient.post('/rooms', data),
    update: (id: string, data: any) => apiClient.put(`/rooms/${id}`, data),
    delete: (id: string) => apiClient.delete(`/rooms/${id}`),
    getUnavailable: <T = any>(id: string) => apiClient.get<T>(`/rooms/${id}/unavailable`),
    setUnavailable: (id: string, data: { dates: string[] }) => apiClient.post(`/rooms/${id}/unavailable`, data),
    removeUnavailable: (id: string, data: { dates: string[] }) => apiClient.deleteWithBody(`/rooms/${id}/unavailable`, data),
  },

  // Bookings
  bookings: {
    quote: <T = any>(data: { roomId: string; checkIn: string; checkOut: string; guests: number }) =>
      apiClient.post<T>('/bookings/quote', data),
    create: (data: any) => apiClient.post('/bookings/create', data),
    list: <T = any>(params?: any) => apiClient.get<T>('/bookings/mine', params),
    get: <T = any>(id: string) => apiClient.get<T>(`/bookings/${id}`),
    update: (id: string, data: any) => apiClient.put(`/bookings/${id}`, data),
    cancel: (id: string) => apiClient.post(`/bookings/${id}/cancel`),
    approve: (id: string) => apiClient.post(`/bookings/${id}/approve`, { status: 'confirmed' }),
    reject: (id: string) => apiClient.post(`/bookings/${id}/reject`, {}),
  },

  // Payments
  payments: {
    initEps: (data: { bookingId: string }) => apiClient.post<{ gatewayUrl: string; sessionKey: string }>('/payments/eps/init', data),
  },

  // RateHawk
  ratehawk: {
    getHotel: <T = any>(hotelId: string, params?: Record<string, string>) =>
      apiClient.get<T>(`/ratehawk/hotel/${hotelId}`, params as any),
    getRates: <T = any>(hotelId: string, params: Record<string, string>) =>
      apiClient.get<T>(`/ratehawk/hotel/${hotelId}/rates`, params as any),
    createBooking: <T = any>(data: any) =>
      apiClient.post<T>('/ratehawk/booking', data),
    getBooking: <T = any>(id: string) =>
      apiClient.get<T>(`/ratehawk/booking/${id}`),
  },

  // Coupons
  coupons: {
    validate: (data: { code: string; bookingAmountTk: number }) =>
      apiClient.post<{ code: string; discountType: string; discountValue: number; discountAmountTk: number; finalAmountTk: number; message: string }>('/coupons/validate', data),
  },

  // Uploads
  uploads: {
    image: (uri: string) => apiClient.uploadImage('/uploads/image', uri),
    nid: (uri: string) => apiClient.uploadImage('/uploads/nid', uri),
    delete: (imageUrl: string) => apiClient.deleteWithBody('/uploads/image', { url: imageUrl }),
    roomImages: <T = any>(roomId: string, uris: string[]) => apiClient.uploadMultipleImages<T>(`/uploads/rooms/${roomId}/images`, uris),
  },

  // Chat
  chat: {
    getThreadIds: () => apiClient.get('/chat/threads/ids'),
    getThreads: (params?: any) => apiClient.get('/chat/threads', { params }),
    createThread: (data: any) => apiClient.post('/chat/threads', data),
    sendMessage: (data: any) => apiClient.post('/chat/messages', data),
    getMessages: (threadId: string, params?: any) => apiClient.get(`/chat/threads/${threadId}/messages`, { params }),
  },

  // Host endpoints
  hosts: {
    stats: <T = any>() => apiClient.get<T>('/hosts/stats'),
    rooms: () => apiClient.get('/hosts/rooms'),
    roomDetail: <T = any>(id: string) => apiClient.get<T>(`/hosts/rooms/${id}`),
    bookings: () => apiClient.get('/hosts/bookings'),
    reservations: () => apiClient.get('/hosts/reservations'),
    acceptBooking: (bookingId: string) => apiClient.post(`/bookings/${bookingId}/approve`, { status: 'confirmed' }),
    rejectBooking: (bookingId: string) => apiClient.post(`/bookings/${bookingId}/reject`, { status: 'rejected' }),
    profile: () => apiClient.get('/hosts/me'),
    updateProfile: (data: any) => apiClient.put('/hosts/me', data),
    createRoom: (data: any) => apiClient.post('/rooms', data),
    updateRoom: (id: string, data: any) => apiClient.put(`/rooms/${id}`, data),
    deleteRoom: (id: string) => apiClient.delete(`/rooms/${id}`),
    getUnavailableDates: <T = any>() => apiClient.get<T>('/hosts/rooms/unavailable'),
    updateRoomAvailability: (id: string, dates: string[]) => apiClient.post(`/rooms/${id}/unavailable`, { dates }),
    setUnavailable: (id: string, data: { dates: string[] }) => apiClient.post(`/rooms/${id}/unavailable`, data),
    removeUnavailable: (id: string, data: { dates: string[] }) => apiClient.deleteWithBody(`/rooms/${id}/unavailable`, data),
    balance: <T = any>() => apiClient.get<T>('/hosts/balance'),
    transactions: <T = any>(params?: { page?: number; limit?: number }) => apiClient.get<T>('/hosts/transactions', params),
    requestPayout: (data: any) =>
      apiClient.post('/payouts/request', data),
    apply: (data: {
      whatsapp: string;
      nidFrontUrl: string;
      nidBackUrl: string;
      profilePictureUrl?: string;
    }) => apiClient.post('/hosts/apply', data),
  },

  // Messages
  messages: {
    getThreads: <T = any>(params?: { page?: number; limit?: number }) =>
      apiClient.get<T>('/messages/threads', params),
    getThreadMessages: <T = any>(threadId: string, params?: { page?: number; limit?: number }) =>
      apiClient.get<T>(`/messages/threads/${threadId}`, params),
    sendMessage: (threadId: string, data: { text: string }) =>
      apiClient.post(`/messages/threads/${threadId}`, data),
    createThread: (data: { roomId: string; userId: string }) =>
      apiClient.post('/messages/threads', data),
  },

  // Reviews
  reviews: {
    create: (data: { bookingId: string; rating: number; comment: string }) =>
      apiClient.post('/reviews', data),
    getRoomReviews: <T = any>(roomId: string, params?: { page?: number; limit?: number }) =>
      apiClient.get<T>(`/reviews/room/${roomId}`, params),
    getMyReviews: <T = any>(params?: { page?: number; limit?: number }) =>
      apiClient.get<T>('/reviews/my', params),
    checkBookingReview: <T = any>(bookingId: string) =>
      apiClient.get<T>(`/reviews/booking/${bookingId}`),
    respondToReview: (reviewId: string, data: { response: string }) =>
      apiClient.post(`/reviews/${reviewId}/respond`, data),
    getHostReviews: <T = any>(params?: { page?: number; limit?: number }) =>
      apiClient.get<T>('/reviews/host', params),
  },

  // Favorites
  favorites: {
    list: <T = any>() => apiClient.get<T>('/favorites'),
    check: <T = any>(roomId: string) => apiClient.get<T>(`/favorites/check/${roomId}`),
    add: (roomId: string) => apiClient.post(`/favorites/${roomId}`),
    remove: (roomId: string) => apiClient.delete(`/favorites/${roomId}`),
  },

  // Payouts
  payouts: {
    getMine: <T = any>(params?: { page?: number; limit?: number; status?: string }) =>
      apiClient.get<T>('/payouts/mine', params),
    request: (data: any) => apiClient.post('/payouts/request', data),
    get: <T = any>(id: string) => apiClient.get<T>(`/payouts/${id}`),
  },

  // Notifications
  notifications: {
    list: <T = any>(params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      apiClient.get<T>('/notifications', params),
    getUnreadCount: <T = any>() => apiClient.get<T>('/notifications/unread-count'),
    markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/notifications/read-all'),
    delete: (id: string) => apiClient.delete(`/notifications/${id}`),
    deleteAll: () => apiClient.delete('/notifications'),
  },

  // Admin
  admin: {
    stats: <T = any>(params?: { from?: string; to?: string }) =>
      apiClient.get<T>('/admin/stats', params),
    hosts: <T = any>(params?: { page?: number; limit?: number; status?: string; q?: string }) =>
      apiClient.get<T>('/admin/hosts', params),
    approveHost: (id: string, data: { status: 'approved'; note?: string }) =>
      apiClient.post(`/admin/hosts/${id}/approve`, data),
    rejectHost: (id: string, data: { status: 'rejected'; note?: string; cancelBookings?: boolean }) =>
      apiClient.post(`/admin/hosts/${id}/reject`, data),
    getHostBookingsCount: <T = any>(id: string) =>
      apiClient.get<T>(`/admin/hosts/${id}/bookings-count`),
    getHostNid: <T = any>(id: string) =>
      apiClient.get<T>(`/admin/hosts/${id}/nid`),
    rooms: <T = any>(params?: { page?: number; limit?: number; status?: string; q?: string }) =>
      apiClient.get<T>('/admin/rooms', params),
    getRoom: <T = any>(id: string) => apiClient.get<T>(`/admin/rooms/${id}`),
    updateRoom: (id: string, data: any) => apiClient.put(`/admin/rooms/${id}`, data),
    approveRoom: (id: string, data?: { status?: string; commissionTk?: number; message?: string }) =>
      apiClient.post(`/admin/rooms/${id}/approve`, data || {}),
    rejectRoom: (id: string, data?: { status?: string; message?: string }) =>
      apiClient.post(`/admin/rooms/${id}/reject`, data || {}),
    bookings: <T = any>(params?: { page?: number; limit?: number; status?: string; q?: string }) =>
      apiClient.get<T>('/admin/bookings', params),
    users: <T = any>(params?: { page?: number; limit?: number; role?: string; q?: string }) =>
      apiClient.get<T>('/admin/users', params),
    suspendUser: (id: string) => apiClient.post(`/admin/users/${id}/suspend`),
    unsuspendUser: (id: string) => apiClient.post(`/admin/users/${id}/unsuspend`),
    reviews: <T = any>(params?: { page?: number; limit?: number }) =>
      apiClient.get<T>('/admin/reviews', params),
    deleteReview: (id: string) => apiClient.delete(`/admin/reviews/${id}`),
    restoreReview: (id: string) => apiClient.post(`/admin/reviews/${id}/restore`),
    editReview: (id: string, data: { rating?: number; comment?: string }) =>
      apiClient.put(`/admin/reviews/${id}`, data),
    whatsappChats: <T = any>(params?: { page?: number; limit?: number }) =>
      apiClient.get<T>('/admin/whatsapp-chats', params),
    whatsappChatDetail: <T = any>(phone: string, params?: { page?: number; limit?: number }) =>
      apiClient.get<T>(`/admin/whatsapp-chats/${phone}`, params),
    whatsappChatStatus: <T = any>(phone: string) =>
      apiClient.get<T>(`/admin/whatsapp-chats/${phone}/status`),
    whatsappMarkRead: (phone: string) =>
      apiClient.post(`/admin/whatsapp-chats/${phone}/mark-read`),
    whatsappReply: (phone: string, message: string) =>
      apiClient.post(`/admin/whatsapp-chats/${phone}/reply`, { message }),
    whatsappToggleBot: (phone: string, enabled: boolean) =>
      apiClient.post(`/admin/whatsapp-chats/${phone}/toggle-bot`, { enabled }),
    whatsappSendImage: (phone: string, imageUrl: string, caption?: string) =>
      apiClient.post(`/admin/whatsapp-chats/${phone}/send-image`, { imageUrl, caption }),
    whatsappSendVideo: (phone: string, videoUrl: string, caption?: string) =>
      apiClient.post(`/admin/whatsapp-chats/${phone}/send-video`, { videoUrl, caption }),
    whatsappSendCatalog: (phone: string, product: any) =>
      apiClient.post(`/admin/whatsapp-chats/${phone}/send-catalog`, { product }),
    whatsappCatalog: <T = any>(params?: { limit?: number; after?: string }) =>
      apiClient.get<T>('/admin/whatsapp-catalog', params),
    quickReplies: <T = any>() => apiClient.get<T>('/admin/quick-replies'),
    createQuickReply: (data: { title: string; message: string }) =>
      apiClient.post('/admin/quick-replies', data),
    deleteQuickReply: (id: string) => apiClient.delete(`/admin/quick-replies/${id}`),
    partialPayments: <T = any>(params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      apiClient.get<T>('/partial-payments/admin/list', params),
  },

  // Locations
  locations: {
    search: async <T = any>(searchTerm?: string): Promise<T[]> => {
      try {
        const token = await apiClient.getAuthToken();
        const headers: any = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const axiosResponse = await apiClient['client'].get('/locations', {
          params: searchTerm ? { s: searchTerm } : {},
          headers,
        });

        const data = axiosResponse.data;

        if (Array.isArray(data)) {
          return data as T[];
        }

        if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          return data.data as T[];
        }

        console.warn('Unexpected locations response format:', data);
        return [];
      } catch (error: any) {
        console.error('Locations search error:', error);
        return [];
      }
    },
  },
};
