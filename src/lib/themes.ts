export type ThemeKey = 'carbon' | 'neon' | 'daylight';

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
  orbColors: [string, string, string];
  floatingBtnGradient: string;
  floatingBtnShadow: string;
}

export const themes: Record<ThemeKey, ThemeConfig> = {
  // Example 1: Dark charcoal + emerald green accents — clean professional dashboard
  carbon: {
    key: 'carbon',
    name: 'Carbon',
    nameZh: '碳黑',
    gradient: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
    gradientFrom: '#1a1a2e',
    gradientVia: '#16213e',
    gradientTo: '#0f3460',
    accent: 'bg-accent-500',
    accentHover: 'hover:bg-accent-600',
    accentLight: 'bg-accent-500/20',
    glass: 'bg-slate-900/85 backdrop-blur-xl',
    glassBorder: 'border border-white/10',
    glassHover: 'hover:bg-slate-900/92',
    text: 'text-white',
    textSecondary: 'text-emerald-100',
    textMuted: 'text-gray-400',
    cardBg: 'bg-slate-900/85 backdrop-blur-xl border border-white/10',
    sidebarBg: 'bg-slate-950/90 backdrop-blur-2xl border-r border-white/8',
    headerBg: 'bg-slate-950/80 backdrop-blur-xl border-b border-white/8',
    inputBg: 'bg-slate-800/70 border border-white/12 text-white placeholder:text-white/40',
    badgeSuccess: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    badgeDanger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    badgeInfo: 'bg-accent-500/20 text-accent-400 border border-accent-500/30',
    chartColors: ['#34d399', '#10b981', '#6ee7b7', '#fbbf24', '#60a5fa', '#a78bfa'],
    orbColors: ['rgba(16,185,129,0.35)', 'rgba(52,211,153,0.25)', 'rgba(6,182,212,0.2)'],
    floatingBtnGradient: 'from-emerald-500 to-teal-600',
    floatingBtnShadow: 'shadow-emerald-500/25 hover:shadow-emerald-500/40',
  },
  // Example 2: Deep purple + neon violet/pink — vibrant glassmorphic
  neon: {
    key: 'neon',
    name: 'Neon',
    nameZh: '霓虹',
    gradient: 'from-[#0d0b1e] via-[#1a1040] to-[#13072e]',
    gradientFrom: '#0d0b1e',
    gradientVia: '#1a1040',
    gradientTo: '#13072e',
    accent: 'bg-accent-500',
    accentHover: 'hover:bg-accent-600',
    accentLight: 'bg-accent-500/20',
    glass: 'bg-[#110d2e]/88 backdrop-blur-xl',
    glassBorder: 'border border-violet-500/15',
    glassHover: 'hover:bg-[#110d2e]/95',
    text: 'text-white',
    textSecondary: 'text-violet-100',
    textMuted: 'text-violet-300/70',
    cardBg: 'bg-[#110d2e]/88 backdrop-blur-xl border border-violet-500/15',
    sidebarBg: 'bg-[#0a0820]/92 backdrop-blur-2xl border-r border-violet-500/12',
    headerBg: 'bg-[#0a0820]/85 backdrop-blur-xl border-b border-violet-500/12',
    inputBg: 'bg-[#1a1040]/70 border border-violet-500/18 text-white placeholder:text-white/40',
    badgeSuccess: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    badgeDanger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    badgeInfo: 'bg-accent-500/20 text-accent-400 border border-accent-500/30',
    chartColors: ['#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#60a5fa', '#22d3ee'],
    orbColors: ['rgba(139,92,246,0.35)', 'rgba(236,72,153,0.25)', 'rgba(99,102,241,0.2)'],
    floatingBtnGradient: 'from-violet-500 to-fuchsia-600',
    floatingBtnShadow: 'shadow-violet-500/25 hover:shadow-violet-500/40',
  },
  // Example 3: Navy + orange/blue — clean professional with warm accents
  daylight: {
    key: 'daylight',
    name: 'Daylight',
    nameZh: '晨光',
    gradient: 'from-[#0f172a] via-[#1e293b] to-[#0c1524]',
    gradientFrom: '#0f172a',
    gradientVia: '#1e293b',
    gradientTo: '#0c1524',
    accent: 'bg-accent-500',
    accentHover: 'hover:bg-accent-600',
    accentLight: 'bg-accent-500/20',
    glass: 'bg-slate-900/85 backdrop-blur-xl',
    glassBorder: 'border border-white/12',
    glassHover: 'hover:bg-slate-900/92',
    text: 'text-white',
    textSecondary: 'text-blue-100',
    textMuted: 'text-slate-400',
    cardBg: 'bg-slate-900/85 backdrop-blur-xl border border-white/12',
    sidebarBg: 'bg-slate-950/88 backdrop-blur-2xl border-r border-white/8',
    headerBg: 'bg-slate-950/80 backdrop-blur-xl border-b border-white/8',
    inputBg: 'bg-slate-800/70 border border-white/12 text-white placeholder:text-white/42',
    badgeSuccess: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    badgeDanger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    badgeInfo: 'bg-accent-500/20 text-accent-400 border border-accent-500/30',
    chartColors: ['#f97316', '#3b82f6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'],
    orbColors: ['rgba(59,130,246,0.3)', 'rgba(249,115,22,0.25)', 'rgba(6,182,212,0.2)'],
    floatingBtnGradient: 'from-orange-500 to-amber-600',
    floatingBtnShadow: 'shadow-orange-500/25 hover:shadow-orange-500/40',
  },
};
