'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Monitor, Users, DollarSign, Wrench, GitBranch, Shield, Truck, Building2,
  FileText, AlertTriangle, Bot, ChevronLeft, ChevronRight, Filter, Search,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface Activity {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  userId: string | null;
  createdAt: string;
}

const entityIcons: Record<string, React.ElementType> = {
  asset: Monitor, employee: Users, user: Users, invoice: DollarSign,
  maintenance: Wrench, 'change-request': GitBranch, compliance: Shield,
  vendor: Truck, customer: Building2, crm: FileText, warranty: AlertTriangle,
  document: FileText, guide: Bot,
};

const entityColors: Record<string, string> = {
  asset: 'from-blue-500 to-cyan-500', employee: 'from-violet-500 to-purple-500',
  user: 'from-violet-500 to-purple-500', invoice: 'from-emerald-500 to-green-500',
  maintenance: 'from-amber-500 to-orange-500', 'change-request': 'from-pink-500 to-rose-500',
  compliance: 'from-teal-500 to-cyan-500', vendor: 'from-indigo-500 to-blue-500',
  customer: 'from-sky-500 to-blue-500', crm: 'from-fuchsia-500 to-pink-500',
  warranty: 'from-red-500 to-orange-500', document: 'from-slate-500 to-gray-500',
  guide: 'from-cyan-500 to-teal-500',
};

const entityLabels: Record<string, { en: string; zh: string }> = {
  asset: { en: 'Asset', zh: '资产' }, employee: { en: 'Employee', zh: '员工' },
  user: { en: 'User', zh: '用户' }, invoice: { en: 'Invoice', zh: '发票' },
  maintenance: { en: 'Maintenance', zh: '维护' }, 'change-request': { en: 'Change Request', zh: '变更请求' },
  compliance: { en: 'Compliance', zh: '合规' }, vendor: { en: 'Vendor', zh: '供应商' },
  customer: { en: 'Customer', zh: '客户' }, crm: { en: 'CRM', zh: 'CRM' },
  warranty: { en: 'Warranty', zh: '保修' }, document: { en: 'Document', zh: '文档' },
  guide: { en: 'Guide', zh: '指南' },
};

const PAGE_SIZE = 20;

export default function ActivityPage() {
  const { lang } = useApp();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [page, entityFilter]);

  async function fetchActivities() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((page - 1) * PAGE_SIZE).toString(),
      });
      if (entityFilter !== 'all') params.set('entity', entityFilter);

      const res = await fetch(`/api/activity?${params}`);
      const data = await res.json();
      setActivities(data.activities || []);
      setTotal(data.total || 0);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const entityTypes = Object.keys(entityLabels);

  const filtered = searchQuery.trim()
    ? activities.filter(a =>
        a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.details || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activities;

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return lang === 'en' ? 'Just now' : '刚刚';
    if (mins < 60) return lang === 'en' ? `${mins}m ago` : `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return lang === 'en' ? `${hours}h ago` : `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return lang === 'en' ? `${days}d ago` : `${days}天前`;
    return date.toLocaleDateString();
  }

  function getEntityLink(entity: string, entityId: string | null): string | null {
    if (!entityId) return null;
    const routes: Record<string, string> = {
      asset: '/assets', employee: '/employees', user: '/users', invoice: '/finance',
      maintenance: '/maintenance', 'change-request': '/change-requests', compliance: '/compliance',
      vendor: '/vendors', customer: '/customers', crm: '/crm', warranty: '/warranty',
    };
    return routes[entity] ? `${routes[entity]}?id=${entityId}` : null;
  }

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Activity Log' : '活动日志'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Track all system activities and changes across modules' : '跟踪所有系统活动和跨模块的变更'}
            </p>
          </div>
          <div className="text-white/40 text-sm">
            {lang === 'en' ? `${total} total activities` : `共 ${total} 条活动`}
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? 'Search activities...' : '搜索活动...'}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-white/30" />
            <button
              onClick={() => { setEntityFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${entityFilter === 'all' ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}
            >
              {lang === 'en' ? 'All' : '全部'}
            </button>
            {entityTypes.map(et => (
              <button
                key={et}
                onClick={() => { setEntityFilter(et); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${entityFilter === et ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}
              >
                {lang === 'en' ? entityLabels[et].en : entityLabels[et].zh}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />

          <div className="space-y-2">
            {loading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} className="ml-12 glass-card p-4 animate-pulse h-16" />
              ))
            ) : filtered.length === 0 ? (
              <div className="glass-card p-12 text-center ml-12">
                <Clock className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">
                  {lang === 'en' ? 'No activities found' : '未找到活动'}
                </p>
              </div>
            ) : (
              filtered.map((activity, i) => {
                const Icon = entityIcons[activity.entity] || Clock;
                const color = entityColors[activity.entity] || 'from-gray-500 to-gray-600';
                const link = getEntityLink(activity.entity, activity.entityId);

                return (
                  <motion.div
                    key={activity.id}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    {/* Timeline dot */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 z-10 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div
                      className={`flex-1 glass-card p-4 ${link ? 'cursor-pointer hover:bg-white/[0.06]' : ''} transition-all`}
                      onClick={() => { if (link) window.location.href = link; }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{activity.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] bg-gradient-to-r ${color} bg-clip-text text-transparent font-semibold border border-white/10`}>
                              {lang === 'en' ? entityLabels[activity.entity]?.en || activity.entity : entityLabels[activity.entity]?.zh || activity.entity}
                            </span>
                            {activity.details && (
                              <span className="text-white/40 text-xs truncate">{activity.details}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-white/30 text-xs whitespace-nowrap">
                          {formatTime(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between glass-card p-3">
            <span className="text-white/40 text-xs">
              {lang === 'en'
                ? `Page ${page} of ${totalPages} (${total} total)`
                : `第 ${page} / ${totalPages} 页 (共 ${total} 条)`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs transition-all ${
                      p === page ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </MainLayout>
  );
}
