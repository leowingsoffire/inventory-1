'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, Sparkles, Lightbulb, MessageSquare } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
    en: `Based on my analysis of your inventory:\n\n**🔔 Warranty Alerts:**\n- **3 assets** have warranties expiring within 30 days\n- **iPhone 15 Pro** (UT-PH-001) - expires Oct 2025\n- **HP LaserJet Pro** (UT-PR-001) - expires May 2025\n- **Dell PowerEdge R740** (UT-SV-001) - expires Aug 2026\n\n**💡 Recommendation:** Consider purchasing extended warranty for the server as it's a critical asset. Budget estimate: SGD $1,200/year.`,
    zh: `根据我对库存的分析：\n\n**🔔 保修提醒：**\n- **3项资产**的保修将在30天内到期\n- **iPhone 15 Pro** (UT-PH-001) - 2025年10月到期\n- **HP LaserJet Pro** (UT-PR-001) - 2025年5月到期\n- **Dell PowerEdge R740** (UT-SV-001) - 2026年8月到期\n\n**💡 建议：** 考虑为服务器购买延长保修，因为它是关键资产。预算估计：每年1,200新元。`,
  },
  department: {
    en: `**📊 Asset Distribution by Department:**\n\n| Department | Assets | Value (SGD) |\n|---|---|---|\n| Engineering | 38 | $145,200 |\n| IT Department | 25 | $89,500 |\n| Sales | 18 | $42,300 |\n| Marketing | 12 | $28,800 |\n| HR | 8 | $15,600 |\n| Finance | 7 | $12,400 |\n| Operations | 10 | $18,200 |\n\n**Engineering** has the most assigned assets at **38 units** valued at **SGD $145,200**.`,
    zh: `**📊 按部门资产分布：**\n\n| 部门 | 资产数 | 价值 (新元) |\n|---|---|---|\n| 工程部 | 38 | $145,200 |\n| IT部门 | 25 | $89,500 |\n| 销售部 | 18 | $42,300 |\n| 市场部 | 12 | $28,800 |\n| 人力资源 | 8 | $15,600 |\n| 财务部 | 7 | $12,400 |\n| 运营部 | 10 | $18,200 |\n\n**工程部**拥有最多的分配资产，共**38台**，价值**145,200新元**。`,
  },
  default: {
    en: `I've analyzed your IT inventory data. Here's what I found:\n\n**📈 Key Metrics:**\n- Total Assets: 118 units\n- Total Value: SGD $352,000\n- Utilization Rate: 75.4%\n- Average Asset Age: 2.3 years\n\n**🔧 Action Items:**\n1. 3 warranties expiring soon\n2. 5 assets recommended for upgrade\n3. 2 open high-priority tickets\n\nWould you like me to elaborate on any of these points?`,
    zh: `我已分析您的IT库存数据。以下是我的发现：\n\n**📈 关键指标：**\n- 资产总数：118台\n- 总价值：352,000新元\n- 利用率：75.4%\n- 平均资产年龄：2.3年\n\n**🔧 待办事项：**\n1. 3项保修即将到期\n2. 5项资产建议升级\n3. 2个高优先级工单待处理\n\n您需要我详细说明其中任何一点吗？`,
  },
};

function getOfflineResponse(message: string, lang: 'en' | 'zh'): string {
  const lower = message.toLowerCase();
  if (lower.includes('warranty') || lower.includes('保修')) return aiResponses.warranty[lang];
  if (lower.includes('department') || lower.includes('部门')) return aiResponses.department[lang];
  return aiResponses.default[lang];
}

export default function AIAssistantPage() {
  const { lang, aiApiKey } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const questions = suggestedQuestions[lang];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      responseText = data.content;
    } catch {
      responseText = getOfflineResponse(text, lang);
    }

    const aiMsg: Message = { id: String(Date.now() + 1), role: 'assistant', content: responseText, timestamp: new Date() };
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Bot className="w-7 h-7 text-violet-400" />
            </motion.div>
            {t('ai.title', lang)}
          </h1>
          <p className="text-white/50 text-sm mt-1">{t('ai.subtitle', lang)}</p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card p-4 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center mb-6"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-10 h-10 text-violet-400" />
                </motion.div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {lang === 'en' ? 'How can I help you today?' : '今天我能帮您什么？'}
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
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                )}
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-500/20 border border-blue-400/30 rounded-tr-md'
                    : 'bg-white/5 border border-white/10 rounded-tl-md'
                }`}>
                  <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  <p className="text-white/20 text-xs mt-2">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-md">
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

          {/* Input */}
          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder', lang)}
              className="glass-input flex-1 px-4 py-3 text-sm"
              disabled={isTyping}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-4 py-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white rounded-xl transition-all flex items-center gap-2"
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
