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

const ACCENT_VARS = ['--accent-50','--accent-100','--accent-200','--accent-300','--accent-400','--accent-500','--accent-600','--accent-700','--glow-color','--glow-color-light','--selection-color'] as const;

function applyThemeOverrides(root: HTMLElement, overrides: ThemeOverrides): void {
  if (overrides.accentColor) {
    const hex = overrides.accentColor;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
    root.style.setProperty('--accent-50', rgba(0.05));
    root.style.setProperty('--accent-100', rgba(0.1));
    root.style.setProperty('--accent-200', rgba(0.4));
    root.style.setProperty('--accent-300', rgba(0.6));
    for (const v of ['--accent-400','--accent-500','--accent-600','--accent-700'] as const) root.style.setProperty(v, hex);
    root.style.setProperty('--glow-color', rgba(0.5));
    root.style.setProperty('--glow-color-light', rgba(0.3));
    root.style.setProperty('--selection-color', rgba(0.4));
  } else {
    ACCENT_VARS.forEach(p => root.style.removeProperty(p));
  }

  const optionalVars: [keyof ThemeOverrides, string][] = [
    ['gradientFrom', '--custom-gradient-from'],
    ['gradientVia', '--custom-gradient-via'],
    ['gradientTo', '--custom-gradient-to'],
    ['glassOpacity', '--custom-glass-opacity'],
    ['borderOpacity', '--custom-border-opacity'],
  ];
  for (const [key, cssVar] of optionalVars) {
    const val = overrides[key];
    if (val !== undefined) root.style.setProperty(cssVar, String(val));
    else root.style.removeProperty(cssVar);
  }
}

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
    applyThemeOverrides(document.documentElement, themeOverrides);
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
