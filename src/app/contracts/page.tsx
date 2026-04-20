'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck, Plus, Edit, Trash2, X, Search, Filter, AlertTriangle, Calendar, DollarSign,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface Contract {
  id: string;
  contractNumber: string;
  type: string;
  vendorId: string | null;
  customerId: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  value: number;
  currency: string;
  billingCycle: string | null;
  status: string;
  totalSeats: number | null;
  usedSeats: number | null;
  autoRenew: number;
  createdAt: string;
}

const types = ['license', 'support', 'maintenance', 'subscription', 'lease'];
const statuses = ['active', 'expired', 'pending', 'cancelled'];
const PAGE_SIZE = 20;

export default function ContractsPage() {
  const { lang } = useApp();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [form, setForm] = useState({
    title: '', type: 'subscription', startDate: '', endDate: '', value: 0,
    currency: 'SGD', billingCycle: 'monthly', totalSeats: 0, usedSeats: 0, autoRenew: 1, description: '',
  });

  useEffect(() => { fetchContracts(); }, [page, typeFilter]);

  async function fetchContracts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((page - 1) * PAGE_SIZE).toString(),
      });
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/contracts?${params}`);
      const data = await res.json();
      setContracts(data.contracts || []);
      setTotal(data.total || 0);
    } catch { /* */ } finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      if (editContract) {
        await fetch(`/api/contracts/${editContract.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      setEditContract(null);
      fetchContracts();
    } catch { /* */ }
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'en' ? 'Delete this contract?' : '删除此合同？')) return;
    await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
    fetchContracts();
  }

  function openEdit(c: Contract) {
    setEditContract(c);
    setForm({
      title: c.title, type: c.type, startDate: c.startDate?.split('T')[0] || '', endDate: c.endDate?.split('T')[0] || '',
      value: c.value, currency: c.currency, billingCycle: c.billingCycle || 'monthly',
      totalSeats: c.totalSeats || 0, usedSeats: c.usedSeats || 0, autoRenew: c.autoRenew, description: c.description || '',
    });
    setShowModal(true);
  }

  function getDaysUntilExpiry(endDate: string): number {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const typeColors: Record<string, string> = {
    license: 'bg-blue-500/20 text-blue-300', support: 'bg-green-500/20 text-green-300',
    maintenance: 'bg-amber-500/20 text-amber-300', subscription: 'bg-violet-500/20 text-violet-300',
    lease: 'bg-pink-500/20 text-pink-300',
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Contracts & Licenses' : '合同和许可证'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Manage contracts, licenses, and subscriptions' : '管理合同、许可证和订阅'}
            </p>
          </div>
          <button onClick={() => { setEditContract(null); setForm({ title: '', type: 'subscription', startDate: '', endDate: '', value: 0, currency: 'SGD', billingCycle: 'monthly', totalSeats: 0, usedSeats: 0, autoRenew: 1, description: '' }); setShowModal(true); }}
            className="glass-button px-4 py-2 flex items-center gap-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30">
            <Plus className="w-4 h-4" /> {lang === 'en' ? 'New Contract' : '新建合同'}
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchContracts()}
              placeholder={lang === 'en' ? 'Search contracts...' : '搜索合同...'}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-white/30" />
            <button onClick={() => { setTypeFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${typeFilter === 'all' ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
              {lang === 'en' ? 'All' : '全部'}
            </button>
            {types.map(t => (
              <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all capitalize ${typeFilter === t ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Contract' : '合同'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Type' : '类型'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Value' : '金额'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Period' : '期限'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Seats' : '席位'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Status' : '状态'}</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3].map(i => <tr key={i}><td colSpan={7} className="p-4"><div className="h-8 animate-pulse bg-white/5 rounded" /></td></tr>)
                ) : contracts.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-white/30">{lang === 'en' ? 'No contracts found' : '未找到合同'}</td></tr>
                ) : (
                  contracts.map((c, i) => {
                    const daysLeft = getDaysUntilExpiry(c.endDate);
                    const isExpiring = daysLeft > 0 && daysLeft <= 30;
                    return (
                      <motion.tr key={c.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <td className="p-4">
                          <div className="font-medium text-white">{c.title}</div>
                          <div className="text-white/30 text-xs">{c.contractNumber}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${typeColors[c.type] || 'bg-white/10 text-white/50'}`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="p-4 text-white/70">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> {c.value.toLocaleString()} {c.currency}
                          </div>
                        </td>
                        <td className="p-4 text-white/50 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {c.startDate?.split('T')[0]} — {c.endDate?.split('T')[0]}
                          </div>
                          {isExpiring && (
                            <div className="flex items-center gap-1 text-orange-400 mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> {daysLeft}d left
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-white/50">
                          {c.totalSeats ? (
                            <div>
                              <div className="text-xs">{c.usedSeats}/{c.totalSeats}</div>
                              <div className="w-16 h-1.5 bg-white/10 rounded-full mt-1">
                                <div className="h-full bg-accent-400 rounded-full" style={{ width: `${Math.min(100, ((c.usedSeats || 0) / c.totalSeats) * 100)}%` }} />
                              </div>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'active' ? 'bg-green-500/20 text-green-300' : c.status === 'expired' ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/50'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-white/10"><Edit className="w-3.5 h-3.5 text-white/50" /></button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-white/10"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    {editContract ? (lang === 'en' ? 'Edit Contract' : '编辑合同') : (lang === 'en' ? 'New Contract' : '新建合同')}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Title' : '标题'}</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Type' : '类型'}</label>
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm">
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Billing Cycle' : '计费周期'}</label>
                      <select value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm">
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                        <option value="one-time">One-time</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Start Date' : '开始日期'}</label>
                      <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'End Date' : '结束日期'}</label>
                      <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Value' : '金额'}</label>
                      <input type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                        className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Currency' : '货币'}</label>
                      <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm">
                        <option value="SGD">SGD</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                  {(form.type === 'license' || form.type === 'subscription') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Total Seats' : '总席位'}</label>
                        <input type="number" value={form.totalSeats} onChange={e => setForm({ ...form, totalSeats: parseInt(e.target.value) || 0 })}
                          className="glass-input w-full px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Used Seats' : '已用席位'}</label>
                        <input type="number" value={form.usedSeats} onChange={e => setForm({ ...form, usedSeats: parseInt(e.target.value) || 0 })}
                          className="glass-input w-full px-3 py-2 text-sm" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Description' : '描述'}</label>
                    <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setShowModal(false)} className="glass-button px-4 py-2 text-sm text-white/50">
                      {lang === 'en' ? 'Cancel' : '取消'}
                    </button>
                    <button onClick={handleSave}
                      className="glass-button px-4 py-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30">
                      {lang === 'en' ? 'Save' : '保存'}
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
