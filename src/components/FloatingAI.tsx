'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Sparkles, MessageSquare, Minimize2 } from 'lucide-react';
import { useApp } from '@/lib/context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const contextHints: Record<string, { en: string[]; zh: string[] }> = {
  '/dashboard': {
    en: ['Explain the dashboard metrics', 'What needs my attention today?', 'Summarize warranty alerts'],
    zh: ['解释仪表盘指标', '今天需要注意什么？', '总结保修提醒'],
  },
  '/assets': {
    en: ['How to add a new asset?', 'Which assets need maintenance?', 'Show asset lifecycle tips'],
    zh: ['如何添加新资产？', '哪些资产需要维护？', '显示资产生命周期技巧'],
  },
  '/employees': {
    en: ['How to assign assets to employees?', 'Show department breakdown', 'Employee onboarding checklist'],
    zh: ['如何分配资产给员工？', '显示部门分类', '员工入职清单'],
  },
  '/maintenance': {
    en: ['How to create a ticket?', 'What are priority levels?', 'Show SLA guidelines'],
    zh: ['如何创建工单？', '优先级有哪些？', '显示SLA指南'],
  },
  '/change-requests': {
    en: ['How does the change process work?', 'What approval types exist?', 'Best practices for changes'],
    zh: ['变更流程如何运作？', '有哪些审批类型？', '变更最佳实践'],
  },
  '/warranty': {
    en: ['Which warranties are expiring?', 'How to renew warranty?', 'Warranty cost analysis'],
    zh: ['哪些保修即将到期？', '如何续保？', '保修费用分析'],
  },
  '/finance': {
    en: ['How to create an invoice?', 'Show revenue breakdown', 'GST calculation help'],
    zh: ['如何创建发票？', '显示收入分类', 'GST计算帮助'],
  },
  '/customers': {
    en: ['How to add a customer?', 'Show customer status types', 'Contract management tips'],
    zh: ['如何添加客户？', '显示客户状态类型', '合同管理技巧'],
  },
  '/vendors': {
    en: ['How to manage vendors?', 'Vendor evaluation criteria', 'Procurement workflow'],
    zh: ['如何管理供应商？', '供应商评估标准', '采购工作流程'],
  },
  '/crm': {
    en: ['How to log an activity?', 'CRM best practices', 'Follow-up reminders'],
    zh: ['如何记录活动？', 'CRM最佳实践', '跟进提醒'],
  },
  '/reports': {
    en: ['What reports are available?', 'How to export data?', 'Custom report tips'],
    zh: ['有哪些报告？', '如何导出数据？', '自定义报告技巧'],
  },
  '/service-desk': {
    en: ['How does the service desk work?', 'Incident vs request?', 'Escalation process'],
    zh: ['服务台如何运作？', '事件与请求的区别？', '升级流程'],
  },
  '/settings': {
    en: ['How to change theme?', 'Configure notifications', 'System settings overview'],
    zh: ['如何更改主题？', '配置通知', '系统设置概述'],
  },
  '/users': {
    en: ['How to manage roles?', 'Permission levels explained', 'Add new user guide'],
    zh: ['如何管理角色？', '权限级别说明', '添加新用户指南'],
  },
};

