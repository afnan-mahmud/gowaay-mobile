/**
 * Authentication Context for React Native App
 * Supports OTP-based login + refresh tokens + secure storage
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, apiClient } from '../api/client';
import { User } from '../types';
import NotificationService from '../services/NotificationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Legacy email/password login — kept for backward compatibility */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  /** New OTP-based login */
  loginWithOtp: (phone: string, otp: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Normalize user data from various API endpoints.
 */
function normalizeUser(data: any): User {
  return {
    _id: data._id || data.id,
    id: data.id || data._id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    role: data.role || 'guest',
    adminLevel: data.adminLevel || undefined,
    profilePictureUrl: data.profilePictureUrl || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Wire up forced logout from API client (when refresh token expires)
  useEffect(() => {
    apiClient.onForceLogout = () => {
      setUser(null);
    };

    return () => {
      apiClient.onForceLogout = undefined;
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await apiClient.getAuthToken();
      if (token) {
        const response = await api.auth.profile();
        if (response.success && response.data) {
          setUser(normalizeUser(response.data));
          // Re-register FCM token on app restart while authenticated (non-blocking)
          NotificationService.initialize().catch(() => {});
        } else {
          // Token invalid, clear it
          await apiClient.clearAllTokens();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await apiClient.clearAllTokens();
    } finally {
      setLoading(false);
    }
  };

  // ─── Legacy email/password login ────────────────────────────────────────
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await api.auth.login({ email, password, rememberMe });

      if (response.success && response.data) {
        const { user: userData, token, refreshToken } = response.data as any;

        // Store tokens securely
        await apiClient.setAuthToken(token);
        if (refreshToken) {
          await apiClient.setRefreshToken(refreshToken);
        }

        if (rememberMe) {
          await apiClient.saveCredentials(email, password);
        } else {
          await apiClient.clearSavedCredentials();
        }

        setUser(normalizeUser(userData));
        NotificationService.initialize().catch(() => {});

        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  // ─── OTP-based login (new primary flow) ─────────────────────────────────
  const loginWithOtp = async (phone: string, otp: string, name?: string) => {
    try {
      const response = await api.auth.verifyOtp({ phone, otp, name });

      if (response.success && response.data) {
        const { user: userData, token, refreshToken } = response.data as any;

        // Store tokens securely
        await apiClient.setAuthToken(token);
        if (refreshToken) {
          await apiClient.setRefreshToken(refreshToken);
        }

        setUser(normalizeUser(userData));
        NotificationService.initialize().catch(() => {});

        return { success: true };
      } else {
        return { success: false, message: response.message || response.error || 'OTP verification failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'OTP verification failed' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.auth.register(data);

      if (response.success && response.data) {
        const { user: userData, token, refreshToken } = response.data as any;

        await apiClient.setAuthToken(token);
        if (refreshToken) {
          await apiClient.setRefreshToken(refreshToken);
        }

        setUser(normalizeUser(userData));
        NotificationService.initialize().catch(() => {});

        return { success: true };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await NotificationService.clearToken();
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await apiClient.clearAllTokens();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.auth.profile();
      if (response.success && response.data) {
        setUser(normalizeUser(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithOtp,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
