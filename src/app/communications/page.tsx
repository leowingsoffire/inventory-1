'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Search, Plus, Eye, X, Send, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface EmailLog {
  id: string;
  toAddress: string;
  ccAddress: string | null;
  subject: string;
  body: string;
  status: string;
  templateId: string | null;
  entityType: string | null;
  entityId: string | null;
  sentAt: string | null;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function CommunicationsPage() {
  const { lang } = useApp();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [viewEmail, setViewEmail] = useState<EmailLog | null>(null);
  const [form, setForm] = useState({ to: '', cc: '', subject: '', body: '' });

  useEffect(() => { fetchEmails(); }, [page]);

  async function fetchEmails() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((page - 1) * PAGE_SIZE).toString(),
      });
      if (search) params.set('search', search);
      const res = await fetch(`/api/communications?${params}`);
      const data = await res.json();
      setEmails(data.emails || []);
      setTotal(data.total || 0);
    } catch { /* */ } finally { setLoading(false); }
  }

  async function handleSend() {
    try {
      await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: form.to, cc: form.cc || undefined, subject: form.subject, body: form.body }),
      });
      setShowCompose(false);
      setForm({ to: '', cc: '', subject: '', body: '' });
      fetchEmails();
    } catch { /* */ }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusIcons: Record<string, React.ReactNode> = {
    sent: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
    queued: <Clock className="w-3.5 h-3.5 text-yellow-400" />,
    failed: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Communications' : '通讯中心'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Email notifications and communication log' : '邮件通知和通讯日志'}
            </p>
          </div>
          <button onClick={() => setShowCompose(true)}
            className="glass-button px-4 py-2 flex items-center gap-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30">
            <Plus className="w-4 h-4" /> {lang === 'en' ? 'Compose' : '撰写'}
          </button>
        </div>

        {/* Search */}
        <div className="glass-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchEmails()}
              placeholder={lang === 'en' ? 'Search emails...' : '搜索邮件...'}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm" />
          </div>
        </div>

        {/* Email List */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="space-y-0">
              {[1,2,3,4,5].map(i => <div key={i} className="p-4 border-b border-white/5 animate-pulse h-16" />)}
            </div>
          ) : emails.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/30">{lang === 'en' ? 'No emails found' : '未找到邮件'}</p>
            </div>
          ) : (
            emails.map((email, i) => (
              <motion.div key={email.id}
                className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => setViewEmail(email)}>
                <div className="flex-shrink-0">{statusIcons[email.status] || statusIcons.queued}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm truncate">{email.subject}</span>
                  </div>
                  <div className="text-white/30 text-xs truncate">{lang === 'en' ? 'To:' : '收件人:'} {email.toAddress}</div>
                </div>
                <div className="text-white/20 text-xs whitespace-nowrap">
                  {new Date(email.createdAt).toLocaleString()}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="glass-button p-2 disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-white" /></button>
            <span className="text-white/50 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="glass-button p-2 disabled:opacity-30"><ChevronRight className="w-4 h-4 text-white" /></button>
          </div>
        )}

        {/* View Email Modal */}
        <AnimatePresence>
          {viewEmail && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewEmail(null)}>
              <motion.div className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {statusIcons[viewEmail.status]} {viewEmail.subject}
                  </h2>
                  <button onClick={() => setViewEmail(null)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
                </div>
                <div className="space-y-2 text-white/50 text-xs border-b border-white/10 pb-3 mb-4">
                  <div><span className="text-white/30">{lang === 'en' ? 'To:' : '收件人:'}</span> {viewEmail.toAddress}</div>
                  {viewEmail.ccAddress && <div><span className="text-white/30">{lang === 'en' ? 'CC:' : '抄送:'}</span> {viewEmail.ccAddress}</div>}
                  <div><span className="text-white/30">{lang === 'en' ? 'Date:' : '日期:'}</span> {new Date(viewEmail.createdAt).toLocaleString()}</div>
                  <div><span className="text-white/30">{lang === 'en' ? 'Status:' : '状态:'}</span> {viewEmail.status}</div>
                </div>
                <div className="text-white/70 text-sm whitespace-pre-wrap">{viewEmail.body}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compose Modal */}
        <AnimatePresence>
          {showCompose && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCompose(false)}>
              <motion.div className="glass-card p-6 w-full max-w-lg" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">{lang === 'en' ? 'Compose Email' : '撰写邮件'}</h2>
                  <button onClick={() => setShowCompose(false)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'To' : '收件人'}</label>
                    <input type="email" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'CC' : '抄送'}</label>
                    <input type="email" value={form.cc} onChange={e => setForm({ ...form, cc: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Subject' : '主题'}</label>
                    <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Body' : '内容'}</label>
                    <textarea rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setShowCompose(false)} className="glass-button px-4 py-2 text-sm text-white/50">
                      {lang === 'en' ? 'Cancel' : '取消'}
                    </button>
                    <button onClick={handleSend}
                      className="glass-button px-4 py-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30 flex items-center gap-2">
                      <Send className="w-4 h-4" /> {lang === 'en' ? 'Send' : '发送'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}
