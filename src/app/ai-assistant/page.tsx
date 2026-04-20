'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Lightbulb, Mic, MicOff, Volume2, Paperclip, FileText, FileSpreadsheet, FileImage, File, X, MessageSquare, FolderOpen, BookOpen, Upload, Wand2, Eye, Trash2, RefreshCw, Clock, ChevronDown, ChevronUp, Download } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import { getAvatar, getChatTheme } from '@/lib/ai-avatars';
import KoreanFaceAvatar from '@/components/KoreanFaceAvatar';

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
  timestamp: Date;
  suggestions?: string[];
  attachment?: FileAttachment;
  detailContent?: string;
  detailRevealed?: boolean;
}

interface DocumentRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileCategory: string;
  fileSize: number;
  extractedText: string;
  uploadedBy: string | null;
  createdAt: string;
  guides: { id: string; title: string; version: number; status: string; createdAt: string }[];
}

interface GuideRecord {
  id: string;
  documentId: string;
  title: string;
  content: string;
  version: number;
  status: string;
  generatedBy: string;
  createdAt: string;
  document: { id: string; fileName: string; fileType: string; fileCategory: string };
}

type TabType = 'chat' | 'documents' | 'guides';

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

function getOfflineResponse(message: string, lang: 'en' | 'zh'): string {
  const lower = message.toLowerCase();
  if (lower.includes('warranty') || lower.includes('保修'))
    return lang === 'en' ? 'Based on analysis, 3 assets have warranties expiring within 30 days. Consider purchasing extended warranties for critical assets.' : '根据分析，3项资产的保修将在30天内到期。建议为关键资产购买延长保修。';
  if (lower.includes('department') || lower.includes('部门'))
    return lang === 'en' ? 'Engineering has the most assigned assets at 38 units valued at SGD $145,200.' : '工程部拥有最多的分配资产，共38台，价值145,200新元。';
  return lang === 'en' ? 'I\'ve analyzed your IT inventory data. Total Assets: 118 units, Total Value: SGD $352,000, Utilization Rate: 75.4%.' : '我已分析您的IT库存数据。资产总数：118台，总价值：352,000新元，利用率：75.4%。';
}

