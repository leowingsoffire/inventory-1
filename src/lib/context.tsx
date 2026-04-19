'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type ThemeKey, themes, type ThemeConfig } from '@/lib/themes';
import { type Lang } from '@/lib/i18n';

interface AppContextType {
  theme: ThemeConfig;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  aiApiKey: string;
  setAiApiKey: (key: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('midnight');
  const [lang, setLang] = useState<Lang>('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiApiKey, setAiApiKey] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('unitech-theme') as ThemeKey;
    const savedLang = localStorage.getItem('unitech-lang') as Lang;
    const savedKey = localStorage.getItem('unitech-ai-key');
    if (savedTheme && themes[savedTheme]) setThemeKey(savedTheme);
    if (savedLang) setLang(savedLang);
    if (savedKey) setAiApiKey(savedKey);
  }, []);

  const setTheme = (key: ThemeKey) => {
    setThemeKey(key);
    localStorage.setItem('unitech-theme', key);
  };

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('unitech-lang', l);
  };

  const handleSetAiKey = (key: string) => {
    setAiApiKey(key);
    localStorage.setItem('unitech-ai-key', key);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-zinc-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        theme: themes[themeKey],
        themeKey,
        setTheme,
        lang,
        setLang: handleSetLang,
        sidebarOpen,
        setSidebarOpen,
        aiApiKey,
        setAiApiKey: handleSetAiKey,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
