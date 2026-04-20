'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileSearch, Search, Filter, ChevronLeft, ChevronRight, Clock, User, ArrowRight,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

const entityTypes = ['asset', 'maintenance', 'user', 'invoice', 'contract', 'employee'];
const actions = ['create', 'update', 'delete', 'status_change'];
const PAGE_SIZE = 30;

export default function AuditPage() {
  const { lang } = useApp();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchEntries(); }, [page, entityFilter, actionFilter]);

  async function fetchEntries() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((page - 1) * PAGE_SIZE).toString(),
      });
      if (entityFilter !== 'all') params.set('entityType', entityFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (search) params.set('userId', search);
      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch { /* */ } finally { setLoading(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const actionColors: Record<string, string> = {
    create: 'bg-green-500/20 text-green-300', update: 'bg-blue-500/20 text-blue-300',
    delete: 'bg-red-500/20 text-red-300', status_change: 'bg-yellow-500/20 text-yellow-300',
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-white" />
            </div>
            {lang === 'en' ? 'Audit Trail' : '审计追踪'}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {lang === 'en' ? 'Track all changes across the system for compliance and accountability' : '跟踪系统中的所有变更以确保合规和问责'}
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchEntries()}
              placeholder={lang === 'en' ? 'Search by user ID...' : '按用户ID搜索...'}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/30" />
              <span className="text-white/30 text-xs">{lang === 'en' ? 'Entity:' : '实体:'}</span>
              <button onClick={() => { setEntityFilter('all'); setPage(1); }}
                className={`px-2 py-1 rounded-lg text-xs transition-all ${entityFilter === 'all' ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
                {lang === 'en' ? 'All' : '全部'}
              </button>
              {entityTypes.map(e => (
                <button key={e} onClick={() => { setEntityFilter(e); setPage(1); }}
                  className={`px-2 py-1 rounded-lg text-xs transition-all capitalize ${entityFilter === e ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
                  {e}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-xs">{lang === 'en' ? 'Action:' : '操作:'}</span>
              <button onClick={() => { setActionFilter('all'); setPage(1); }}
                className={`px-2 py-1 rounded-lg text-xs transition-all ${actionFilter === 'all' ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
                {lang === 'en' ? 'All' : '全部'}
              </button>
              {actions.map(a => (
                <button key={a} onClick={() => { setActionFilter(a); setPage(1); }}
                  className={`px-2 py-1 rounded-lg text-xs transition-all capitalize ${actionFilter === a ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
                  {a.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Entries */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Time' : '时间'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'User' : '用户'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Action' : '操作'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Entity' : '实体'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Field' : '字段'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Change' : '变更'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => <tr key={i}><td colSpan={6} className="p-4"><div className="h-6 animate-pulse bg-white/5 rounded" /></td></tr>)
                ) : entries.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-white/30">{lang === 'en' ? 'No audit entries found' : '未找到审计记录'}</td></tr>
                ) : (
                  entries.map((entry, i) => (
                    <motion.tr key={entry.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      <td className="p-4 text-white/40 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(entry.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="p-4 text-white/60 text-xs">
                        <div className="flex items-center gap-1"><User className="w-3 h-3" /> {entry.userName || entry.userId || '—'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${actionColors[entry.action] || 'bg-white/10 text-white/50'}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="p-4 text-white/50 text-xs">
                        <span className="capitalize">{entry.entityType}</span>
                        <span className="text-white/20 ml-1">#{entry.entityId?.slice(0, 8)}</span>
                      </td>
                      <td className="p-4 text-white/40 text-xs">{entry.fieldName || '—'}</td>
                      <td className="p-4 text-xs">
                        {entry.oldValue || entry.newValue ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            {entry.oldValue && <span className="text-red-300/60 line-through truncate max-w-[100px]">{entry.oldValue}</span>}
                            {entry.oldValue && entry.newValue && <ArrowRight className="w-3 h-3 text-white/20 flex-shrink-0" />}
                            {entry.newValue && <span className="text-green-300/60 truncate max-w-[100px]">{entry.newValue}</span>}
                          </div>
                        ) : '—'}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
      </motion.div>
    </MainLayout>
  );
}
