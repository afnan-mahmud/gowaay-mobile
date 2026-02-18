/**
 * Toast - Lightweight non-blocking notification (pure React Native, no deps)
 *
 * Usage:
 *   1. Mount <ToastProvider> once at root (App.tsx).
 *   2. Call Toast.show({ type, title, message }) from anywhere.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../constants/theme';
import { Colors } from '../constants/colors';

// ─── types ──────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3000
  onPress?: () => void;
}

interface ToastContextValue {
  show: (config: ToastConfig) => void;
}

// ─── static accessor (callable without hook) ────────────
let _show: ((config: ToastConfig) => void) | null = null;

export const Toast = {
  show(config: ToastConfig) {
    if (_show) {
      _show(config);
    } else {
      console.warn('Toast: ToastProvider not mounted yet');
    }
  },
};

// ─── context (optional hook access) ─────────────────────
const ToastContext = createContext<ToastContextValue>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

// ─── colours per type ───────────────────────────────────
const palette: Record<ToastType, { bg: string; iconName: string }> = {
  success: { bg: Colors.success, iconName: 'checkmark' },
  error: { bg: Colors.error, iconName: 'close' },
  info: { bg: Colors.info, iconName: 'information' },
  warning: { bg: Colors.warning, iconName: 'warning' },
};

// ─── provider ───────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const timer = useRef<NodeJS.Timeout | null>(null);

  const hide = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setConfig(null));
  }, [translateY]);

  const show = useCallback(
    (cfg: ToastConfig) => {
      if (timer.current) clearTimeout(timer.current);
      setConfig(cfg);
      translateY.setValue(-120);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
      timer.current = setTimeout(hide, cfg.duration ?? 3000);
    },
    [translateY, hide],
  );

  // Expose to static accessor
  useEffect(() => {
    _show = show;
    return () => {
      _show = null;
    };
  }, [show]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {config && (
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY }], backgroundColor: palette[config.type].bg },
          ]}
        >
          <TouchableOpacity
            style={styles.inner}
            activeOpacity={0.9}
            onPress={() => {
              config.onPress?.();
              hide();
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={palette[config.type].iconName as any} size={16} color={Colors.white} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {config.title}
              </Text>
              {!!config.message && (
                <Text style={styles.message} numberOfLines={2}>
                  {config.message}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={hide} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// ─── styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: Theme.spacing.md,
    right: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  iconText: {},
  textWrap: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  title: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
  },
  message: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  dismiss: {
    padding: 4,
  },
});
