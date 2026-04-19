'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Plus, Search, ChevronLeft, ChevronRight, Filter,
  X, Edit3, Trash2, Eye, CheckCircle, XCircle, Clock,
  AlertTriangle, ArrowUpDown, ChevronDown, RefreshCw,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

interface ChangeRequest {
  id: string;
  number: string;
  shortDescription: string;
  description?: string;
  approval: string;
  type: string;
  state: string;
  priority: string;
  risk: string;
  impact: string;
  category?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  assignedTo?: string;
  requestedBy?: string;
  implementationPlan?: string;
  backoutPlan?: string;
  testPlan?: string;
  closureCode?: string;
  closureNotes?: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

const approvalColors: Record<string, string> = {
  'approved': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'requested': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'not-yet-requested': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const stateColors: Record<string, string> = {
  'new': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'review': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'authorize': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'scheduled': 'bg-accent-500/20 text-accent-400 border-accent-500/30',
  'implement': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'closed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'cancelled': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const priorityColors: Record<string, string> = {
  'critical': 'text-red-400',
  'high': 'text-orange-400',
  'medium': 'text-amber-400',
  'low': 'text-green-400',
};

const typeLabels: Record<string, string> = {
  'normal': 'Normal',
  'standard': 'Standard',
  'emergency': 'Emergency',
};

export default function ChangeRequestsPage() {
  const { lang } = useApp();
  const searchParams = useSearchParams();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ChangeRequest | null>(null);
  const [detailItem, setDetailItem] = useState<ChangeRequest | null>(null);

  // Column filters (ServiceNow-style inline search per column)
  const [filters, setFilters] = useState({
    number: '',
    shortDescription: '',
    approval: '',
    type: '',
    state: '',
    priority: '',
    assignedTo: '',
    category: '',
  });

  const [formData, setFormData] = useState({
    shortDescription: '',
    description: '',
    type: 'normal',
    priority: 'medium',
    risk: 'moderate',
    impact: 'medium',
    category: '',
    approval: 'not-yet-requested',
    state: 'new',
    plannedStartDate: '',
    plannedEndDate: '',
    assignedTo: '',
    requestedBy: '',
    implementationPlan: '',
    backoutPlan: '',
  });

  useEffect(() => {
    fetchChanges();
    if (searchParams.get('action') === 'add') setShowForm(true);
  }, [searchParams]);

  async function fetchChanges() {
    setLoading(true);
    try {
      const res = await fetch('/api/change-requests');
      if (res.ok) setChanges(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }

  // Filter + sort
  const filtered = useMemo(() => {
    let data = changes.filter((c) => {
      if (filters.number && !c.number.toLowerCase().includes(filters.number.toLowerCase())) return false;
      if (filters.shortDescription && !c.shortDescription.toLowerCase().includes(filters.shortDescription.toLowerCase())) return false;
      if (filters.approval && c.approval !== filters.approval) return false;
      if (filters.type && c.type !== filters.type) return false;
      if (filters.state && c.state !== filters.state) return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.assignedTo && !c.assignedTo?.toLowerCase().includes(filters.assignedTo.toLowerCase())) return false;
      if (filters.category && c.category !== filters.category) return false;
      return true;
    });

    data.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? '';
      const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [changes, filters, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  function clearFilters() {
    setFilters({ number: '', shortDescription: '', approval: '', type: '', state: '', priority: '', assignedTo: '', category: '' });
    setPage(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editItem ? `/api/change-requests/${editItem.id}` : '/api/change-requests';
    const method = editItem ? 'PUT' : 'POST';
    const body = { ...formData };
    if (body.plannedStartDate) body.plannedStartDate = new Date(body.plannedStartDate).toISOString();
    else delete (body as Record<string, unknown>).plannedStartDate;
    if (body.plannedEndDate) body.plannedEndDate = new Date(body.plannedEndDate).toISOString();
    else delete (body as Record<string, unknown>).plannedEndDate;

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      setShowForm(false);
      setEditItem(null);
      resetForm();
      fetchChanges();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('common.confirm', lang))) return;
    await fetch(`/api/change-requests/${id}`, { method: 'DELETE' });
    fetchChanges();
  }

  function resetForm() {
    setFormData({ shortDescription: '', description: '', type: 'normal', priority: 'medium', risk: 'moderate', impact: 'medium', category: '', approval: 'not-yet-requested', state: 'new', plannedStartDate: '', plannedEndDate: '', assignedTo: '', requestedBy: '', implementationPlan: '', backoutPlan: '' });
  }

  function openEdit(item: ChangeRequest) {
    setEditItem(item);
    setFormData({
      shortDescription: item.shortDescription,
      description: item.description || '',
      type: item.type,
      priority: item.priority,
      risk: item.risk,
      impact: item.impact,
      category: item.category || '',
      approval: item.approval,
      state: item.state,
      plannedStartDate: item.plannedStartDate ? item.plannedStartDate.split('T')[0] : '',
      plannedEndDate: item.plannedEndDate ? item.plannedEndDate.split('T')[0] : '',
      assignedTo: item.assignedTo || '',
      requestedBy: item.requestedBy || '',
      implementationPlan: item.implementationPlan || '',
      backoutPlan: item.backoutPlan || '',
    });
    setShowForm(true);
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-accent-500 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Change Requests' : '变更请求'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Plan, approve, and track IT changes' : '规划、审批和跟踪IT变更'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm hover:bg-amber-500/20 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </motion.button>
            )}
            <button onClick={() => fetchChanges()} className="glass-button px-3 py-2">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
              className="glass-button px-4 py-2 flex items-center gap-2 bg-accent-500/20 hover:bg-accent-500/30 border-accent-500/30"
            >
              <Plus className="w-4 h-4" />
              {lang === 'en' ? 'New Change' : '新建变更'}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total', value: changes.length, color: 'text-white' },
            { label: 'New', value: changes.filter(c => c.state === 'new').length, color: 'text-blue-400' },
            { label: 'In Review', value: changes.filter(c => c.state === 'review').length, color: 'text-amber-400' },
            { label: 'Scheduled', value: changes.filter(c => c.state === 'scheduled').length, color: 'text-accent-400' },
            { label: 'Implementing', value: changes.filter(c => c.state === 'implement').length, color: 'text-indigo-400' },
            { label: 'Approved', value: changes.filter(c => c.approval === 'approved').length, color: 'text-emerald-400' },
            { label: 'Rejected', value: changes.filter(c => c.approval === 'rejected').length, color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Data Table — ServiceNow-style with column filters */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    { key: 'number', label: 'Number', width: 'w-28' },
                    { key: 'shortDescription', label: 'Short Description', width: 'min-w-[200px]' },
                    { key: 'approval', label: 'Approval', width: 'w-36' },
                    { key: 'type', label: 'Type', width: 'w-24' },
                    { key: 'state', label: 'State', width: 'w-28' },
                    { key: 'priority', label: 'Priority', width: 'w-24' },
                    { key: 'category', label: 'Category', width: 'w-24' },
                    { key: 'plannedStartDate', label: 'Planned Start', width: 'w-28' },
                    { key: 'plannedEndDate', label: 'Planned End', width: 'w-28' },
                    { key: 'assignedTo', label: 'Assigned To', width: 'w-32' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className={`px-3 py-3 text-left text-white/70 font-medium cursor-pointer hover:text-white transition-colors ${col.width}`}
                      onClick={() => toggleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{col.label}</span>
                        <ArrowUpDown className={`w-3 h-3 ${sortField === col.key ? 'text-accent-400' : 'text-white/20'}`} />
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-white/70 font-medium w-20">{t('common.actions', lang)}</th>
                </tr>
                {/* Inline Column Filters — ServiceNow-style */}
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={filters.number}
                      onChange={(e) => { setFilters({ ...filters, number: e.target.value }); setPage(1); }}
                      placeholder="CHG..."
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={filters.shortDescription}
                      onChange={(e) => { setFilters({ ...filters, shortDescription: e.target.value }); setPage(1); }}
                      placeholder="Search..."
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={filters.approval}
                      onChange={(e) => { setFilters({ ...filters, approval: e.target.value }); setPage(1); }}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:border-blue-500/50 focus:outline-none"
                    >
                      <option value="">All</option>
                      <option value="approved">Approved</option>
                      <option value="requested">Requested</option>
                      <option value="not-yet-requested">Not Yet Requested</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={filters.type}
                      onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:border-blue-500/50 focus:outline-none"
                    >
                      <option value="">All</option>
                      <option value="normal">Normal</option>
                      <option value="standard">Standard</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={filters.state}
                      onChange={(e) => { setFilters({ ...filters, state: e.target.value }); setPage(1); }}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:border-blue-500/50 focus:outline-none"
                    >
                      <option value="">All</option>
                      <option value="new">New</option>
                      <option value="review">Review</option>
                      <option value="authorize">Authorize</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="implement">Implement</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={filters.priority}
                      onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:border-blue-500/50 focus:outline-none"
                    >
                      <option value="">All</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={filters.category}
                      onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:border-blue-500/50 focus:outline-none"
                    >
                      <option value="">All</option>
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="network">Network</option>
                      <option value="security">Security</option>
                      <option value="other">Other</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5" />
                  <td className="px-2 py-1.5" />
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={filters.assignedTo}
                      onChange={(e) => { setFilters({ ...filters, assignedTo: e.target.value }); setPage(1); }}
                      placeholder="Search..."
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5" />
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="px-4 py-12 text-center text-white/40">{t('common.loading', lang)}</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-12 text-center text-white/40">{t('common.noData', lang)}</td></tr>
                ) : paged.map((cr) => (
                  <motion.tr
                    key={cr.id}
                    className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setDetailItem(cr)}
                  >
                    <td className="px-3 py-3">
                      <span className="text-blue-400 font-mono text-xs">{cr.number}</span>
                    </td>
                    <td className="px-3 py-3 text-white/90 text-sm max-w-[250px] truncate">{cr.shortDescription}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${approvalColors[cr.approval] || 'bg-white/10 text-white/50'}`}>
                        {cr.approval.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs ${cr.type === 'emergency' ? 'text-red-400 font-semibold' : 'text-white/60'}`}>
                        {typeLabels[cr.type] || cr.type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${stateColors[cr.state] || 'bg-white/10 text-white/50'}`}>
                        {cr.state.charAt(0).toUpperCase() + cr.state.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium ${priorityColors[cr.priority] || 'text-white/50'}`}>
                        {cr.priority.charAt(0).toUpperCase() + cr.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-white/50 text-xs capitalize">{cr.category || '—'}</td>
                    <td className="px-3 py-3 text-white/50 text-xs">{formatDate(cr.plannedStartDate)}</td>
                    <td className="px-3 py-3 text-white/50 text-xs">{formatDate(cr.plannedEndDate)}</td>
                    <td className="px-3 py-3 text-white/70 text-xs">{cr.assignedTo || '—'}</td>
                    <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetailItem(cr)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(cr)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-blue-400 transition-all">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cr.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — ServiceNow-style "X to Y of Z" */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-white/40 text-xs">
              {filtered.length > 0
                ? `${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`
                : '0 results'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs transition-all ${
                    p === page ? 'bg-blue-500/30 text-blue-400 border border-blue-500/30' : 'text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {detailItem && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailItem(null)}
            >
              <motion.div
                className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4 p-6"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-blue-400 font-mono text-sm">{detailItem.number}</span>
                    <h2 className="text-white text-lg font-semibold mt-1">{detailItem.shortDescription}</h2>
                  </div>
                  <button onClick={() => setDetailItem(null)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-white/40 text-xs mb-1">Approval</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${approvalColors[detailItem.approval]}`}>
                      {detailItem.approval.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">State</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${stateColors[detailItem.state]}`}>
                      {detailItem.state.charAt(0).toUpperCase() + detailItem.state.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Type</p>
                    <p className="text-white/80 text-sm">{typeLabels[detailItem.type]}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Priority</p>
                    <p className={`text-sm font-medium ${priorityColors[detailItem.priority]}`}>
                      {detailItem.priority.charAt(0).toUpperCase() + detailItem.priority.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Risk</p>
                    <p className="text-white/80 text-sm capitalize">{detailItem.risk}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Impact</p>
                    <p className="text-white/80 text-sm capitalize">{detailItem.impact}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Category</p>
                    <p className="text-white/80 text-sm capitalize">{detailItem.category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Assigned To</p>
                    <p className="text-white/80 text-sm">{detailItem.assignedTo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Requested By</p>
                    <p className="text-white/80 text-sm">{detailItem.requestedBy || '—'}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Planned Start</p>
                    <p className="text-white/80 text-sm">{formatDate(detailItem.plannedStartDate)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Planned End</p>
                    <p className="text-white/80 text-sm">{formatDate(detailItem.plannedEndDate)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Created</p>
                    <p className="text-white/80 text-sm">{formatDate(detailItem.createdAt)}</p>
                  </div>
                </div>

                {detailItem.description && (
                  <div className="mb-4">
                    <p className="text-white/40 text-xs mb-1">Description</p>
                    <p className="text-white/70 text-sm whitespace-pre-wrap bg-white/5 rounded-lg p-3">{detailItem.description}</p>
                  </div>
                )}

                {detailItem.implementationPlan && (
                  <div className="mb-4">
                    <p className="text-white/40 text-xs mb-1">Implementation Plan</p>
                    <p className="text-white/70 text-sm whitespace-pre-wrap bg-white/5 rounded-lg p-3">{detailItem.implementationPlan}</p>
                  </div>
                )}

                {detailItem.backoutPlan && (
                  <div className="mb-4">
                    <p className="text-white/40 text-xs mb-1">Backout Plan</p>
                    <p className="text-white/70 text-sm whitespace-pre-wrap bg-white/5 rounded-lg p-3">{detailItem.backoutPlan}</p>
                  </div>
                )}

                {detailItem.closureCode && (
                  <div className="mb-4">
                    <p className="text-white/40 text-xs mb-1">Closure</p>
                    <div className="bg-white/5 rounded-lg p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border mb-2 ${
                        detailItem.closureCode === 'successful' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {detailItem.closureCode.charAt(0).toUpperCase() + detailItem.closureCode.slice(1)}
                      </span>
                      {detailItem.closureNotes && <p className="text-white/70 text-sm mt-1">{detailItem.closureNotes}</p>}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => { setDetailItem(null); openEdit(detailItem); }} className="glass-button px-4 py-2 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> {t('common.edit', lang)}
                  </button>
                  <button onClick={() => setDetailItem(null)} className="glass-button px-4 py-2">
                    {t('common.close', lang)}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create/Edit Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); setEditItem(null); }}
            >
              <motion.div
                className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4 p-6"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-white text-lg font-semibold mb-4">
                  {editItem ? (lang === 'en' ? 'Edit Change Request' : '编辑变更请求') : (lang === 'en' ? 'New Change Request' : '新建变更请求')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Short Description *</label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      required
                      className="glass-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="glass-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Type</label>
                      <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="glass-input w-full px-3 py-2 text-sm">
                        <option value="normal">Normal</option>
                        <option value="standard">Standard</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Priority</label>
                      <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="glass-input w-full px-3 py-2 text-sm">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Risk</label>
                      <select value={formData.risk} onChange={(e) => setFormData({ ...formData, risk: e.target.value })} className="glass-input w-full px-3 py-2 text-sm">
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Impact</label>
                      <select value={formData.impact} onChange={(e) => setFormData({ ...formData, impact: e.target.value })} className="glass-input w-full px-3 py-2 text-sm">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Category</label>
                      <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="glass-input w-full px-3 py-2 text-sm">
                        <option value="">Select...</option>
                        <option value="hardware">Hardware</option>
                        <option value="software">Software</option>
                        <option value="network">Network</option>
                        <option value="security">Security</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Approval</label>
                      <select value={formData.approval} onChange={(e) => setFormData({ ...formData, approval: e.target.value })} className="glass-input w-full px-3 py-2 text-sm">
                        <option value="not-yet-requested">Not Yet Requested</option>
                        <option value="requested">Requested</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    {editItem && (
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">State</label>
                        <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="glass-input w-full px-3 py-2 text-sm">
                          <option value="new">New</option>
                          <option value="review">Review</option>
                          <option value="authorize">Authorize</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="implement">Implement</option>
                          <option value="closed">Closed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Planned Start</label>
                      <input type="date" value={formData.plannedStartDate} onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Planned End</label>
                      <input type="date" value={formData.plannedEndDate} onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Assigned To</label>
                      <input type="text" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Requested By</label>
                      <input type="text" value={formData.requestedBy} onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Implementation Plan</label>
                    <textarea value={formData.implementationPlan} onChange={(e) => setFormData({ ...formData, implementationPlan: e.target.value })} rows={3} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Backout Plan</label>
                    <textarea value={formData.backoutPlan} onChange={(e) => setFormData({ ...formData, backoutPlan: e.target.value })} rows={2} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="glass-button px-4 py-2">{t('common.cancel', lang)}</button>
                    <button type="submit" className="glass-button px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30">{t('common.save', lang)}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}
