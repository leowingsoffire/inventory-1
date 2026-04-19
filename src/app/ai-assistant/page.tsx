'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Sparkles, Lightbulb, Mic, MicOff, Volume2 } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import { getAvatar, getChatTheme } from '@/lib/ai-avatars';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const suggestedQuestions = {
  en: [
    'How many assets are due for warranty renewal?',
    'Which department has the most assigned assets?',
    'Recommend a laptop replacement plan for aging devices',
    'Generate a monthly IT asset report summary',
    'What are the top maintenance issues this quarter?',
    'Suggest cost optimization strategies for IT inventory',
  ],
  zh: [
    '有多少资产需要保修续期？',
    '哪个部门分配的资产最多？',
    '为老旧设备推荐笔记本替换计划',
    '生成月度IT资产报告摘要',
    '本季度主要的维护问题有哪些？',
    '建议IT资产库存的成本优化策略',
  ],
};

const aiResponses: Record<string, { en: string; zh: string }> = {
  warranty: {
    en: `Based on my analysis of your inventory:\n\n**Warranty Alerts:**\n- **3 assets** have warranties expiring within 30 days\n- **iPhone 15 Pro** (UT-PH-001) - expires Oct 2025\n- **HP LaserJet Pro** (UT-PR-001) - expires May 2025\n- **Dell PowerEdge R740** (UT-SV-001) - expires Aug 2026\n\n**Recommendation:** Consider purchasing extended warranty for the server as it's a critical asset. Budget estimate: SGD $1,200/year.\n\nWant me to draft a renewal plan?\nShould I compare warranty providers?`,
    zh: `根据我对库存的分析：\n\n**保修提醒：**\n- **3项资产**的保修将在30天内到期\n- **iPhone 15 Pro** (UT-PH-001) - 2025年10月到期\n- **HP LaserJet Pro** (UT-PR-001) - 2025年5月到期\n- **Dell PowerEdge R740** (UT-SV-001) - 2026年8月到期\n\n**建议：** 考虑为服务器购买延长保修，因为它是关键资产。预算估计：每年1,200新元。\n\n需要我起草续保计划吗？\n要不要比较保修供应商？`,
  },
  department: {
    en: `**Asset Distribution by Department:**\n\n| Department | Assets | Value (SGD) |\n|---|---|---|\n| Engineering | 38 | $145,200 |\n| IT Department | 25 | $89,500 |\n| Sales | 18 | $42,300 |\n| Marketing | 12 | $28,800 |\n| HR | 8 | $15,600 |\n| Finance | 7 | $12,400 |\n| Operations | 10 | $18,200 |\n\n**Engineering** has the most assigned assets at **38 units** valued at **SGD $145,200**.\n\nWant me to show the trend over time?\nShould I flag underutilized assets?`,
    zh: `**按部门资产分布：**\n\n| 部门 | 资产数 | 价值 (新元) |\n|---|---|---|\n| 工程部 | 38 | $145,200 |\n| IT部门 | 25 | $89,500 |\n| 销售部 | 18 | $42,300 |\n| 市场部 | 12 | $28,800 |\n| 人力资源 | 8 | $15,600 |\n| 财务部 | 7 | $12,400 |\n| 运营部 | 10 | $18,200 |\n\n**工程部**拥有最多的分配资产，共**38台**，价值**145,200新元**。\n\n要查看趋势变化吗？\n要标记利用率低的资产吗？`,
  },
  default: {
    en: `I've analyzed your IT inventory data. Here's what I found:\n\n**Key Metrics:**\n- Total Assets: 118 units\n- Total Value: SGD $352,000\n- Utilization Rate: 75.4%\n- Average Asset Age: 2.3 years\n\n**Action Items:**\n1. 3 warranties expiring soon\n2. 5 assets recommended for upgrade\n3. 2 open high-priority tickets\n\nWould you like me to elaborate on any of these points?\nShould I generate a detailed report?`,
    zh: `我已分析您的IT库存数据。以下是我的发现：\n\n**关键指标：**\n- 资产总数：118台\n- 总价值：352,000新元\n- 利用率：75.4%\n- 平均资产年龄：2.3年\n\n**待办事项：**\n1. 3项保修即将到期\n2. 5项资产建议升级\n3. 2个高优先级工单待处理\n\n需要我详细说明其中任何一点吗？\n需要生成详细报告吗？`,
  },
};

function getOfflineResponse(message: string, lang: 'en' | 'zh'): string {
  const lower = message.toLowerCase();
  if (lower.includes('warranty') || lower.includes('保修')) return aiResponses.warranty[lang];
  if (lower.includes('department') || lower.includes('部门')) return aiResponses.department[lang];
  return aiResponses.default[lang];
}

function extractSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('?') && line.length < 80 && !line.startsWith('#') && !line.startsWith('|')) {
      const clean = line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
      if (clean.length > 10 && clean.length < 70) suggestions.push(clean);
    }
  }
  return suggestions.slice(0, 3);
}

export default function AIAssistantPage() {
  const { lang, aiApiKey, aiAvatar, aiChatTheme } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const questions = suggestedQuestions[lang];
  const avatar = getAvatar(aiAvatar);
  const chatTheme = getChatTheme(aiChatTheme);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: String(Date.now()), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    let responseText: string;
    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, apiKey: aiApiKey || undefined }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      responseText = data.content || data.message;
    } catch {
      responseText = getOfflineResponse(text, lang);
    }

    const suggestions = extractSuggestions(responseText);
    const aiMsg: Message = { id: String(Date.now() + 1), role: 'assistant', content: responseText, timestamp: new Date(), suggestions };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-130px)] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <motion.div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatar.gradient} flex items-center justify-center shadow-lg ${avatar.glow} relative overflow-hidden`}
              animate={{ rotateY: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-white/15 rounded-xl" />
              <span className="relative z-10 text-lg">{avatar.emoji}</span>
            </motion.div>
            Uni AI — {avatar.name}
          </h1>
          <p className="text-white/50 text-sm mt-1">{avatar.personality} • {t('ai.subtitle', lang)}</p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card p-4 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <motion.div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatar.gradient} ${avatar.glow} flex items-center justify-center mb-6 relative overflow-hidden`}
                  animate={{ y: [0, -10, 0], rotateY: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-white/20 rounded-2xl" />
                  <div className="absolute inset-0.5 rounded-[14px] border border-white/30" />
                  <span className="relative z-10 text-4xl drop-shadow-lg">{avatar.emoji}</span>
                </motion.div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {lang === 'en' ? `Hi! I'm ${avatar.name} — your Uni AI` : `嗨！我是${avatar.name} — 您的Uni AI`}
                </h3>
                <p className="text-white/40 text-sm mb-8 max-w-md">
                  {lang === 'en'
                    ? 'Ask me about your IT inventory, generate reports, get maintenance recommendations, or analyze asset data.'
                    : '向我询问您的IT资产、生成报告、获取维护建议或分析资产数据。'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                  {questions.map((q, i) => (
                    <motion.button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs transition-all flex items-start gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatar.gradient} ${avatar.glow} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/15 rounded-xl" />
                    <span className="relative z-10 text-sm">{avatar.emoji}</span>
                  </div>
                )}
                <div className="max-w-[80%] space-y-2">
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? `bg-gradient-to-r ${chatTheme.userBubble} border border-white/10 rounded-tr-md`
                      : `${chatTheme.aiBubble} border border-white/5 rounded-tl-md`
                  }`}>
                    <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    <p className="text-white/20 text-xs mt-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Voice + Suggested reply cards */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => speak(msg.content)} className="text-white/20 hover:text-white/50 transition-colors p-1" title={lang === 'en' ? 'Read aloud' : '朗读'}>
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      {msg.suggestions && msg.suggestions.map((s, i) => (
                        <motion.button
                          key={i}
                          onClick={() => sendMessage(s)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] text-white/50 text-[11px] transition-all hover:text-white/70"
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
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-accent-500/20 border border-accent-400/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-accent-400" />
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatar.gradient} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/15 rounded-xl" />
                  <motion.span className="relative z-10 text-sm" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>{avatar.emoji}</motion.span>
                </div>
                <div className={`p-4 rounded-2xl ${chatTheme.aiBubble} border border-white/5 rounded-tl-md`}>
                  <div className="flex gap-1">
                    <motion.div className="w-2 h-2 rounded-full bg-white/40" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-white/40" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-white/40" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input with Voice */}
          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <motion.button
              type="button"
              onClick={toggleVoice}
              className={`px-3 py-3 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/10'}`}
              whileTap={{ scale: 0.9 }}
              title={lang === 'en' ? 'Voice input' : '语音输入'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? (lang === 'en' ? '🎙 Listening...' : '🎙 聆听中...') : (lang === 'en' ? 'Ask Uni AI...' : '问 Uni AI...')}
              className={`glass-input flex-1 px-4 py-3 text-sm ${chatTheme.inputBorder}`}
              disabled={isTyping}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`px-4 py-3 bg-gradient-to-r ${avatar.gradient} disabled:opacity-40 text-white rounded-xl transition-all flex items-center gap-2 shadow-md`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      </motion.div>
    </MainLayout>
  );
}
