// 10 3D-style animated avatar definitions for Uni AI
export interface AiAvatar {
  id: string;
  name: string;
  emoji: string; // Base emoji for CSS 3D rendering
  gradient: string;
  glow: string;
  personality: string;
  ring: string;
}

export const aiAvatars: AiAvatar[] = [
  { id: 'avatar-01', name: 'Sora', emoji: '👩', gradient: 'from-rose-400 via-pink-500 to-fuchsia-500', glow: 'shadow-pink-500/40', ring: 'ring-pink-400/50', personality: 'warm & cheerful' },
  { id: 'avatar-02', name: 'Yuna', emoji: '👩‍💼', gradient: 'from-violet-400 via-purple-500 to-indigo-500', glow: 'shadow-violet-500/40', ring: 'ring-violet-400/50', personality: 'professional & smart' },
  { id: 'avatar-03', name: 'Hana', emoji: '💁‍♀️', gradient: 'from-sky-400 via-blue-500 to-cyan-500', glow: 'shadow-blue-500/40', ring: 'ring-blue-400/50', personality: 'calm & helpful' },
  { id: 'avatar-04', name: 'Mina', emoji: '🧑‍💻', gradient: 'from-emerald-400 via-green-500 to-teal-500', glow: 'shadow-emerald-500/40', ring: 'ring-emerald-400/50', personality: 'tech-savvy & efficient' },
  { id: 'avatar-05', name: 'Jina', emoji: '👸', gradient: 'from-amber-400 via-orange-500 to-rose-500', glow: 'shadow-orange-500/40', ring: 'ring-amber-400/50', personality: 'energetic & motivating' },
  { id: 'avatar-06', name: 'Rina', emoji: '🧚', gradient: 'from-fuchsia-400 via-pink-500 to-rose-500', glow: 'shadow-fuchsia-500/40', ring: 'ring-fuchsia-400/50', personality: 'creative & playful' },
  { id: 'avatar-07', name: 'Nari', emoji: '🦸‍♀️', gradient: 'from-red-400 via-rose-500 to-pink-500', glow: 'shadow-red-500/40', ring: 'ring-red-400/50', personality: 'bold & confident' },
  { id: 'avatar-08', name: 'Suji', emoji: '🧑‍🔬', gradient: 'from-cyan-400 via-teal-500 to-emerald-500', glow: 'shadow-teal-500/40', ring: 'ring-teal-400/50', personality: 'analytical & precise' },
  { id: 'avatar-09', name: 'Aeri', emoji: '🌸', gradient: 'from-pink-300 via-rose-400 to-pink-500', glow: 'shadow-pink-400/40', ring: 'ring-pink-300/50', personality: 'gentle & caring' },
  { id: 'avatar-10', name: 'Dani', emoji: '💫', gradient: 'from-indigo-400 via-blue-500 to-violet-500', glow: 'shadow-indigo-500/40', ring: 'ring-indigo-400/50', personality: 'witty & insightful' },
];

export interface AiChatTheme {
  id: string;
  name: string;
  bg: string;
  headerGradient: string;
  userBubble: string;
  aiBubble: string;
  accent: string;
  inputBorder: string;
}

export const aiChatThemes: AiChatTheme[] = [
  { id: 'theme-rose', name: 'Rose', bg: 'from-[#1a0a14] via-[#1a0f1e] to-[#120a18]', headerGradient: 'from-rose-500/15 to-pink-500/10', userBubble: 'from-rose-500/25 to-pink-500/25 border-rose-500/20', aiBubble: 'bg-white/5 border-white/10', accent: 'rose', inputBorder: 'focus:border-rose-500/50' },
  { id: 'theme-ocean', name: 'Ocean', bg: 'from-[#0a1420] via-[#0c1829] to-[#0a1018]', headerGradient: 'from-cyan-500/15 to-blue-500/10', userBubble: 'from-cyan-500/25 to-blue-500/25 border-cyan-500/20', aiBubble: 'bg-white/5 border-white/10', accent: 'cyan', inputBorder: 'focus:border-cyan-500/50' },
  { id: 'theme-aurora', name: 'Aurora', bg: 'from-[#0a1a14] via-[#0c1820] to-[#0a1418]', headerGradient: 'from-emerald-500/15 to-teal-500/10', userBubble: 'from-emerald-500/25 to-teal-500/25 border-emerald-500/20', aiBubble: 'bg-white/5 border-white/10', accent: 'emerald', inputBorder: 'focus:border-emerald-500/50' },
  { id: 'theme-violet', name: 'Violet', bg: 'from-[#120a1e] via-[#14102a] to-[#0e0a1a]', headerGradient: 'from-violet-500/15 to-purple-500/10', userBubble: 'from-violet-500/25 to-purple-500/25 border-violet-500/20', aiBubble: 'bg-white/5 border-white/10', accent: 'violet', inputBorder: 'focus:border-violet-500/50' },
  { id: 'theme-sunset', name: 'Sunset', bg: 'from-[#1a1008] via-[#1a120e] to-[#180e08]', headerGradient: 'from-amber-500/15 to-orange-500/10', userBubble: 'from-amber-500/25 to-orange-500/25 border-amber-500/20', aiBubble: 'bg-white/5 border-white/10', accent: 'amber', inputBorder: 'focus:border-amber-500/50' },
];

export function getAvatar(id: string): AiAvatar {
  return aiAvatars.find(a => a.id === id) || aiAvatars[0]!;
}

export function getChatTheme(id: string): AiChatTheme {
  return aiChatThemes.find(t => t.id === id) || aiChatThemes[0]!;
}
