'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, X, Sparkles, Minimize2, Settings2, Mic, MicOff,
  AlertTriangle, Shield, Bell, ChevronRight, Volume2, Paperclip,
  FileText, FileSpreadsheet, FileImage, File,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { aiAvatars, aiChatThemes, getAvatar, getChatTheme } from '@/lib/ai-avatars';

interface FileAttachment {
  fileName: string;
  fileType: string;
  fileCategory: string;
  fileSize: number;
  extractedText: string;
  previewDataUrl?: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  attachment?: FileAttachment;
}

interface AlertTip {
  id: string;
  text: string;
  icon: 'warning' | 'security' | 'info';
  shown: number;
}

// Context-based suggested replies per page
const contextSuggestions: Record<string, { en: string[]; zh: string[] }> = {
  '/dashboard': {
    en: ['What needs attention today?', 'Summarize my alerts', 'Show quick stats'],
    zh: ['今天需要关注什么？', '总结我的提醒', '显示快速统计'],
  },
  '/assets': {
    en: ['Assets needing upgrade?', 'Show warranty risks', 'Add new asset guide'],
    zh: ['需要升级的资产？', '显示保修风险', '添加资产指南'],
  },
  '/maintenance': {
    en: ['Open high-priority tickets', 'Create a ticket', 'SLA status check'],
    zh: ['高优先级工单', '创建工单', 'SLA状态检查'],
  },
  '/compliance': {
    en: ['PDPA compliance score?', 'What controls need work?', 'Next review dates'],
    zh: ['PDPA合规评分？', '哪些控制需要改进？', '下次审核日期'],
  },
  '/finance': {
    en: ['Create invoice help', 'Revenue overview', 'GST calculation'],
    zh: ['创建发票帮助', '收入概览', 'GST计算'],
  },
  '/warranty': {
    en: ['Which warranties expiring?', 'Renewal options', 'Warranty cost trend'],
    zh: ['哪些保修即将到期？', '续保选项', '保修费用趋势'],
  },
  '/employees': {
    en: ['How to assign assets?', 'Department breakdown', 'Onboarding checklist'],
    zh: ['如何分配资产？', '部门分类', '入职清单'],
  },
  '/change-requests': {
    en: ['Change process overview', 'Pending approvals', 'Best practices'],
    zh: ['变更流程概述', '待审批项', '最佳实践'],
  },
  '/service-desk': {
    en: ['How does service desk work?', 'Incident vs request?', 'Escalation process'],
    zh: ['服务台如何运作？', '事件与请求的区别？', '升级流程'],
  },
  '/settings': {
    en: ['How to change theme?', 'Configure system', 'Manage integrations'],
    zh: ['如何更改主题？', '配置系统', '管理集成'],
  },
  default: {
    en: ['What can you do?', 'Show my priorities', 'Any security alerts?'],
    zh: ['你能做什么？', '显示我的优先事项', '有安全提醒吗？'],
  },
};

// Smart alerts — trusted sources only
const smartAlerts: AlertTip[] = [
  { id: 'a1', text: '3 warranties expiring within 30 days — review recommended', icon: 'warning', shown: 0 },
  { id: 'a2', text: 'PDPA assessment has 5 controls not started — action needed', icon: 'info', shown: 0 },
  { id: 'a3', text: 'CSA Singapore: New advisory on ransomware targeting SMEs', icon: 'security', shown: 0 },
  { id: 'a4', text: '2 high-priority maintenance tickets unresolved for 48h+', icon: 'warning', shown: 0 },
  { id: 'a5', text: 'NIST: Critical CVE published for common enterprise software', icon: 'security', shown: 0 },
];

// Extract follow-up questions from AI response as suggestion cards
function extractSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('?') && line.length < 80 && !line.startsWith('#')) {
      const clean = line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
      if (clean.length > 10 && clean.length < 70) suggestions.push(clean);
    }
  }
  return suggestions.slice(0, 3);
}