function extractSuggestions(content: string): string[] {
  // Parse structured suggestions from <!-- SUGGESTIONS --> marker
  const sugIdx = content.indexOf('<!-- SUGGESTIONS -->');
  if (sugIdx !== -1) {
    const sugBlock = content.slice(sugIdx + 19).trim();
    return sugBlock.split('\n').map(l => l.trim()).filter(l => l.length > 5 && l.length < 55).slice(0, 4);
  }
  // Fallback: extract lines ending with "?"
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

/** Split content at <!-- MORE --> and strip <!-- SUGGESTIONS --> */
function parseResponse(content: string): { concise: string; detail: string; suggestions: string[] } {
  const suggestions = extractSuggestions(content);
  // Strip suggestions block from content
  let cleaned = content.replace(/<!-- SUGGESTIONS -->[\s\S]*$/, '').trim();
  // Split at <!-- MORE -->
  const moreIdx = cleaned.indexOf('<!-- MORE -->');
  if (moreIdx !== -1) {
    return {
      concise: cleaned.slice(0, moreIdx).trim(),
      detail: cleaned.slice(moreIdx + 12).trim(),
      suggestions,
    };
  }
  return { concise: cleaned, detail: '', suggestions };
}

/** Generate smart contextual suggestion cards based on conversation topic */
function generateTopicCards(content: string, lang: 'en' | 'zh'): { icon: string; text: string; query: string }[] {
  const lower = content.toLowerCase();
  const cards: { icon: string; text: string; query: string }[] = [];

  if (lower.includes('asset') || lower.includes('inventory') || lower.includes('device'))
    cards.push(
      { icon: '📊', text: lang === 'en' ? 'Asset breakdown' : '资产分类', query: lang === 'en' ? 'Show asset breakdown by category' : '按类别显示资产分类' },
      { icon: '🔄', text: lang === 'en' ? 'Lifecycle review' : '生命周期审查', query: lang === 'en' ? 'Which assets need replacement soon?' : '哪些资产需要尽快更换？' },
    );
  if (lower.includes('warranty') || lower.includes('expir'))
    cards.push(
      { icon: '⏰', text: lang === 'en' ? 'Renewal plan' : '续保计划', query: lang === 'en' ? 'Create a warranty renewal plan' : '创建保修续保计划' },
      { icon: '💰', text: lang === 'en' ? 'Cost impact' : '成本分析', query: lang === 'en' ? 'What is the warranty renewal cost?' : '保修续保费用是多少？' },
    );
  if (lower.includes('ticket') || lower.includes('maintenance') || lower.includes('issue'))
    cards.push(
      { icon: '🔥', text: lang === 'en' ? 'Priority tickets' : '优先工单', query: lang === 'en' ? 'Show high-priority open tickets' : '显示高优先级待处理工单' },
      { icon: '📈', text: lang === 'en' ? 'Trend analysis' : '趋势分析', query: lang === 'en' ? 'Ticket trend this quarter' : '本季度工单趋势' },
    );
  if (lower.includes('compliance') || lower.includes('pdpa') || lower.includes('security'))
    cards.push(
      { icon: '🛡️', text: lang === 'en' ? 'Risk assessment' : '风险评估', query: lang === 'en' ? 'Show compliance risk areas' : '显示合规风险领域' },
      { icon: '✅', text: lang === 'en' ? 'Action items' : '待办事项', query: lang === 'en' ? 'What compliance actions are needed?' : '需要哪些合规行动？' },
    );
  if (lower.includes('invoice') || lower.includes('finance') || lower.includes('revenue') || lower.includes('payment'))
    cards.push(
      { icon: '💵', text: lang === 'en' ? 'Revenue summary' : '收入摘要', query: lang === 'en' ? 'Show revenue summary this month' : '显示本月收入摘要' },
      { icon: '📋', text: lang === 'en' ? 'Overdue invoices' : '逾期发票', query: lang === 'en' ? 'Any overdue invoices?' : '有逾期发票吗？' },
    );
  if (lower.includes('employee') || lower.includes('staff') || lower.includes('department'))
    cards.push(
      { icon: '👥', text: lang === 'en' ? 'Team overview' : '团队概览', query: lang === 'en' ? 'Department headcount breakdown' : '部门人数分布' },
      { icon: '💻', text: lang === 'en' ? 'Device allocation' : '设备分配', query: lang === 'en' ? 'Which employees need new devices?' : '哪些员工需要新设备？' },
    );
  if (lower.includes('change') || lower.includes('request') || lower.includes('approval'))
    cards.push(
      { icon: '📝', text: lang === 'en' ? 'Pending changes' : '待审变更', query: lang === 'en' ? 'Show pending change requests' : '显示待审批变更请求' },
      { icon: '📊', text: lang === 'en' ? 'Change history' : '变更历史', query: lang === 'en' ? 'Recent change request outcomes' : '最近变更请求结果' },
    );

  // Always add a general follow-up if no topic matched
  if (cards.length === 0)
    cards.push(
      { icon: '💡', text: lang === 'en' ? 'Quick insights' : '快速洞察', query: lang === 'en' ? 'What needs my attention today?' : '今天需要我关注什么？' },
      { icon: '📊', text: lang === 'en' ? 'System health' : '系统健康', query: lang === 'en' ? 'Overall system health check' : '整体系统健康检查' },
    );

  return cards.slice(0, 3);
}

export default function AIAssistantPage() {
  const { lang, aiApiKey, aiAvatar, aiChatTheme } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [appContext, setAppContext] = useState<Record<string, unknown> | null>(null);
  const [aiSource, setAiSource] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<FileAttachment | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  // Documents & Guides state
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [guides, setGuides] = useState<GuideRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [generatingGuide, setGeneratingGuide] = useState<string | null>(null);
  const [viewingGuide, setViewingGuide] = useState<GuideRecord | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);
  const [docUploadFile, setDocUploadFile] = useState<FileAttachment | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const questions = suggestedQuestions[lang];
  const avatar = getAvatar(aiAvatar);
  const chatTheme = getChatTheme(aiChatTheme);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await fetch('/api/ai/context');
        if (res.ok) setAppContext(await res.json());
      } catch { /* use cached */ }
    };
    fetchContext();
    const interval = setInterval(fetchContext, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch documents & guides when switching tabs
  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments();
    if (activeTab === 'guides') fetchGuides();
  }, [activeTab]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/ai/documents');
      if (res.ok) setDocuments(await res.json());
    } catch { /* ignore */ } finally { setLoadingDocs(false); }
  };

  const fetchGuides = async () => {
    setLoadingGuides(true);
    try {
      const res = await fetch('/api/ai/guides');
      if (res.ok) setGuides(await res.json());
    } catch { /* ignore */ } finally { setLoadingGuides(false); }
  };

  // Chat file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ai/upload', { method: 'POST', body: formData });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Upload failed'); return; }
      setPendingFile(await res.json());
    } catch { alert(lang === 'en' ? 'Failed to upload file' : '文件上传失败'); }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  // Document tab file upload + save to DB
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ai/upload', { method: 'POST', body: formData });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Upload failed'); return; }
      setDocUploadFile(await res.json());
    } catch { alert(lang === 'en' ? 'Failed to upload file' : '文件上传失败'); }
    finally { setDocUploading(false); if (docFileInputRef.current) docFileInputRef.current.value = ''; }
  };

  const saveDocumentToDB = async () => {
    if (!docUploadFile) return;
    setSavingDoc(true);
    try {
      const res = await fetch('/api/ai/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: docUploadFile.fileName,
          fileType: docUploadFile.fileType,
          fileCategory: docUploadFile.fileCategory,
          fileSize: docUploadFile.fileSize,
          extractedText: docUploadFile.extractedText,
          uploadedBy: 'admin',
        }),
      });
      if (res.ok) {
        const savedDoc = await res.json();
        setDocUploadFile(null);
        fetchDocuments();
        // Auto-generate guide after saving
        generateGuide(savedDoc.id);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch { alert('Failed to save document'); }
    finally { setSavingDoc(false); }
  };

  const generateGuide = async (documentId: string) => {
    setGeneratingGuide(documentId);
    try {
      const res = await fetch('/api/ai/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, apiKey: aiApiKey || undefined }),
      });
      if (res.ok) {
        const guide = await res.json();
        setViewingGuide(guide);
        setActiveTab('guides');
        fetchDocuments();
        fetchGuides();
      } else {
        const err = await res.json();
        alert(err.error || 'Guide generation failed');
      }
    } catch { alert('Failed to generate guide'); }
    finally { setGeneratingGuide(null); }
  };

  const deleteGuide = async (guideId: string) => {
    if (!confirm(lang === 'en' ? 'Delete this guide?' : '删除此指南？')) return;
    try {
      await fetch(`/api/ai/guides/${guideId}`, { method: 'DELETE' });
      if (viewingGuide?.id === guideId) setViewingGuide(null);
      fetchGuides();
      fetchDocuments();
    } catch { /* ignore */ }
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm(lang === 'en' ? 'Delete this document and all its guides?' : '删除此文档及其所有指南？')) return;
    try {
      await fetch('/api/ai/documents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: docId }) });
      if (expandedDoc === docId) setExpandedDoc(null);
      fetchDocuments();
      fetchGuides();
    } catch { /* ignore */ }
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

  const toggleVoice = useCallback(() => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => { const text = e.results[0]?.[0]?.transcript || ''; if (text) { setInput(text); setIsListening(false); } };
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
    if (!text.trim() && !pendingFile) return;
    let messageContent = text.trim();
    const attachment = pendingFile || undefined;

    if (pendingFile) {
      const filePrefix = pendingFile.fileCategory === 'image' ? `[Attached image: ${pendingFile.fileName}]` : `[Attached ${pendingFile.fileCategory} file: ${pendingFile.fileName}]`;
      messageContent = messageContent ? `${filePrefix}\n${messageContent}` : `${filePrefix}\nPlease analyze this file.`;
      setPendingFile(null);
    }

    const userMsg: Message = { id: String(Date.now()), role: 'user', content: messageContent, timestamp: new Date(), attachment };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    let aiMessageContent = messageContent;
    if (attachment?.extractedText) {
      aiMessageContent = `${messageContent}\n\n--- FILE CONTENT (${attachment.fileName}) ---\n${attachment.extractedText}\n--- END FILE ---`;
    }

    try {
      const chatHistory = [...messages, { role: 'user' as const, content: aiMessageContent }].map(m => ({ role: m.role, content: m.content }));

      // Use streaming for faster perceived response
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          apiKey: aiApiKey || undefined,
          currentPage: '/ai-assistant',
          appContext: appContext || undefined,
          stream: true,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const contentType = res.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        // SSE streaming mode
        setAiSource('azure-openai');
        const aiMsgId = String(Date.now() + 1);
        setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date() }]);
        setIsTyping(false);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                // During streaming, show only concise part (before <!-- MORE -->)
                const moreIdx = fullContent.indexOf('<!-- MORE -->');
                const displayContent = moreIdx !== -1 ? fullContent.slice(0, moreIdx).trim() : fullContent;
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: displayContent } : m));
              }
            } catch { /* skip */ }
          }
        }

        // After streaming completes: parse response, split concise/detail
        const { concise, detail, suggestions } = parseResponse(fullContent);
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          content: concise,
          detailContent: detail || undefined,
          detailRevealed: !detail, // if no detail, mark as revealed
          suggestions,
        } : m));

        // Delayed detail reveal — 2 seconds pause, then show detail like human typing
        if (detail) {
          setTimeout(() => {
            setIsTyping(true); // show typing indicator briefly
            setTimeout(() => {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                ...m,
                content: `${concise}\n\n${detail}`,
                detailRevealed: true,
              } : m));
              setIsTyping(false);
            }, 800);
          }, 2000);
        }
      } else {
        // Non-streaming JSON response
        const data = await res.json();
        const responseText = data.content || data.message || '';
        if (data.source) setAiSource(data.source);
        const { concise, detail, suggestions } = parseResponse(responseText);
        const aiMsgId = String(Date.now() + 1);
        setMessages(prev => [...prev, {
          id: aiMsgId,
          role: 'assistant',
          content: concise,
          timestamp: new Date(),
          suggestions,
          detailContent: detail || undefined,
          detailRevealed: !detail,
        }]);
        setIsTyping(false);
        if (detail) {
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                ...m,
                content: `${concise}\n\n${detail}`,
                detailRevealed: true,
              } : m));
              setIsTyping(false);
            }, 800);
          }, 2000);
        }
      }
    } catch {
      const responseText = getOfflineResponse(text, lang);
      setAiSource('local-fallback');
      setMessages(prev => [...prev, { id: String(Date.now() + 1), role: 'assistant', content: responseText, timestamp: new Date() }]);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white/90 mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-white/80 mt-4 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith('#### ')) return <h4 key={i} className="text-base font-semibold text-white/70 mt-3 mb-1">{line.slice(5)}</h4>;
      if (line.startsWith('---')) return <hr key={i} className="border-white/10 my-4" />;
      if (line.startsWith('> ')) {
        const content = line.slice(2);
        const isWarning = content.includes('⚠️') || content.toLowerCase().includes('warning');
        const isTip = content.includes('💡') || content.toLowerCase().includes('tip');
        const isNote = content.includes('📝') || content.toLowerCase().includes('note');
        const bg = isWarning ? 'bg-amber-500/10 border-amber-500/30' : isTip ? 'bg-emerald-500/10 border-emerald-500/30' : isNote ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10';
        return <blockquote key={i} className={`${bg} border-l-4 p-3 rounded-r-lg my-2 text-white/70 text-sm`}>{renderInline(content)}</blockquote>;
      }
      if (line.match(/^\d+\.\s/)) return <div key={i} className="flex gap-2 my-1 text-white/70 text-sm"><span className="text-white/40 font-mono min-w-[24px]">{line.match(/^(\d+)\./)?.[1]}.</span><span>{renderInline(line.replace(/^\d+\.\s*/, ''))}</span></div>;
      if (line.match(/^[-*]\s/)) return <div key={i} className="flex gap-2 my-0.5 text-white/70 text-sm ml-2"><span className="text-white/30 mt-1">•</span><span>{renderInline(line.replace(/^[-*]\s*/, ''))}</span></div>;
      if (line.startsWith('|') && line.endsWith('|')) {
        if (line.match(/^\|[\s-|:]+\|$/)) return null; // separator row
        const cells = line.split('|').filter(Boolean).map(c => c.trim());
        return <div key={i} className="flex gap-0 text-xs"><div className="flex w-full">{cells.map((c, j) => <div key={j} className="flex-1 px-2 py-1 border border-white/5 text-white/60 bg-white/[0.02]">{renderInline(c)}</div>)}</div></div>;
      }
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <p key={i} className="text-white/70 text-sm leading-relaxed my-1">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string): React.ReactNode => {
    // Bold, italic, code, links
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`(.+?)`/);
      const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);
      const matches = [boldMatch, codeMatch, linkMatch].filter(Boolean).sort((a, b) => (a?.index || 0) - (b?.index || 0));
      if (matches.length === 0) { parts.push(remaining); break; }
      const first = matches[0]!;
      const idx = first.index || 0;
      if (idx > 0) parts.push(remaining.slice(0, idx));
      if (first === boldMatch) parts.push(<strong key={keyIdx++} className="font-semibold text-white/90">{first[1]}</strong>);
      else if (first === codeMatch) parts.push(<code key={keyIdx++} className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 text-xs font-mono">{first[1]}</code>);
      else if (first === linkMatch) parts.push(<span key={keyIdx++} className="text-cyan-400 underline">{first[1]}</span>);
      remaining = remaining.slice(idx + first[0].length);
    }
    return parts;
  };

  const tabs: { key: TabType; icon: React.ElementType; label: string }[] = [
    { key: 'chat', icon: MessageSquare, label: lang === 'en' ? 'Chat' : '聊天' },
    { key: 'documents', icon: FolderOpen, label: lang === 'en' ? 'Documents' : '文档' },
    { key: 'guides', icon: BookOpen, label: lang === 'en' ? 'Guides' : '指南' },
  ];

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-130px)] flex flex-col">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <KoreanFaceAvatar avatar={avatar} size="sm" animate={true} animation="rotate3d" />
              Uni AI — {avatar.name}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {avatar.personality} • {t('ai.subtitle', lang)}
              {aiSource && (
                <span className={`ml-2 text-xs ${aiSource === 'azure-openai' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {aiSource === 'azure-openai' ? '• Azure AI ✓' : '• ⚡ Offline'}
                </span>
              )}
            </p>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.key ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============== CHAT TAB ============== */}
        {activeTab === 'chat' && (
          <div className="flex-1 glass-card p-4 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-6">
                    <KoreanFaceAvatar avatar={avatar} size="xl" animate={true} animation="float" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {lang === 'en' ? `Hi! I'm ${avatar.name} — your Uni AI` : `嗨！我是${avatar.name} — 您的Uni AI`}
                  </h3>
                  <p className="text-white/40 text-sm mb-8 max-w-md">
                    {lang === 'en'
                      ? 'Ask me about your IT inventory, generate reports, get maintenance recommendations, or upload documents to auto-generate guides.'
                      : '向我询问您的IT资产、生成报告、获取维护建议或上传文档自动生成指南。'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                    {questions.map((q, i) => (
                      <motion.button key={i} onClick={() => sendMessage(q)} className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs transition-all flex items-start gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.02 }}>
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <KoreanFaceAvatar avatar={avatar} size="sm" animate={false} />
                    </div>
                  )}
                  <div className="max-w-[80%] space-y-2">
                    {msg.attachment && (
                      <div className={`p-3 rounded-xl border border-white/10 ${msg.role === 'user' ? 'bg-white/5' : 'bg-white/[0.03]'} flex items-center gap-3`}>
                        {msg.attachment.previewDataUrl ? (
                          <img src={msg.attachment.previewDataUrl} alt={msg.attachment.fileName} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          (() => { const FIcon = getFileIcon(msg.attachment.fileCategory); return <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center"><FIcon className="w-6 h-6 text-white/50" /></div>; })()
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-xs font-medium truncate">{msg.attachment.fileName}</p>
                          <p className="text-white/30 text-[10px]">{formatFileSize(msg.attachment.fileSize)}</p>
                        </div>
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl ${msg.role === 'user' ? `bg-gradient-to-r ${chatTheme.userBubble} border border-white/10 rounded-tr-md` : `${chatTheme.aiBubble} border border-white/5 rounded-tl-md`}`}>
                      <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                      </div>
                      {/* Detail reveal indicator — shows "elaborating..." before detail appears */}
                      {msg.role === 'assistant' && msg.detailContent && !msg.detailRevealed && (
                        <motion.div
                          className="mt-3 flex items-center gap-2 text-white/25 text-[11px]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="flex gap-0.5">
                            <motion.div className="w-1 h-1 rounded-full bg-white/30" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                            <motion.div className="w-1 h-1 rounded-full bg-white/30" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />
                            <motion.div className="w-1 h-1 rounded-full bg-white/30" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }} />
                          </div>
                          {lang === 'en' ? 'elaborating...' : '展开中...'}
                        </motion.div>
                      )}
                      <p className="text-white/20 text-xs mt-2">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="space-y-2">
                        {/* Speaker button */}
                        <div className="flex items-center gap-2">
                          <button onClick={() => speak(msg.content)} className="text-white/20 hover:text-white/50 transition-colors p-1"><Volume2 className="w-3.5 h-3.5" /></button>
                        </div>
                        {/* ── Smart Suggestion Cards — glassmorphism ── */}
                        {msg.detailRevealed !== false && (
                          <motion.div
                            className="flex flex-wrap gap-2"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                          >
                            {/* Topic-based contextual cards */}
                            {generateTopicCards(msg.content, lang).map((card, i) => (
                              <motion.button
                                key={`tc-${i}`}
                                onClick={() => sendMessage(card.query)}
                                className="group flex items-center gap-2 px-3 py-2 rounded-xl
                                  bg-white/[0.04] backdrop-blur-md border border-white/[0.08]
                                  hover:bg-white/[0.09] hover:border-white/[0.18]
                                  shadow-[0_2px_8px_rgba(0,0,0,0.15)]
                                  transition-all duration-200"
                                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.08 }}
                                whileHover={{ scale: 1.04, y: -1 }}
                              >
                                <span className="text-sm">{card.icon}</span>
                                <span className="text-[11px] text-white/45 group-hover:text-white/70 font-medium transition-colors">{card.text}</span>
                              </motion.button>
                            ))}
                            {/* AI-extracted suggestion cards */}
                            {msg.suggestions?.map((s, i) => (
                              <motion.button
                                key={`sg-${i}`}
                                onClick={() => sendMessage(s)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                  bg-gradient-to-r from-white/[0.03] to-white/[0.06] backdrop-blur-md
                                  border border-white/[0.08] hover:border-white/[0.18]
                                  hover:from-white/[0.06] hover:to-white/[0.1]
                                  shadow-[0_2px_8px_rgba(0,0,0,0.12)]
                                  transition-all duration-200"
                                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.08 }}
                                whileHover={{ scale: 1.04, y: -1 }}
                              >
                                <Lightbulb className="w-3 h-3 text-amber-400/50" />
                                <span className="text-[11px] text-white/40 hover:text-white/65 font-medium">{s}</span>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
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
                  <div className="flex-shrink-0">
                    <KoreanFaceAvatar avatar={avatar} size="sm" animate={true} animation="bounce" />
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

            {/* Input */}
            <div className="mt-4 space-y-2">
              {pendingFile && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  {pendingFile.previewDataUrl ? <img src={pendingFile.previewDataUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /> : (() => { const FIcon = getFileIcon(pendingFile.fileCategory); return <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><FIcon className="w-5 h-5 text-white/50" /></div>; })()}
                  <div className="flex-1 min-w-0"><p className="text-white/60 text-xs truncate">{pendingFile.fileName}</p><p className="text-white/30 text-[10px]">{formatFileSize(pendingFile.fileSize)}</p></div>
                  <button onClick={() => setPendingFile(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/50"><X className="w-4 h-4" /></button>
                </div>
              )}
              {uploadingFile && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <motion.div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  <p className="text-white/40 text-xs">{lang === 'en' ? 'Processing file...' : '处理文件中...'}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input ref={fileInputRef} type="file" className="hidden" accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.csv,.txt" onChange={handleFileUpload} />
                <motion.button type="button" onClick={() => fileInputRef.current?.click()} className={`px-3 py-3 rounded-xl transition-all ${pendingFile ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/10'}`} whileTap={{ scale: 0.9 }} disabled={isTyping || uploadingFile}><Paperclip className="w-4 h-4" /></motion.button>
                <motion.button type="button" onClick={toggleVoice} className={`px-3 py-3 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/10'}`} whileTap={{ scale: 0.9 }}>{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</motion.button>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? (lang === 'en' ? '🎙 Listening...' : '🎙 聆听中...') : pendingFile ? (lang === 'en' ? 'Ask about this file...' : '询问此文件...') : (lang === 'en' ? 'Ask Uni AI...' : '问 Uni AI...')} className={`glass-input flex-1 px-4 py-3 text-sm ${chatTheme.inputBorder}`} disabled={isTyping} />
                <motion.button type="submit" disabled={(!input.trim() && !pendingFile) || isTyping} className={`px-4 py-3 bg-gradient-to-r ${avatar.gradient} disabled:opacity-40 text-white rounded-xl transition-all flex items-center gap-2 shadow-md`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Send className="w-4 h-4" /></motion.button>
              </form>
            </div>
          </div>
        )}

        {/* ============== DOCUMENTS TAB ============== */}
        {activeTab === 'documents' && (
          <div className="flex-1 glass-card p-4 flex flex-col overflow-hidden">
            {/* Upload area */}
            <div className="mb-4">
              <input ref={docFileInputRef} type="file" className="hidden" accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.csv,.txt" onChange={handleDocUpload} />
              {!docUploadFile ? (
                <motion.button
                  onClick={() => docFileInputRef.current?.click()}
                  disabled={docUploading}
                  className="w-full p-6 rounded-xl border-2 border-dashed border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col items-center gap-3"
                  whileHover={{ scale: 1.005 }}
                >
                  {docUploading ? (
                    <>
                      <motion.div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                      <p className="text-white/40 text-sm">{lang === 'en' ? 'Processing file...' : '处理文件中...'}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-white/20" />
                      <div className="text-center">
                        <p className="text-white/50 text-sm font-medium">{lang === 'en' ? 'Upload Document for Guide Generation' : '上传文档以生成指南'}</p>
                        <p className="text-white/25 text-xs mt-1">PDF, Word, Excel, PowerPoint, Text, Images — Max 10MB</p>
                      </div>
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => { const FIcon = getFileIcon(docUploadFile.fileCategory); return <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center"><FIcon className="w-6 h-6 text-emerald-400" /></div>; })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{docUploadFile.fileName}</p>
                      <p className="text-white/30 text-xs">{formatFileSize(docUploadFile.fileSize)} • {docUploadFile.fileCategory}</p>
                    </div>
                    <button onClick={() => setDocUploadFile(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 mb-3 max-h-24 overflow-y-auto">
                    <p className="text-white/40 text-xs font-mono whitespace-pre-wrap">{docUploadFile.extractedText.slice(0, 500)}{docUploadFile.extractedText.length > 500 ? '...' : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveDocumentToDB} disabled={savingDoc} className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                      {savingDoc ? <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> : <Download className="w-4 h-4" />}
                      {lang === 'en' ? 'Save to Database & Generate Guide' : '保存并生成指南'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">{lang === 'en' ? 'Uploaded Documents' : '已上传文档'} ({documents.length})</h3>
                <button onClick={fetchDocuments} className="text-white/30 hover:text-white/50 p-1"><RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin' : ''}`} /></button>
              </div>
              {loadingDocs && documents.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">{lang === 'en' ? 'No documents uploaded yet' : '尚未上传文档'}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {documents.map((doc) => {
                    const FIcon = getFileIcon(doc.fileCategory);
                    const isExpanded = expandedDoc === doc.id;
                    return (
                      <motion.div key={doc.id} className="rounded-xl bg-white/[0.03] border border-white/8 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}>
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><FIcon className="w-5 h-5 text-white/40" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/70 text-sm font-medium truncate">{doc.fileName}</p>
                            <p className="text-white/30 text-[11px]">{formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()} • {doc.guides.length} guide{doc.guides.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); generateGuide(doc.id); }} disabled={generatingGuide === doc.id} className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/20 text-violet-300 text-[11px] font-medium hover:opacity-80 disabled:opacity-40 flex items-center gap-1" title="Generate Guide">
                              {generatingGuide === doc.id ? <motion.div className="w-3 h-3 border border-violet-400/30 border-t-violet-400 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> : <Wand2 className="w-3 h-3" />}
                              {lang === 'en' ? 'Generate' : '生成'}
                            </button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                          </div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-3 pb-3 border-t border-white/5 pt-2">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-white/30 text-xs">{lang === 'en' ? 'Extracted content preview:' : '提取内容预览：'}</p>
                                  <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} className="px-2 py-1 rounded text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3" />{lang === 'en' ? 'Delete' : '删除'}</button>
                                </div>
                                <div className="p-2 rounded-lg bg-black/20 max-h-32 overflow-y-auto">
                                  <p className="text-white/30 text-xs font-mono whitespace-pre-wrap">{doc.extractedText.slice(0, 800)}{doc.extractedText.length > 800 ? '...' : ''}</p>
                                </div>
                                {doc.guides.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-white/40 text-xs font-medium">{lang === 'en' ? 'Generated Guides:' : '已生成指南：'}</p>
                                    {doc.guides.map(g => (
                                      <div key={g.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => { fetchGuides(); setTimeout(() => { const full = guides.find(x => x.id === g.id); if (full) setViewingGuide(full); }, 300); }}>
                                        <BookOpen className="w-3.5 h-3.5 text-cyan-400/50" />
                                        <span className="text-white/50 text-xs flex-1 truncate">{g.title}</span>
                                        <span className="text-white/20 text-[10px]">v{g.version}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${g.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{g.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}

        {/* ============== GUIDES TAB ============== */}
        {activeTab === 'guides' && (
          <div className="flex-1 glass-card p-4 flex flex-col overflow-hidden">
            {viewingGuide ? (
              /* Professional Guide Viewer */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                  <button onClick={() => setViewingGuide(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white/90 font-bold text-lg truncate">{viewingGuide.title}</h2>
                    <div className="flex items-center gap-3 text-white/30 text-xs mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(viewingGuide.createdAt).toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">v{viewingGuide.version}</span>
                      <span className={`px-1.5 py-0.5 rounded ${viewingGuide.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{viewingGuide.status}</span>
                      <span>📄 {viewingGuide.document?.fileName}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => generateGuide(viewingGuide.documentId)} disabled={generatingGuide === viewingGuide.documentId} className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs hover:opacity-80 disabled:opacity-40 flex items-center gap-1" title="Regenerate (new version)">
                      {generatingGuide === viewingGuide.documentId ? <motion.div className="w-3 h-3 border border-violet-400/30 border-t-violet-400 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> : <RefreshCw className="w-3 h-3" />}
                      {lang === 'en' ? 'Update' : '更新'}
                    </button>
                    <button onClick={() => { speak(viewingGuide.content); }} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs hover:text-white/60 flex items-center gap-1"><Volume2 className="w-3 h-3" />{lang === 'en' ? 'Read' : '朗读'}</button>
                    <button onClick={() => deleteGuide(viewingGuide.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:opacity-80 flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                {/* Professional guide content with rendered markdown */}
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="max-w-4xl mx-auto">
                    {/* Guide header card */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/5 via-violet-500/5 to-purple-500/5 border border-white/10 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-6 h-6 text-cyan-400" />
                        <span className="text-cyan-400 text-xs font-medium uppercase tracking-wider">Professional User Guide</span>
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-2">{viewingGuide.title}</h1>
                      <div className="flex flex-wrap gap-4 text-xs text-white/40">
                        <span>📄 Source: {viewingGuide.document?.fileName}</span>
                        <span>📅 Generated: {new Date(viewingGuide.createdAt).toLocaleDateString()}</span>
                        <span>🔖 Version: {viewingGuide.version}</span>
                        <span>🤖 By: {viewingGuide.generatedBy === 'ai' ? 'Uni AI' : viewingGuide.generatedBy}</span>
                      </div>
                    </div>
                    {/* Rendered guide content */}
                    <div className="prose-dark">
                      {renderMarkdown(viewingGuide.content)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Guide list */
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/60 text-sm font-medium">{lang === 'en' ? 'Generated User Guides' : '已生成用户指南'} ({guides.length})</h3>
                  <button onClick={fetchGuides} className="text-white/30 hover:text-white/50 p-1"><RefreshCw className={`w-3.5 h-3.5 ${loadingGuides ? 'animate-spin' : ''}`} /></button>
                </div>
                {loadingGuides && guides.length === 0 ? (
                  <div className="flex items-center justify-center py-12"><motion.div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /></div>
                ) : guides.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-white/8 mx-auto mb-4" />
                    <p className="text-white/30 text-sm mb-2">{lang === 'en' ? 'No guides generated yet' : '尚未生成指南'}</p>
                    <p className="text-white/15 text-xs max-w-sm mx-auto">{lang === 'en' ? 'Upload a document in the Documents tab and click "Generate" to create a professional user guide automatically.' : '在文档选项卡中上传文档并点击"生成"以自动创建专业用户指南。'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guides.map(guide => (
                      <motion.div key={guide.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-all cursor-pointer group" onClick={() => setViewingGuide(guide)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/5 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-cyan-400/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white/80 text-sm font-medium truncate group-hover:text-white transition-colors">{guide.title}</h4>
                            <p className="text-white/25 text-xs mt-0.5 truncate">📄 {guide.document?.fileName}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-white/20 text-[10px] flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(guide.createdAt).toLocaleDateString()}</span>
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px]">v{guide.version}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${guide.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{guide.status}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setViewingGuide(guide); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteGuide(guide.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/15 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        {/* Preview snippet */}
                        <div className="mt-3 p-2 rounded-lg bg-black/15 max-h-16 overflow-hidden">
                          <p className="text-white/20 text-[11px] leading-relaxed">{guide.content.replace(/[#*_`|>-]/g, '').slice(0, 200)}...</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </MainLayout>
  );
}
