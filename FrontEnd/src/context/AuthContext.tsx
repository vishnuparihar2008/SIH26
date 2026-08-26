import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, setAuthToken, type AuthResponse } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type User = AuthResponse['user'];

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: 'caretaker' | 'patient';
    relationshipToPatients?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Simple token persistence using a module-level variable ──────────────────
// We use a plain in-memory store here. In production swap for expo-secure-store:
//   import * as SecureStore from 'expo-secure-store';
//   await SecureStore.setItemAsync('authToken', token);
const TOKEN_KEY = 'auth_token';

const tokenStore = {
  save: (token: string) => {
    // Persist to React Native global state across hot reloads during dev.
    // Replace this with SecureStore in production.
    (global as Record<string, unknown>)[TOKEN_KEY] = token;
  },
  load: (): string | null => {
    return (global as Record<string, unknown>)[TOKEN_KEY] as string | null ?? null;
  },
  clear: () => {
    delete (global as Record<string, unknown>)[TOKEN_KEY];
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: attempt to restore session from store
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = tokenStore.load();
        if (stored) {
          setAuthToken(stored);
          const { user: me } = await authApi.me();
          setToken(stored);
          setUser(me);
        }
      } catch {
        // Token expired or invalid — clear it silently
        tokenStore.clear();
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await authApi.login({ email, password });
    tokenStore.save(data.accessToken);
    setAuthToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: Parameters<typeof authApi.register>[0]): Promise<User> => {
    const data = await authApi.register(payload);
    tokenStore.save(data.accessToken);
    setAuthToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort — clear locally even if server call fails
    } finally {
      tokenStore.clear();
      setAuthToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

