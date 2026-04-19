'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  displayName: string | null;
  role: string;
  avatar: string | null;
  profilePhoto: string | null;
  personalEmail: string | null;
  isActive: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'unitech-auth-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (loginId: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // silently fail
    }
  }, [user]);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
