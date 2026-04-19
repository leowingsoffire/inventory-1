'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Search, Edit, Trash2, X, Calendar, Phone, Mail,
  MapPin, MessageSquare, Clock, CheckCircle, User, ArrowRight, Sparkles,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { useSearchParams, useRouter } from 'next/navigation';

interface CRMActivity {
  id: string;
  customerId: string;
  type: string;
  title: string;
  description: string | null;
  contactPerson: string | null;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  followUpDate: string | null;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
  customer: { companyName: string };
}

interface Customer {
  id: string;
  companyName: string;
}

const typeConfig: Record<string, { color: string; icon: typeof Phone }> = {
  call: { color: 'from-blue-500 to-blue-600', icon: Phone },
  email: { color: 'from-emerald-500 to-emerald-600', icon: Mail },
  meeting: { color: 'from-violet-500 to-violet-600', icon: Calendar },
  'site-visit': { color: 'from-amber-500 to-amber-600', icon: MapPin },
  'follow-up': { color: 'from-cyan-500 to-cyan-600', icon: Clock },
  support: { color: 'from-rose-500 to-rose-600', icon: MessageSquare },
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function aiSuggestActivity(customerName: string, existingActivities: CRMActivity[]): string {
  const recentTypes = existingActivities.slice(0, 3).map(a => a.type);
  if (recentTypes.length === 0) return 'Schedule an introductory meeting to understand their IT needs.';
  if (!recentTypes.includes('site-visit')) return `Consider scheduling a site visit to ${customerName} to assess their IT infrastructure.`;
  const lastActivity = existingActivities[0];
  if (lastActivity) {
    const daysSince = Math.floor((Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) return `It has been ${daysSince} days since last contact with ${customerName}. Schedule a follow-up call.`;
  }
  return `Continue building the relationship with ${customerName} through regular check-ins.`;
}

export default function CRMPage() {
  const { lang } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CRMActivity | null>(null);

  const [form, setForm] = useState({
    customerId: '', type: 'call', title: '', description: '', contactPerson: '',
    status: 'scheduled', scheduledAt: '', assignedTo: '', notes: '', followUpDate: '',
  });

  useEffect(() => {
    fetchActivities();
    fetchCustomers();
    const custId = searchParams.get('customer');
    if (custId) setCustomerFilter(custId);
    const action = searchParams.get('action');
    if (action === 'add') setShowModal(true);
  }, [searchParams]);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/crm');
      const data = await res.json();
      setActivities(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch { /* empty */ }
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : null,
      description: form.description || null,
      contactPerson: form.contactPerson || null,
      assignedTo: form.assignedTo || null,
      notes: form.notes || null,
    };
    try {
      if (editingActivity) {
        await fetch(`/api/crm/${editingActivity.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setShowModal(false);
      setEditingActivity(null);
      resetForm();
      fetchActivities();
    } catch { /* empty */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/crm/${id}`, { method: 'DELETE' });
      fetchActivities();
    } catch { /* empty */ }
  };

  const markCompleted = async (a: CRMActivity) => {
    await fetch(`/api/crm/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', completedAt: new Date().toISOString() }),
    });
    fetchActivities();
  };

  const resetForm = () => {
    setForm({ customerId: '', type: 'call', title: '', description: '', contactPerson: '', status: 'scheduled', scheduledAt: '', assignedTo: '', notes: '', followUpDate: '' });
  };

  const openEdit = (a: CRMActivity) => {
    setEditingActivity(a);
    setForm({
      customerId: a.customerId, type: a.type, title: a.title, description: a.description || '',
      contactPerson: a.contactPerson || '', status: a.status,
      scheduledAt: a.scheduledAt ? new Date(a.scheduledAt).toISOString().slice(0, 16) : '',
      assignedTo: a.assignedTo || '', notes: a.notes || '',
      followUpDate: a.followUpDate ? new Date(a.followUpDate).toISOString().slice(0, 10) : '',
    });
    setShowModal(true);
  };

  const filtered = activities.filter(a => {
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.customer.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    const matchCust = customerFilter === 'all' || a.customerId === customerFilter;
    return matchSearch && matchType && matchCust;
  });

  const scheduled = activities.filter(a => a.status === 'scheduled');
  const aiHint = customerFilter !== 'all' ? aiSuggestActivity(customers.find(c => c.id === customerFilter)?.companyName || '', activities.filter(a => a.customerId === customerFilter)) : null;

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-7 h-7 text-violet-400" />
              {lang === 'en' ? 'CRM Activities' : '客户关系管理'}
            </h1>
            <p className="text-white/50 text-sm mt-1">{lang === 'en' ? 'Track customer interactions and follow-ups' : '跟踪客户互动和后续跟进'}</p>
          </div>
          <motion.button onClick={() => { resetForm(); setEditingActivity(null); setShowModal(true); }} className="px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-medium flex items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Plus className="w-4 h-4" /> {lang === 'en' ? 'Log Activity' : '记录活动'}
          </motion.button>
        </div>

        {/* AI Hint */}
        {aiHint && (
          <motion.div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0" />
            <p className="text-violet-300 text-xs flex-1">{aiHint}</p>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={lang === 'en' ? 'Search activities...' : '搜索活动...'} className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="glass-input px-3 py-2.5 text-sm min-w-[160px]">
            <option value="all">{lang === 'en' ? 'All Customers' : '所有客户'}</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </select>
          <div className="flex gap-1.5">
            {['all', 'call', 'email', 'meeting', 'site-visit', 'follow-up', 'support'].map(type => (
              <button key={type} onClick={() => setTypeFilter(type)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${typeFilter === type ? 'bg-white/15 text-white border border-white/20' : 'text-white/40 hover:text-white/60 border border-transparent'}`}>
                {type === 'all' ? (lang === 'en' ? 'All' : '全部') : type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === 'en' ? 'Total Activities' : '总活动', value: activities.length, color: 'from-violet-500 to-violet-600' },
            { label: lang === 'en' ? 'Scheduled' : '已安排', value: scheduled.length, color: 'from-blue-500 to-blue-600' },
            { label: lang === 'en' ? 'Completed' : '已完成', value: activities.filter(a => a.status === 'completed').length, color: 'from-emerald-500 to-emerald-600' },
            { label: lang === 'en' ? 'Follow-ups Due' : '待跟进', value: activities.filter(a => a.followUpDate && new Date(a.followUpDate) <= new Date()).length, color: 'from-amber-500 to-amber-600' },
          ].map((s, i) => (
            <motion.div key={s.label} className="glass-card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                <FileText className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-white/40 text-[10px]">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity Timeline */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass-card p-5 h-24 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a, i) => {
              const cfg = typeConfig[a.type] || typeConfig.call;
              const Icon = cfg.icon;
              return (
                <motion.div key={a.id} className="glass-card glass-card-hover p-4 flex items-center gap-4 group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white font-medium text-sm truncate">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] border flex-shrink-0 ${statusColors[a.status]}`}>{a.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                      <span className="cursor-pointer hover:text-violet-400" onClick={() => router.push(`/customers?search=${encodeURIComponent(a.customer.companyName)}`)}>{a.customer.companyName}</span>
                      {a.contactPerson && <span>• {a.contactPerson}</span>}
                      {a.assignedTo && <span>• <User className="w-2.5 h-2.5 inline" /> {a.assignedTo}</span>}
                      {a.scheduledAt && <span>• <Calendar className="w-2.5 h-2.5 inline" /> {new Date(a.scheduledAt).toLocaleDateString()}</span>}
                    </div>
                    {a.description && <p className="text-white/30 text-[10px] mt-1 truncate">{a.description}</p>}
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {a.status === 'scheduled' && (
                      <button onClick={() => markCompleted(a)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-white/30 hover:text-emerald-400" title="Mark Complete"><CheckCircle className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && !loading && (
              <div className="glass-card p-12 text-center">
                <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">{lang === 'en' ? 'No activities found' : '未找到活动'}</p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowModal(false); setEditingActivity(null); }}>
              <motion.div className="glass-card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold text-lg">{editingActivity ? (lang === 'en' ? 'Edit Activity' : '编辑活动') : (lang === 'en' ? 'Log Activity' : '记录活动')}</h2>
                  <button onClick={() => { setShowModal(false); setEditingActivity(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Customer *' : '客户 *'}</label>
                    <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Type *' : '类型 *'}</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="call">{lang === 'en' ? 'Phone Call' : '电话'}</option>
                      <option value="email">{lang === 'en' ? 'Email' : '邮件'}</option>
                      <option value="meeting">{lang === 'en' ? 'Meeting' : '会议'}</option>
                      <option value="site-visit">{lang === 'en' ? 'Site Visit' : '上门拜访'}</option>
                      <option value="follow-up">{lang === 'en' ? 'Follow-up' : '跟进'}</option>
                      <option value="support">{lang === 'en' ? 'Support' : '支持'}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Title *' : '标题 *'}</label>
                    <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder={lang === 'en' ? 'e.g. Quarterly IT review meeting' : '例：季度IT审查会议'} />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Contact Person' : '联系人'}</label>
                    <input type="text" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Assigned To' : '负责人'}</label>
                    <input type="text" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Scheduled At' : '安排时间'}</label>
                    <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Follow-up Date' : '跟进日期'}</label>
                    <input type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Status' : '状态'}</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="scheduled">{lang === 'en' ? 'Scheduled' : '已安排'}</option>
                      <option value="completed">{lang === 'en' ? 'Completed' : '已完成'}</option>
                      <option value="cancelled">{lang === 'en' ? 'Cancelled' : '已取消'}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Description' : '描述'}</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" rows={2} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Notes' : '备注'}</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" rows={2} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => { setShowModal(false); setEditingActivity(null); }} className="px-4 py-2 text-white/50 hover:text-white text-sm">{lang === 'en' ? 'Cancel' : '取消'}</button>
                  <motion.button onClick={handleSubmit} className="px-5 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-medium" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    {editingActivity ? (lang === 'en' ? 'Update' : '更新') : (lang === 'en' ? 'Log' : '记录')}
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
