// 10 hyper-realistic Korean actress-style AI avatar definitions for Uni AI
export interface AiAvatar {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  glow: string;
  personality: string;
  ring: string;
  face: {
    skinTone: string;
    hairColor: string;
    hairStyle: 'long-straight' | 'bob' | 'ponytail' | 'bangs' | 'wavy' | 'bun' | 'side-part' | 'twin-tail' | 'short' | 'updo';
    eyeColor: string;
    lipColor: string;
    blush: string;
    accessory?: 'glasses' | 'earrings' | 'headband';
    // Makeup details
    eyeshadow: string;      // eyeshadow colour
    eyeliner: string;       // eyeliner style/weight
    lipStyle: 'gradient' | 'full' | 'matte' | 'glossy' | 'ombre';
    // Emotion / mood
    mood: 'smile' | 'wink' | 'gentle' | 'playful' | 'confident' | 'shy' | 'cheerful' | 'cool' | 'caring' | 'mysterious';
    // Hair highlight colour for dimension
    hairHighlight: string;
  };
}

export const aiAvatars: AiAvatar[] = [
  { id: 'avatar-01', name: 'Sora', emoji: '👩', gradient: 'from-rose-400 via-pink-500 to-fuchsia-500', glow: 'shadow-pink-500/40', ring: 'ring-pink-400/50', personality: 'warm & cheerful',
    face: { skinTone: '#FDDCC4', hairColor: '#1a1a2e', hairHighlight: '#3d3050', hairStyle: 'long-straight', eyeColor: '#2d1810', lipColor: '#e85d75', blush: '#f4a0b0', eyeshadow: '#e8a0c0', eyeliner: 'wing', lipStyle: 'gradient', mood: 'smile' } },
  { id: 'avatar-02', name: 'Yuna', emoji: '👩‍💼', gradient: 'from-violet-400 via-purple-500 to-indigo-500', glow: 'shadow-violet-500/40', ring: 'ring-violet-400/50', personality: 'professional & smart',
    face: { skinTone: '#FAD4C0', hairColor: '#2a1520', hairHighlight: '#4a2838', hairStyle: 'bob', eyeColor: '#1a1a1a', lipColor: '#c4556a', blush: '#eaa0b5', eyeshadow: '#c8a0d0', eyeliner: 'sharp', lipStyle: 'matte', mood: 'confident', accessory: 'glasses' } },
  { id: 'avatar-03', name: 'Hana', emoji: '💁‍♀️', gradient: 'from-sky-400 via-blue-500 to-cyan-500', glow: 'shadow-blue-500/40', ring: 'ring-blue-400/50', personality: 'calm & helpful',
    face: { skinTone: '#FDE6D5', hairColor: '#3d2214', hairHighlight: '#6a4030', hairStyle: 'ponytail', eyeColor: '#2d1810', lipColor: '#d4687a', blush: '#f0b0c0', eyeshadow: '#b0c8e0', eyeliner: 'natural', lipStyle: 'glossy', mood: 'gentle' } },
  { id: 'avatar-04', name: 'Mina', emoji: '🧑‍💻', gradient: 'from-emerald-400 via-green-500 to-teal-500', glow: 'shadow-emerald-500/40', ring: 'ring-emerald-400/50', personality: 'tech-savvy & efficient',
    face: { skinTone: '#FDDCC4', hairColor: '#0a0a12', hairHighlight: '#202030', hairStyle: 'bangs', eyeColor: '#1a1a1a', lipColor: '#e87090', blush: '#f4a8b8', eyeshadow: '#d0b8c8', eyeliner: 'doll', lipStyle: 'ombre', mood: 'playful' } },
  { id: 'avatar-05', name: 'Jina', emoji: '👸', gradient: 'from-amber-400 via-orange-500 to-rose-500', glow: 'shadow-orange-500/40', ring: 'ring-amber-400/50', personality: 'energetic & motivating',
    face: { skinTone: '#FAD0B8', hairColor: '#5a3020', hairHighlight: '#8a5842', hairStyle: 'wavy', eyeColor: '#3d2010', lipColor: '#e05060', blush: '#f0a0a0', eyeshadow: '#e0c0a0', eyeliner: 'smoky', lipStyle: 'full', mood: 'cheerful', accessory: 'earrings' } },
  { id: 'avatar-06', name: 'Rina', emoji: '🧚', gradient: 'from-fuchsia-400 via-pink-500 to-rose-500', glow: 'shadow-fuchsia-500/40', ring: 'ring-fuchsia-400/50', personality: 'creative & playful',
    face: { skinTone: '#FDE2D0', hairColor: '#8B4513', hairHighlight: '#b06830', hairStyle: 'bun', eyeColor: '#2d1810', lipColor: '#f06080', blush: '#f4a8c0', eyeshadow: '#f0b0d0', eyeliner: 'cat', lipStyle: 'glossy', mood: 'wink', accessory: 'headband' } },
  { id: 'avatar-07', name: 'Nari', emoji: '🦸‍♀️', gradient: 'from-red-400 via-rose-500 to-pink-500', glow: 'shadow-red-500/40', ring: 'ring-red-400/50', personality: 'bold & confident',
    face: { skinTone: '#FAD4C0', hairColor: '#1a0a10', hairHighlight: '#351828', hairStyle: 'side-part', eyeColor: '#1a1a1a', lipColor: '#d03050', blush: '#e89090', eyeshadow: '#c08090', eyeliner: 'bold', lipStyle: 'matte', mood: 'cool' } },
  { id: 'avatar-08', name: 'Suji', emoji: '🧑‍🔬', gradient: 'from-cyan-400 via-teal-500 to-emerald-500', glow: 'shadow-teal-500/40', ring: 'ring-teal-400/50', personality: 'analytical & precise',
    face: { skinTone: '#FDDCC4', hairColor: '#0a0a18', hairHighlight: '#1a1a30', hairStyle: 'twin-tail', eyeColor: '#2d1810', lipColor: '#c4607a', blush: '#f0a8b8', eyeshadow: '#a8c8d0', eyeliner: 'precise', lipStyle: 'gradient', mood: 'shy', accessory: 'glasses' } },
  { id: 'avatar-09', name: 'Aeri', emoji: '🌸', gradient: 'from-pink-300 via-rose-400 to-pink-500', glow: 'shadow-pink-400/40', ring: 'ring-pink-300/50', personality: 'gentle & caring',
    face: { skinTone: '#FDE8D8', hairColor: '#2a1820', hairHighlight: '#4a3040', hairStyle: 'short', eyeColor: '#2d1810', lipColor: '#e87898', blush: '#f4b0c8', eyeshadow: '#e8c0d8', eyeliner: 'soft', lipStyle: 'ombre', mood: 'caring' } },
  { id: 'avatar-10', name: 'Dani', emoji: '💫', gradient: 'from-indigo-400 via-blue-500 to-violet-500', glow: 'shadow-indigo-500/40', ring: 'ring-indigo-400/50', personality: 'witty & insightful',
    face: { skinTone: '#FAD4C0', hairColor: '#151525', hairHighlight: '#2a2a45', hairStyle: 'updo', eyeColor: '#1a1a1a', lipColor: '#d46878', blush: '#eaa0b0', eyeshadow: '#b0a0d0', eyeliner: 'wing', lipStyle: 'full', mood: 'mysterious', accessory: 'earrings' } },
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