// Offline fallback responses in Uni AI personality
function getOfflineResponse(input: string, lang: 'en' | 'zh'): string {
  const lower = input.toLowerCase();
  if (lower.includes('asset') || lower.includes('laptop') || lower.includes('equipment') || lower.includes('资产')) {
    return lang === 'en'
      ? "Hey! Here's what I'd suggest:\n\n- **Check warranty dates** — a few might be expiring soon\n- **Run a quick audit** to spot unused assets\n- Use the barcode scanner for fast lookups\n\nWant me to pull up specific asset details?"
      : "嗨！这是我的建议：\n\n- **检查保修日期** — 一些可能即将到期\n- **运行快速审计** 以发现闲置资产\n- 使用条码扫描器快速查找\n\n需要我查看具体资产详情吗？";
  }
  if (lower.includes('compliance') || lower.includes('pdpa') || lower.includes('合规')) {
    return lang === 'en'
      ? "Good call checking compliance! Your PDPA assessment tracks 22 controls.\n\nI'd recommend:\n- **Review non-compliant controls** first\n- **Assign responsible persons** where missing\n- **Set review dates** for upcoming audits\n\nShall I walk you through the critical ones?"
      : "检查合规是明智的！您的PDPA评估跟踪22项控制。\n\n我建议：\n- 首先**审查不合规的控制项**\n- **分配负责人**\n- **设置审核日期**\n\n需要我带您了解关键项目吗？";
  }
  return lang === 'en'
    ? "I'm Uni AI — your IT sidekick! 💫\n\nI can help with:\n- **Assets & warranty** tracking\n- **Maintenance** ticket guidance\n- **PDPA compliance** checks\n- **Finance** & invoice questions\n- **Security** awareness tips\n\nWhat would you like to tackle first?"
    : "我是 Uni AI — 您的IT助手！💫\n\n我可以帮助：\n- **资产和保修** 跟踪\n- **维护** 工单指南\n- **PDPA合规** 检查\n- **财务** 和发票问题\n- **安全** 意识提示\n\n您想先处理什么？";
}

