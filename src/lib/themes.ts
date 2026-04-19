export type ThemeKey = 'ocean' | 'emerald' | 'purple' | 'sunset' | 'midnight';

export interface ThemeConfig {
  key: ThemeKey;
  name: string;
  nameZh: string;
  gradient: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  accent: string;
  accentHover: string;
  accentLight: string;
  glass: string;
  glassBorder: string;
  glassHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  sidebarBg: string;
  headerBg: string;
  inputBg: string;
  badgeSuccess: string;
  badgeWarning: string;
  badgeDanger: string;
  badgeInfo: string;
  chartColors: string[];
}

export const themes: Record<ThemeKey, ThemeConfig> = {
  ocean: {
    key: 'ocean',
    name: 'Ocean Blue',
    nameZh: '海洋蓝',
    gradient: 'from-blue-900 via-blue-800 to-cyan-900',
    gradientFrom: '#1e3a5f',
    gradientVia: '#1e4d7b',
    gradientTo: '#0e4a5c',
    accent: 'bg-blue-500',
    accentHover: 'hover:bg-blue-600',
    accentLight: 'bg-blue-500/20',
    glass: 'bg-white/10 backdrop-blur-xl',
    glassBorder: 'border border-white/20',
    glassHover: 'hover:bg-white/15',
    text: 'text-white',
    textSecondary: 'text-blue-100',
    textMuted: 'text-blue-200/60',
    cardBg: 'bg-white/10 backdrop-blur-xl border border-white/20',
    sidebarBg: 'bg-black/20 backdrop-blur-2xl border-r border-white/10',
    headerBg: 'bg-black/10 backdrop-blur-xl border-b border-white/10',
    inputBg: 'bg-white/10 border border-white/20 text-white placeholder:text-white/40',
    badgeSuccess: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    badgeDanger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    badgeInfo: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    chartColors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
  },
  emerald: {
    key: 'emerald',
    name: 'Emerald Forest',
    nameZh: '翡翠森林',
    gradient: 'from-emerald-900 via-green-800 to-teal-900',
    gradientFrom: '#064e3b',
    gradientVia: '#065f46',
    gradientTo: '#0f4c4c',
    accent: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-600',
    accentLight: 'bg-emerald-500/20',
    glass: 'bg-white/10 backdrop-blur-xl',
    glassBorder: 'border border-white/20',
    glassHover: 'hover:bg-white/15',
    text: 'text-white',
    textSecondary: 'text-emerald-100',
    textMuted: 'text-emerald-200/60',
    cardBg: 'bg-white/10 backdrop-blur-xl border border-white/20',
    sidebarBg: 'bg-black/20 backdrop-blur-2xl border-r border-white/10',
    headerBg: 'bg-black/10 backdrop-blur-xl border-b border-white/10',
    inputBg: 'bg-white/10 border border-white/20 text-white placeholder:text-white/40',
    badgeSuccess: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    badgeDanger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    badgeInfo: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    chartColors: ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'],
  },
  purple: {
    key: 'purple',
    name: 'Royal Purple',
    nameZh: '皇家紫',
    gradient: 'from-purple-900 via-violet-800 to-indigo-900',
    gradientFrom: '#4c1d95',
    gradientVia: '#5b21b6',
    gradientTo: '#312e81',
    accent: 'bg-violet-500',
    accentHover: 'hover:bg-violet-600',
    accentLight: 'bg-violet-500/20',
    glass: 'bg-white/10 backdrop-blur-xl',
    glassBorder: 'border border-white/20',
    glassHover: 'hover:bg-white/15',
    text: 'text-white',
    textSecondary: 'text-violet-100',
    textMuted: 'text-violet-200/60',
    cardBg: 'bg-white/10 backdrop-blur-xl border border-white/20',
    sidebarBg: 'bg-black/20 backdrop-blur-2xl border-r border-white/10',
    headerBg: 'bg-black/10 backdrop-blur-xl border-b border-white/10',
    inputBg: 'bg-white/10 border border-white/20 text-white placeholder:text-white/40',
    badgeSuccess: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    badgeDanger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    badgeInfo: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    chartColors: ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171'],
  },
  sunset: {
    key: 'sunset',
    name: 'Sunset Warmth',
    nameZh: '暖日夕阳',
    gradient: 'from-orange-900 via-red-800 to-rose-900',
    gradientFrom: '#7c2d12',
    gradientVia: '#991b1b',
    gradientTo: '#881337',
    accent: 'bg-orange-500',
    accentHover: 'hover:bg-orange-600',
    accentLight: 'bg-orange-500/20',
    glass: 'bg-white/10 backdrop-blur-xl',
    glassBorder: 'border border-white/20',
    glassHover: 'hover:bg-white/15',
    text: 'text-white',
    textSecondary: 'text-orange-100',
    textMuted: 'text-orange-200/60',
    cardBg: 'bg-white/10 backdrop-blur-xl border border-white/20',
    sidebarBg: 'bg-black/20 backdrop-blur-2xl border-r border-white/10',
    headerBg: 'bg-black/10 backdrop-blur-xl border-b border-white/10',
    inputBg: 'bg-white/10 border border-white/20 text-white placeholder:text-white/40',
    badgeSuccess: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    badgeDanger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    badgeInfo: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    chartColors: ['#fb923c', '#f87171', '#fbbf24', '#34d399', '#60a5fa'],
  },
  midnight: {
    key: 'midnight',
    name: 'Midnight Dark',
    nameZh: '午夜暗黑',
    gradient: 'from-gray-950 via-slate-900 to-zinc-900',
    gradientFrom: '#030712',
    gradientVia: '#0f172a',
    gradientTo: '#18181b',
    accent: 'bg-cyan-500',
    accentHover: 'hover:bg-cyan-600',
    accentLight: 'bg-cyan-500/20',
    glass: 'bg-white/5 backdrop-blur-xl',
    glassBorder: 'border border-white/10',
    glassHover: 'hover:bg-white/10',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400/60',
    cardBg: 'bg-white/5 backdrop-blur-xl border border-white/10',
    sidebarBg: 'bg-black/30 backdrop-blur-2xl border-r border-white/5',
    headerBg: 'bg-black/20 backdrop-blur-xl border-b border-white/5',
    inputBg: 'bg-white/5 border border-white/10 text-white placeholder:text-white/30',
    badgeSuccess: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    badgeWarning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    badgeDanger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    badgeInfo: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    chartColors: ['#22d3ee', '#60a5fa', '#a78bfa', '#34d399', '#fbbf24'],
  },
};