const offlineResponses: Record<string, { en: string; zh: string }> = {
  asset: {
    en: '**Asset Management Tips:**\n\n1. **Add Asset** - Click "+ Add Asset" button, fill in details\n2. **Track Status** - Use filters to view by status (Available, Assigned, Maintenance)\n3. **Barcode** - Scan or enter asset tags for quick lookup\n4. **Warranty** - Check warranty dates regularly under the Warranty page\n\n💡 *Tip: Keep serial numbers and purchase receipts updated for warranty claims.*',
    zh: '**资产管理技巧：**\n\n1. **添加资产** - 点击"+ 添加资产"按钮，填写详情\n2. **跟踪状态** - 使用筛选器按状态查看（可用、已分配、维护中）\n3. **条码** - 扫描或输入资产标签快速查找\n4. **保修** - 在保修页面定期检查保修日期\n\n💡 *提示：保持序列号和购买收据更新，以便保修索赔。*',
  },
  employee: {
    en: '**Employee Management:**\n\n- **Add Employee** - Use the form to register new employees\n- **Assign Assets** - Link assets to employees from the Assets page\n- **Departments** - Filter by department for team views\n- **Status** - Track active/inactive employee status\n\n💡 *Tip: Update employee records when they change departments or leave the company.*',
    zh: '**员工管理：**\n\n- **添加员工** - 使用表单注册新员工\n- **分配资产** - 从资产页面将资产与员工关联\n- **部门** - 按部门筛选查看团队\n- **状态** - 跟踪在职/离职员工状态\n\n💡 *提示：当员工更换部门或离职时更新员工记录。*',
  },
  default: {
    en: '**I can help you with:**\n\n🔹 **Assets** - Add, track, and manage IT equipment\n🔹 **Maintenance** - Create and manage support tickets\n🔹 **Warranty** - Monitor warranty expiration dates\n🔹 **Reports** - View analytics and generate reports\n🔹 **Change Requests** - Track IT changes with approval workflows\n\nAsk me anything about the Unitech IT System! You can also visit the **AI Assistant** page for a full chat experience.',
    zh: '**我可以帮助您：**\n\n🔹 **资产** - 添加、跟踪和管理IT设备\n🔹 **维护** - 创建和管理支持工单\n🔹 **保修** - 监控保修到期日期\n🔹 **报告** - 查看分析和生成报告\n🔹 **变更请求** - 使用审批工作流跟踪IT变更\n\n问我任何关于Unitech IT系统的问题！您也可以访问**AI助手**页面获得完整的聊天体验。',
  },
};

function getOfflineResponse(input: string, lang: 'en' | 'zh'): string {
  const lower = input.toLowerCase();
  if (lower.includes('asset') || lower.includes('laptop') || lower.includes('equipment') || lower.includes('资产')) {
    return offlineResponses.asset[lang];
  }
  if (lower.includes('employee') || lower.includes('staff') || lower.includes('员工')) {
    return offlineResponses.employee[lang];
  }
  return offlineResponses.default[lang];
}

export default function FloatingAI() {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect current page path
  const [currentPath, setCurrentPath] = useState('/dashboard');
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const hints = contextHints[currentPath] || contextHints['/dashboard'];
  const currentHints = hints![lang as 'en' | 'zh'] || hints!.en;

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message }]);
    } catch {
      const fallback = getOfflineResponse(text, lang as 'en' | 'zh');
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25 flex items-center justify-center text-white hover:shadow-xl hover:shadow-violet-500/40 transition-shadow"
            onClick={() => setOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={lang === 'en' ? 'AI Assistant' : 'AI 助手'}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Bot className="w-6 h-6" />
            </motion.div>
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-violet-400"
              animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-96 h-[500px] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.1)',
            }}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold">{lang === 'en' ? 'AI Assistant' : 'AI 助手'}</h3>
                  <p className="text-white/40 text-[10px]">{lang === 'en' ? 'Ask me anything' : '有什么可以帮您'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button onClick={() => { setOpen(false); setMessages([]); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <motion.div
                      className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-3"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <MessageSquare className="w-6 h-6 text-violet-400" />
                    </motion.div>
                    <p className="text-white/50 text-xs">{lang === 'en' ? 'Try asking:' : '试试问我：'}</p>
                  </div>
                  {currentHints.map((hint, i) => (
                    <motion.button
                      key={i}
                      className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70 text-xs transition-all"
                      onClick={() => sendMessage(hint)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ x: 4 }}
                    >
                      <Sparkles className="w-3 h-3 text-violet-400 inline mr-2" />
                      {hint}
                    </motion.button>
                  ))}
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 text-white border border-violet-500/20'
                      : 'bg-white/5 text-white/80 border border-white/10'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-violet-400"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={lang === 'en' ? 'Ask AI anything...' : '问AI任何问题...'}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                  disabled={loading}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white disabled:opacity-40"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