export default function FloatingAI() {
  const { lang, aiApiKey, aiAvatar, setAiAvatar, aiChatTheme, setAiChatTheme } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAvatars, setShowAvatars] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [activeAlert, setActiveAlert] = useState<AlertTip | null>(null);
  const [alertQueue, setAlertQueue] = useState<AlertTip[]>([...smartAlerts]);
  const [appContext, setAppContext] = useState<Record<string, unknown> | null>(null);
  const [aiSource, setAiSource] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<FileAttachment | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const avatar = getAvatar(aiAvatar);
  const chatTheme = getChatTheme(aiChatTheme);

  useEffect(() => { setCurrentPath(window.location.pathname); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open && !showSettings) inputRef.current?.focus(); }, [open, showSettings]);

  // Fetch live app data context for AI — refreshes every 60 seconds and when chat opens
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await fetch('/api/ai/context');
        if (res.ok) {
          const data = await res.json();
          setAppContext(data);
        }
      } catch { /* silent — will use cached context */ }
    };
    fetchContext();
    const interval = setInterval(fetchContext, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh context when chat opens
  useEffect(() => {
    if (open) {
      setCurrentPath(window.location.pathname);
      fetch('/api/ai/context').then(r => r.ok ? r.json() : null).then(data => {
        if (data) setAppContext(data);
      }).catch(() => {});
    }
  }, [open]);

  // Smart alert tooltip system — show alerts near button, dismiss after 5s, reappear up to 2 more times
  useEffect(() => {
    if (open || activeAlert) return;
    const interval = setInterval(() => {
      setAlertQueue(prev => {
        const next = prev.find(a => a.shown < 3);
        if (next) {
          setActiveAlert({ ...next, shown: next.shown + 1 });
          return prev.map(a => a.id === next.id ? { ...a, shown: a.shown + 1 } : a);
        }
        return prev;
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [open, activeAlert]);

  // Auto-dismiss alert tooltip after 5 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => setActiveAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  // Voice recognition using Web Speech API
  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0]?.[0]?.transcript || '';
      if (text) { setInput(text); setIsListening(false); }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, lang]);

  // Text-to-speech for AI responses
  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const clean = text.replace(/[*#_`|]/g, '').replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 1;
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const pathKey = Object.keys(contextSuggestions).find(k => currentPath.startsWith(k)) || 'default';
  const currentSuggestions = contextSuggestions[pathKey]![lang as 'en' | 'zh'] || contextSuggestions.default!.en;

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ai/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Upload failed');
        return;
      }
      const data = await res.json();
      setPendingFile(data);
    } catch {
      alert(lang === 'en' ? 'Failed to upload file' : '文件上传失败');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'word': case 'pdf': case 'text': return FileText;
      case 'excel': case 'spreadsheet': return FileSpreadsheet;
      case 'image': return FileImage;
      default: return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() && !pendingFile) return;
    
    // Build message content: if file is attached, prefix with file context
    let messageContent = text.trim();
    const attachment = pendingFile || undefined;
    
    if (pendingFile) {
      const filePrefix = pendingFile.fileCategory === 'image'
        ? `[Attached image: ${pendingFile.fileName}]`
        : `[Attached ${pendingFile.fileCategory} file: ${pendingFile.fileName}]`;
      messageContent = messageContent ? `${filePrefix}\n${messageContent}` : `${filePrefix}\nPlease analyze this file.`;
      setPendingFile(null);
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: messageContent, attachment };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build chat history — inject file content as context
    let aiMessageContent = messageContent;
    if (attachment && attachment.extractedText) {
      aiMessageContent = `${messageContent}\n\n--- FILE CONTENT (${attachment.fileName}) ---\n${attachment.extractedText}\n--- END FILE ---`;
    }

    let responseText: string;
    try {
      const chatHistory = [...messages, { role: 'user' as const, content: aiMessageContent }]
        .map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          apiKey: aiApiKey || undefined,
          currentPage: currentPath,
          appContext: appContext || undefined,
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      responseText = data.content || data.message;
      if (data.source) setAiSource(data.source);
    } catch {
      responseText = getOfflineResponse(text, lang as 'en' | 'zh');
      setAiSource('local-fallback');
    }

    const suggestions = extractSuggestions(responseText);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText, suggestions };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  // 3D Animated Avatar component — CSS gradients + perspective transforms
  const Avatar3D = ({ size = 'md', animate = true }: { size?: 'sm' | 'md' | 'lg'; animate?: boolean }) => {
    const sizeMap = { sm: 'w-8 h-8 text-lg', md: 'w-12 h-12 text-2xl', lg: 'w-16 h-16 text-3xl' };
    const comp = (
      <div className={`${sizeMap[size]} rounded-2xl bg-gradient-to-br ${avatar.gradient} flex items-center justify-center shadow-lg ${avatar.glow} relative overflow-hidden`}
        style={{ perspective: '500px', transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 via-transparent to-white/20" />
        <div className="absolute inset-0.5 rounded-[14px] border border-white/30" />
        <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-white/15 rounded-b-full blur-sm" />
        <span className="relative z-10 drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{avatar.emoji}</span>
      </div>
    );
    if (!animate) return comp;
    return (
      <motion.div
        animate={{ rotateY: [0, 8, -8, 0], rotateX: [0, -4, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {comp}
      </motion.div>
    );
  };

  const alertIcons = { warning: AlertTriangle, security: Shield, info: Bell };

  return (
    <>
      {/* Smart Alert Tooltip — appears near floating button */}
      <AnimatePresence>
        {activeAlert && !open && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 max-w-xs"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
          >
            <button
              onClick={() => { setActiveAlert(null); setOpen(true); }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-gray-900/95 to-gray-800/95 border border-white/15 shadow-xl backdrop-blur-xl text-left"
            >
              {(() => { const Icon = alertIcons[activeAlert.icon]; return <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${activeAlert.icon === 'warning' ? 'text-amber-400' : activeAlert.icon === 'security' ? 'text-red-400' : 'text-blue-400'}`} />; })()}
              <div>
                <p className="text-white/80 text-[11px] leading-relaxed">{activeAlert.text}</p>
                <p className="text-white/30 text-[9px] mt-1">Uni AI • tap to chat</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Animated Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            className={`fixed bottom-6 right-6 z-50 rounded-2xl shadow-xl ${avatar.glow} flex items-center justify-center text-white hover:shadow-2xl transition-shadow`}
            onClick={() => { setOpen(true); setActiveAlert(null); }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="Uni AI"
          >
            <Avatar3D size="md" />
            <motion.div
              className={`absolute inset-0 rounded-2xl border-2 ${avatar.ring}`}
              animate={{ scale: [1, 1.25, 1.25], opacity: [0.6, 0, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-4 right-4 z-50 w-[380px] sm:w-[400px] h-[540px] flex flex-col rounded-2xl overflow-hidden"
            style={{
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.04)',
            }}
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Theme background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${chatTheme.bg} opacity-95`} />

            {/* Header with avatar + Uni AI branding */}
            <div className={`relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r ${chatTheme.headerGradient}`}>
              <div className="flex items-center gap-3">
                <Avatar3D size="sm" animate={false} />
                <div>
                  <h3 className="text-white text-sm font-semibold">Uni AI — {avatar.name}</h3>
                  <p className="text-white/35 text-[10px]">
                    {aiSource === 'local-fallback'
                      ? (lang === 'en' ? '⚡ Offline mode' : '⚡ 离线模式')
                      : (lang === 'en' ? `${avatar.personality} • Azure AI ✓` : `Azure AI ✓ • 随时为您服务`)
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/35 hover:text-white transition-colors" title={lang === 'en' ? 'Settings' : '设置'}>
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/35 hover:text-white transition-colors">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setOpen(false); setMessages([]); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/35 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Settings Panel — Avatar & Chat Theme Picker */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  className="relative border-b border-white/10 overflow-y-auto"
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  style={{ maxHeight: 320 }}
                >
                  <div className="p-3 space-y-3">
                    {/* Avatar picker */}
                    <div>
                      <button onClick={() => setShowAvatars(!showAvatars)} className="flex items-center gap-1.5 text-white/50 text-[10px] font-medium uppercase tracking-wider mb-2">
                        <ChevronRight className={`w-3 h-3 transition-transform ${showAvatars ? 'rotate-90' : ''}`} />
                        {lang === 'en' ? 'Choose Avatar' : '选择头像'}
                      </button>
                      {showAvatars && (
                        <div className="grid grid-cols-5 gap-2">
                          {aiAvatars.map(av => (
                            <motion.button
                              key={av.id}
                              onClick={() => setAiAvatar(av.id)}
                              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                aiAvatar === av.id ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${av.gradient} flex items-center justify-center text-sm shadow-md relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/15 rounded-xl" />
                                <span className="relative z-10">{av.emoji}</span>
                              </div>
                              <span className="text-white/50 text-[9px]">{av.name}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chat theme picker */}
                    <div>
                      <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-2">{lang === 'en' ? 'Chat Theme' : '聊天主题'}</p>
                      <div className="flex gap-2">
                        {aiChatThemes.map(th => (
                          <motion.button
                            key={th.id}
                            onClick={() => setAiChatTheme(th.id)}
                            className={`flex-1 p-2 rounded-xl border transition-all ${
                              aiChatTheme === th.id ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                            }`}
                            whileHover={{ scale: 1.03 }}
                          >
                            <div className={`w-full h-5 rounded-lg bg-gradient-to-r ${th.bg} border border-white/10 mb-1`} />
                            <span className="text-white/50 text-[9px]">{th.name}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="relative flex-1 overflow-y-auto p-3 space-y-3">
              {/* Welcome screen with 3D avatar + suggestions */}
              {messages.length === 0 && !showSettings && (
                <div className="space-y-3">
                  <div className="text-center py-3">
                    <Avatar3D size="lg" />
                    <h4 className="text-white font-semibold text-sm mt-3">
                      {lang === 'en' ? `Hi! I'm ${avatar.name} 💫` : `嗨！我是${avatar.name} 💫`}
                    </h4>
                    <p className="text-white/40 text-[11px] mt-1">
                      {lang === 'en' ? 'Your Uni AI assistant — ask me anything!' : '您的 Uni AI 助手 — 问我任何事！'}
                    </p>
                  </div>
                  {/* Context-aware suggestion cards */}
                  <div className="space-y-1.5">
                    {currentSuggestions.map((hint, i) => (
                      <motion.button
                        key={i}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 text-white/60 text-[11px] transition-all flex items-center gap-2"
                        onClick={() => sendMessage(hint)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ x: 3 }}
                      >
                        <Sparkles className="w-3 h-3 text-white/25 flex-shrink-0" />
                        {hint}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat messages with avatar + suggested reply cards */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {msg.role === 'assistant' && (
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-xs flex-shrink-0 mt-1 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/15" />
                      <span className="relative z-10">{avatar.emoji}</span>
                    </div>
                  )}
                  <div className="max-w-[82%] space-y-1.5">
                    {/* File attachment card */}
                    {msg.attachment && (
                      <div className={`p-2.5 rounded-xl border border-white/10 ${msg.role === 'user' ? 'bg-white/5' : 'bg-white/[0.03]'} flex items-center gap-2.5 mb-1`}>
                        {msg.attachment.previewDataUrl ? (
                          <img src={msg.attachment.previewDataUrl} alt={msg.attachment.fileName} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          (() => { const FIcon = getFileIcon(msg.attachment.fileCategory); return <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><FIcon className="w-5 h-5 text-white/50" /></div>; })()
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-[10px] font-medium truncate">{msg.attachment.fileName}</p>
                          <p className="text-white/30 text-[9px]">{formatFileSize(msg.attachment.fileSize)}</p>
                        </div>
                      </div>
                    )}
                    <div className={`p-3 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? `bg-gradient-to-r ${chatTheme.userBubble} text-white border border-white/10 rounded-tr-md`
                        : `${chatTheme.aiBubble} text-white/80 border border-white/5 rounded-tl-md`
                    }`}>
                      {msg.content}
                    </div>
                    {/* Read aloud button for AI messages */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speak(msg.content)}
                        className="text-white/20 hover:text-white/50 transition-colors p-0.5"
                        title={lang === 'en' ? 'Read aloud' : '朗读'}
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                    {/* Suggested reply cards after AI response */}
                    {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {msg.suggestions.map((s, i) => (
                          <motion.button
                            key={i}
                            onClick={() => sendMessage(s)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] text-white/50 text-[10px] transition-all hover:text-white/70"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ scale: 1.03 }}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator with animated avatar */}
              {loading && (
                <motion.div className="flex items-start gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-xs relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/15" />
                    <motion.span className="relative z-10" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>{avatar.emoji}</motion.span>
                  </div>
                  <div className={`${chatTheme.aiBubble} border border-white/5 p-3 rounded-xl rounded-tl-md flex items-center gap-1.5`}>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white/30"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area with Voice + Attach + Send */}
            <div className="relative p-3 border-t border-white/10">
              {/* Pending file preview */}
              {pendingFile && (
                <div className="mb-2 p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  {pendingFile.previewDataUrl ? (
                    <img src={pendingFile.previewDataUrl} alt={pendingFile.fileName} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    (() => { const FIcon = getFileIcon(pendingFile.fileCategory); return <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><FIcon className="w-4 h-4 text-white/50" /></div>; })()
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 text-[10px] truncate">{pendingFile.fileName}</p>
                    <p className="text-white/30 text-[9px]">{formatFileSize(pendingFile.fileSize)}</p>
                  </div>
                  <button onClick={() => setPendingFile(null)} className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/50">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {/* Uploading indicator */}
              {uploadingFile && (
                <div className="mb-2 p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <motion.div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  <p className="text-white/40 text-[10px]">{lang === 'en' ? 'Processing file...' : '处理文件中...'}</p>
                </div>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex items-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.csv,.txt"
                  onChange={handleFileUpload}
                />
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-xl transition-all ${pendingFile ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/10'}`}
                  whileTap={{ scale: 0.9 }}
                  title={lang === 'en' ? 'Attach file' : '附加文件'}
                  disabled={loading || uploadingFile}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/10'}`}
                  whileTap={{ scale: 0.9 }}
                  title={lang === 'en' ? 'Voice input' : '语音输入'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </motion.button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? (lang === 'en' ? '🎙 Listening...' : '🎙 聆听中...') : pendingFile ? (lang === 'en' ? 'Ask about this file...' : '询问此文件...') : (lang === 'en' ? 'Ask Uni AI...' : '问 Uni AI...')}
                  className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/25 focus:outline-none ${chatTheme.inputBorder}`}
                  disabled={loading}
                />
                <motion.button
                  type="submit"
                  disabled={(!input.trim() && !pendingFile) || loading}
                  className={`p-2 rounded-xl bg-gradient-to-r ${avatar.gradient} text-white disabled:opacity-30 shadow-md`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
