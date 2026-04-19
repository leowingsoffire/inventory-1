'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type ThemeKey, themes, type ThemeConfig } from '@/lib/themes';
import { type Lang } from '@/lib/i18n';

export interface ThemeOverrides {
  accentColor?: string;       // hex e.g. '#10b981'
  gradientFrom?: string;      // hex
  gradientVia?: string;       // hex
  gradientTo?: string;        // hex
  glassOpacity?: number;      // 0.5–1.0
  borderOpacity?: number;     // 0–0.3
  sidebarStyle?: 'default' | 'transparent' | 'solid';
}

interface AppContextType {
  theme: ThemeConfig;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  themeOverrides: ThemeOverrides;
  setThemeOverrides: (overrides: ThemeOverrides) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  aiApiKey: string;
  setAiApiKey: (key: string) => void;
  aiAvatar: string;
  setAiAvatar: (id: string) => void;
  aiChatTheme: string;
  setAiChatTheme: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('carbon');
  const [lang, setLang] = useState<Lang>('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiAvatar, setAiAvatarState] = useState('avatar-01');
  const [aiChatTheme, setAiChatThemeState] = useState('theme-rose');
  const [themeOverrides, setThemeOverridesState] = useState<ThemeOverrides>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('unitech-theme') as ThemeKey;
    const savedLang = localStorage.getItem('unitech-lang') as Lang;
    const savedKey = localStorage.getItem('unitech-ai-key');
    const savedAvatar = localStorage.getItem('unitech-ai-avatar');
    const savedChatTheme = localStorage.getItem('unitech-ai-chat-theme');
    if (savedTheme && themes[savedTheme]) setThemeKey(savedTheme);
    if (savedLang) setLang(savedLang);
    if (savedKey) setAiApiKey(savedKey);
    if (savedAvatar) setAiAvatarState(savedAvatar);
    if (savedChatTheme) setAiChatThemeState(savedChatTheme);
    const savedOverrides = localStorage.getItem('unitech-theme-overrides');
    if (savedOverrides) {
      try { setThemeOverridesState(JSON.parse(savedOverrides)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeKey);
  }, [themeKey]);

  // Apply custom theme overrides via CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (themeOverrides.accentColor) {
      const hex = themeOverrides.accentColor;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      root.style.setProperty('--accent-50', `rgba(${r},${g},${b},0.05)`);
      root.style.setProperty('--accent-100', `rgba(${r},${g},${b},0.1)`);
      root.style.setProperty('--accent-200', `rgba(${r},${g},${b},0.4)`);
      root.style.setProperty('--accent-300', `rgba(${r},${g},${b},0.6)`);
      root.style.setProperty('--accent-400', hex);
      root.style.setProperty('--accent-500', hex);
      root.style.setProperty('--accent-600', hex);
      root.style.setProperty('--accent-700', hex);
      root.style.setProperty('--glow-color', `rgba(${r},${g},${b},0.5)`);
      root.style.setProperty('--glow-color-light', `rgba(${r},${g},${b},0.3)`);
      root.style.setProperty('--selection-color', `rgba(${r},${g},${b},0.4)`);
    } else {
      // Remove custom overrides so theme CSS takes over
      ['--accent-50','--accent-100','--accent-200','--accent-300','--accent-400','--accent-500','--accent-600','--accent-700','--glow-color','--glow-color-light','--selection-color'].forEach(p => root.style.removeProperty(p));
    }
    if (themeOverrides.gradientFrom) root.style.setProperty('--custom-gradient-from', themeOverrides.gradientFrom);
    else root.style.removeProperty('--custom-gradient-from');
    if (themeOverrides.gradientVia) root.style.setProperty('--custom-gradient-via', themeOverrides.gradientVia);
    else root.style.removeProperty('--custom-gradient-via');
    if (themeOverrides.gradientTo) root.style.setProperty('--custom-gradient-to', themeOverrides.gradientTo);
    else root.style.removeProperty('--custom-gradient-to');
    if (themeOverrides.glassOpacity !== undefined) root.style.setProperty('--custom-glass-opacity', String(themeOverrides.glassOpacity));
    else root.style.removeProperty('--custom-glass-opacity');
    if (themeOverrides.borderOpacity !== undefined) root.style.setProperty('--custom-border-opacity', String(themeOverrides.borderOpacity));
    else root.style.removeProperty('--custom-border-opacity');
  }, [themeOverrides, themeKey]);

  const setTheme = (key: ThemeKey) => { setThemeKey(key); localStorage.setItem('unitech-theme', key); };
  const handleSetLang = (l: Lang) => { setLang(l); localStorage.setItem('unitech-lang', l); };
  const handleSetAiKey = (key: string) => { setAiApiKey(key); localStorage.setItem('unitech-ai-key', key); };
  const setAiAvatar = (id: string) => { setAiAvatarState(id); localStorage.setItem('unitech-ai-avatar', id); };
  const setAiChatTheme = (id: string) => { setAiChatThemeState(id); localStorage.setItem('unitech-ai-chat-theme', id); };
  const setThemeOverrides = (overrides: ThemeOverrides) => {
    setThemeOverridesState(overrides);
    localStorage.setItem('unitech-theme-overrides', JSON.stringify(overrides));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        theme: themes[themeKey], themeKey, setTheme,
        themeOverrides, setThemeOverrides,
        lang, setLang: handleSetLang,
        sidebarOpen, setSidebarOpen,
        aiApiKey, setAiApiKey: handleSetAiKey,
        aiAvatar, setAiAvatar,
        aiChatTheme, setAiChatTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
