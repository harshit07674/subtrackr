'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, onSessionExpired } from '@/lib/api';
import type { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: unknown) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const me = await authApi.me(authToken);
      setUser({
        id: me.id,
        username: me.username,
        email: me.email,
        verified: me.verified,
        primaryCurrency: me.primaryCurrency,
        defaultNotificationDays: me.defaultNotificationDays,
      });
    } catch {
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    // Register global session expired handler
    onSessionExpired(() => {
      setUser(null);
      setToken(null);
      toast.error('Session expired. Please log in again.');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    });

    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setToken(accessToken);
        await fetchCurrentUser(accessToken);
      } catch {
        // Not logged in
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (credentials: unknown) => {
    const data = await authApi.login(credentials);
    setToken(data.accessToken);
    await fetchCurrentUser(data.accessToken);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
