'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Search, Filter, Check, X, Clock, AlertTriangle, ChevronDown,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { useAuth } from '@/lib/auth-context';

interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  description: string | null;
  requesterId: string;
  amount: number | null;
  status: string;
  currentLevel: number;
  maxLevel: number;
  createdAt: string;
  updatedAt: string;
}

interface ApprovalStep {
  id: string;
  requestId: string;
  level: number;
  approverId: string;
  status: string;
  comment: string | null;
  signature: string | null;
  actionAt: string | null;
}

const statusFilters = ['all', 'pending', 'approved', 'rejected'];

export default function ApprovalsPage() {
  const { lang } = useApp();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  const [actionComment, setActionComment] = useState('');

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/approvals?${params}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { /* */ } finally { setLoading(false); }
  }

  async function handleView(req: ApprovalRequest) {
    setSelectedRequest(req);
    const res = await fetch(`/api/approvals/${req.id}`);
    const data = await res.json();
    setSteps(data || []);
  }

  async function handleApproval(stepId: string, approved: boolean) {
    try {
      await fetch(`/api/approvals/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, comment: actionComment }),
      });
      setActionComment('');
      setSelectedRequest(null);
      fetchRequests();
    } catch { /* */ }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300', approved: 'bg-green-500/20 text-green-300',
    rejected: 'bg-red-500/20 text-red-300',
  };

  const filtered = search.trim()
    ? requests.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : requests;

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Approvals' : '审批管理'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Review and manage approval requests' : '审查和管理审批请求'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'en' ? 'Search approvals...' : '搜索审批...'}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/30" />
            {statusFilters.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all capitalize ${statusFilter === s ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
                {s === 'all' ? (lang === 'en' ? 'All' : '全部') : s}
              </button>
            ))}
          </div>
        </div>

        {/* Request List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass-card p-5 animate-pulse h-24" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">{lang === 'en' ? 'No approval requests found' : '未找到审批请求'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req, i) => (
              <motion.div key={req.id} className="glass-card p-5 hover:bg-white/5 transition-all cursor-pointer"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => handleView(req)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-semibold text-sm">{req.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[req.status] || 'bg-white/10 text-white/50'}`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-white/30 text-xs">
                      <span className="capitalize">{req.type}</span>
                      {req.amount && <span>${req.amount.toLocaleString()}</span>}
                      <span>{lang === 'en' ? `Level ${req.currentLevel}/${req.maxLevel}` : `层级 ${req.currentLevel}/${req.maxLevel}`}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRequest(null)}>
              <motion.div className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">{selectedRequest.title}</h2>
                  <button onClick={() => setSelectedRequest(null)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedRequest.status] || 'bg-white/10 text-white/50'}`}>
                    {selectedRequest.status}
                  </span>
                  <span className="text-white/30 text-xs capitalize">{selectedRequest.type}</span>
                  {selectedRequest.amount && <span className="text-white/50 text-xs">${selectedRequest.amount.toLocaleString()}</span>}
                </div>

                {/* Approval Steps */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-white/50 text-xs font-medium uppercase">
                    {lang === 'en' ? 'Approval Steps' : '审批步骤'}
                  </h3>
                  {steps.map(step => (
                    <div key={step.id} className="glass-card p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === 'approved' ? 'bg-green-500/20' :
                        step.status === 'rejected' ? 'bg-red-500/20' :
                        'bg-yellow-500/20'
                      }`}>
                        {step.status === 'approved' ? <Check className="w-4 h-4 text-green-400" /> :
                         step.status === 'rejected' ? <X className="w-4 h-4 text-red-400" /> :
                         <Clock className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-xs font-medium">
                          {lang === 'en' ? `Level ${step.level}` : `第 ${step.level} 级`} — {step.approverId}
                        </div>
                        {step.comment && <div className="text-white/30 text-xs mt-0.5">{step.comment}</div>}
                        {step.actionAt && <div className="text-white/20 text-xs">{new Date(step.actionAt).toLocaleString()}</div>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[step.status] || 'bg-white/10 text-white/50'}`}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                {selectedRequest.status === 'pending' && steps.some(s => s.status === 'pending') && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="mb-3">
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Comment' : '评论'}</label>
                      <textarea rows={2} value={actionComment} onChange={e => setActionComment(e.target.value)}
                        className="glass-input w-full px-3 py-2 text-sm" placeholder={lang === 'en' ? 'Optional comment...' : '可选评论...'} />
                    </div>
                    <div className="flex gap-2">
                      {steps.filter(s => s.status === 'pending').map(pendingStep => (
                        <div key={pendingStep.id} className="flex gap-2 flex-1">
                          <button onClick={() => handleApproval(pendingStep.id, true)}
                            className="flex-1 glass-button px-4 py-2 text-sm bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" /> {lang === 'en' ? 'Approve' : '批准'}
                          </button>
                          <button onClick={() => handleApproval(pendingStep.id, false)}
                            className="flex-1 glass-button px-4 py-2 text-sm bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center gap-2">
                            <X className="w-4 h-4" /> {lang === 'en' ? 'Reject' : '拒绝'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}
