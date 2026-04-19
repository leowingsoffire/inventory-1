'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Wrench, AlertTriangle, Clock, CheckCircle, ChevronDown, ExternalLink } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { FeatureGuide, MODULE_GUIDES } from '@/components/FeatureGuide';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  assetName: string;
  assetTag: string;
  assignedTo: string;
  cost: number;
  createdAt: string;
}



const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Clock },
  inProgress: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Wrench },
  resolved: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle },
  closed: { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: CheckCircle },
};

export default function MaintenancePage() {
  const { lang } = useApp();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState<Partial<Ticket>>({});

  // Fetch tickets from API
  useEffect(() => {
    fetch('/api/maintenance')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTickets(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle URL query params for cross-page navigation
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    const actionParam = searchParams.get('action');
    if (statusParam) setFilterStatus(statusParam);
    if (searchParam) setSearchTerm(searchParam);
    if (actionParam === 'add') openAddModal();
  }, [searchParams]);

  const filtered = tickets.filter(ticket => {
    const matchSearch = !searchTerm ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.assetName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const openAddModal = () => {
    setEditingTicket(null);
    setFormData({ title: '', description: '', type: 'repair', priority: 'medium', status: 'open', assetName: '', assetTag: '', assignedTo: '', cost: 0 });
    setShowModal(true);
  };

  const openEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData({ ...ticket });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingTicket) {
      setTickets(prev => prev.map(t => t.id === editingTicket.id ? { ...t, ...formData } as Ticket : t));
    } else {
      setTickets(prev => [...prev, { ...formData, id: String(Date.now()), createdAt: new Date().toISOString().split('T')[0] } as Ticket]);
    }
    setShowModal(false);
  };

  const statusCounts = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'inProgress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('maint.title', lang)}</h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Manage maintenance tickets and support requests' : '管理维护工单和支持请求'}
            </p>
          </div>
          <motion.button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Plus className="w-4 h-4" />
            {t('maint.add', lang)}
          </motion.button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('status.open', lang), count: statusCounts.open, icon: Clock, color: 'from-blue-500 to-blue-600' },
            { label: t('status.inProgress', lang), count: statusCounts.inProgress, icon: Wrench, color: 'from-amber-500 to-amber-600' },
            { label: t('status.resolved', lang), count: statusCounts.resolved, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} className="glass-card p-4 flex items-center gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.count}</p>
                  <p className="text-white/50 text-xs">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" placeholder={lang === 'en' ? 'Search tickets...' : '搜索工单...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input px-4 py-2.5 text-sm pr-8 appearance-none cursor-pointer min-w-[140px]">
              <option value="all" className="bg-gray-800">{t('common.all', lang)} {t('maint.status', lang)}</option>
              <option value="open" className="bg-gray-800">{t('status.open', lang)}</option>
              <option value="inProgress" className="bg-gray-800">{t('status.inProgress', lang)}</option>
              <option value="resolved" className="bg-gray-800">{t('status.resolved', lang)}</option>
              <option value="closed" className="bg-gray-800">{t('status.closed', lang)}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="glass-input px-4 py-2.5 text-sm pr-8 appearance-none cursor-pointer min-w-[140px]">
              <option value="all" className="bg-gray-800">{t('common.all', lang)} {t('maint.priority', lang)}</option>
              <option value="low" className="bg-gray-800">{t('priority.low', lang)}</option>
              <option value="medium" className="bg-gray-800">{t('priority.medium', lang)}</option>
              <option value="high" className="bg-gray-800">{t('priority.high', lang)}</option>
              <option value="critical" className="bg-gray-800">{t('priority.critical', lang)}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 && !loading ? (
          <FeatureGuide {...MODULE_GUIDES.maintenance} lang={lang} />
        ) : (
        <div className="space-y-3">
          {filtered.map((ticket, i) => {
            const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
            return (
              <motion.div
                key={ticket.id}
                className="glass-card glass-card-hover p-5 cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openEditModal(ticket)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon className="w-4 h-4 text-white/50" />
                      <h3 className="text-white font-medium text-sm">{ticket.title}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${priorityColors[ticket.priority]}`}>
                        {t(`priority.${ticket.priority}`, lang)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${statusConfig[ticket.status]?.color}`}>
                        {t(`status.${ticket.status}`, lang)}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs ml-7">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 ml-7 text-xs text-white/30">
                      <Link
                        href={`/assets?search=${encodeURIComponent(ticket.assetTag)}`}
                        className="text-accent-400/70 hover:text-accent-300 flex items-center gap-1 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ticket.assetName} ({ticket.assetTag})
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                      <span>•</span>
                      <span>{lang === 'en' ? 'Assigned:' : '负责人:'} {ticket.assignedTo}</span>
                      {ticket.cost > 0 && <><span>•</span><span>SGD ${ticket.cost}</span></>}
                      <span>•</span>
                      <span>{ticket.createdAt}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        )}

        {filtered.length === 0 && tickets.length > 0 && (
          <div className="text-center py-12 glass-card">
            <Wrench className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">{t('common.noData', lang)}</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              <motion.div className="glass-card p-6 w-full max-w-lg relative z-10" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {editingTicket ? t('maint.edit', lang) : t('maint.add', lang)}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">{t('maint.ticketTitle', lang)}</label>
                    <input type="text" value={formData.title || ''} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">{t('maint.description', lang)}</label>
                    <textarea value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm h-20 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">{t('maint.asset', lang)}</label>
                      <input type="text" value={formData.assetName || ''} onChange={(e) => setFormData(prev => ({ ...prev, assetName: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">{t('asset.tag', lang)}</label>
                      <input type="text" value={formData.assetTag || ''} onChange={(e) => setFormData(prev => ({ ...prev, assetTag: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">{t('maint.type', lang)}</label>
                      <select value={formData.type || 'repair'} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                        {['repair', 'replacement', 'upgrade', 'inspection'].map(type => (
                          <option key={type} value={type} className="bg-gray-800">{t(`maint.${type}`, lang)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">{t('maint.priority', lang)}</label>
                      <select value={formData.priority || 'medium'} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                        {['low', 'medium', 'high', 'critical'].map(p => (
                          <option key={p} value={p} className="bg-gray-800">{t(`priority.${p}`, lang)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">{t('maint.status', lang)}</label>
                      <select value={formData.status || 'open'} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                        {['open', 'inProgress', 'resolved', 'closed'].map(s => (
                          <option key={s} value={s} className="bg-gray-800">{t(`status.${s}`, lang)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">{t('maint.assignedTo', lang)}</label>
                      <input type="text" value={formData.assignedTo || ''} onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">{t('maint.cost', lang)}</label>
                      <input type="number" value={formData.cost || 0} onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))} className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="glass-button px-4 py-2 text-sm">{t('common.cancel', lang)}</button>
                  <motion.button onClick={handleSave} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {t('common.save', lang)}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}
