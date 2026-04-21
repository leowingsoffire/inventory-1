'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Command, CornerDownLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const moduleRoutes = [
  { name: 'Dashboard', nameZh: '仪表盘', href: '/dashboard', keywords: ['dashboard', 'home', 'overview', '仪表盘'] },
  { name: 'Assets', nameZh: '资产管理', href: '/assets', keywords: ['asset', 'laptop', 'desktop', 'server', 'hardware', '资产'] },
  { name: 'Service Desk', nameZh: '服务台', href: '/service-desk', keywords: ['service', 'itsm', 'itil', '服务台'] },
  { name: 'Maintenance', nameZh: '维护工单', href: '/maintenance', keywords: ['ticket', 'maintenance', 'incident', 'repair', '维护', '工单'] },
  { name: 'Change Requests', nameZh: '变更请求', href: '/change-requests', keywords: ['change', 'rfc', '变更'] },
  { name: 'Employees', nameZh: '员工管理', href: '/employees', keywords: ['employee', 'staff', 'people', '员工'] },
  { name: 'Customers', nameZh: '客户管理', href: '/customers', keywords: ['customer', 'client', '客户'] },
  { name: 'Vendors', nameZh: '供应商', href: '/vendors', keywords: ['vendor', 'supplier', '供应商'] },
  { name: 'CRM', nameZh: '客户关系', href: '/crm', keywords: ['crm', 'relationship', '关系'] },
  { name: 'Finance', nameZh: '财务管理', href: '/finance', keywords: ['finance', 'invoice', 'billing', 'payment', '财务', '发票'] },
  { name: 'Compliance', nameZh: 'PDPA合规', href: '/compliance', keywords: ['compliance', 'pdpa', 'audit', '合规'] },
  { name: 'Warranty', nameZh: '保修监控', href: '/warranty', keywords: ['warranty', 'expiry', '保修'] },
  { name: 'Knowledge Base', nameZh: '知识库', href: '/knowledge-base', keywords: ['knowledge', 'article', 'doc', '知识'] },
  { name: 'Reports', nameZh: '报告分析', href: '/reports', keywords: ['report', 'analytics', 'chart', '报告'] },
  { name: 'Settings', nameZh: '系统设置', href: '/settings', keywords: ['setting', 'config', 'theme', '设置'] },
  { name: 'Users & Roles', nameZh: '用户权限', href: '/users', keywords: ['user', 'role', 'permission', 'rbac', '用户'] },
  { name: 'AI Assistant', nameZh: 'AI助手', href: '/ai-assistant', keywords: ['ai', 'assistant', 'chat', '助手'] },
  { name: 'Automation', nameZh: '自动化中心', href: '/automation', keywords: ['automation', 'workflow', 'rule', '自动化'] },
  { name: 'Approvals', nameZh: '审批管理', href: '/approvals', keywords: ['approval', 'approve', '审批'] },
  { name: 'Contracts', nameZh: '合同管理', href: '/contracts', keywords: ['contract', '合同'] },
  { name: 'Communications', nameZh: '通讯中心', href: '/communications', keywords: ['communication', 'message', '通讯'] },
  { name: 'Locations', nameZh: '位置管理', href: '/locations', keywords: ['location', 'office', 'site', '位置'] },
  { name: 'Scheduled Tasks', nameZh: '计划任务', href: '/scheduled-tasks', keywords: ['schedule', 'task', 'cron', '计划'] },
  { name: 'Help Center', nameZh: '帮助中心', href: '/help', keywords: ['help', 'guide', 'documentation', '帮助'] },
  { name: 'My Profile', nameZh: '我的资料', href: '/profile', keywords: ['profile', 'account', 'password', '资料', '密码'] },
  { name: 'Activity Log', nameZh: '活动日志', href: '/activity', keywords: ['activity', 'log', 'audit', '活动', '日志'] },
];

export default function GlobalSearch() {
  const { lang } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setDbResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Search modules + DB
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setDbResults([]); return; }
    const lower = q.toLowerCase();

    // Module matches
    const moduleMatches = moduleRoutes
      .filter(m => m.name.toLowerCase().includes(lower) || m.nameZh.includes(q) || m.keywords.some(k => k.includes(lower)))
      .map(m => ({ type: 'module', id: m.href, title: lang === 'en' ? m.name : m.nameZh, subtitle: lang === 'en' ? 'Module' : '模块', href: m.href }));
    setResults(moduleMatches);

    // DB search (assets + employees + maintenance)
    if (q.length >= 2) {
      setSearching(true);
      try {
        const [assetsRes, employeesRes] = await Promise.all([
          fetch(`/api/assets?search=${encodeURIComponent(q)}&limit=5`).then(r => r.ok ? r.json() : []),
          fetch(`/api/employees?search=${encodeURIComponent(q)}&limit=5`).then(r => r.ok ? r.json() : []),
        ]);
        const dbItems: SearchResult[] = [];
        if (Array.isArray(assetsRes)) {
          assetsRes.slice(0, 5).forEach((a: { id: string; name: string; serialNumber: string }) => {
            dbItems.push({ type: 'asset', id: a.id, title: a.name, subtitle: a.serialNumber || 'Asset', href: `/assets?search=${encodeURIComponent(a.name)}` });
          });
        }
        if (Array.isArray(employeesRes)) {
          employeesRes.slice(0, 5).forEach((e: { id: string; name: string; department: string }) => {
            dbItems.push({ type: 'employee', id: e.id, title: e.name, subtitle: e.department || 'Employee', href: `/employees?search=${encodeURIComponent(e.name)}` });
          });
        }
        setDbResults(dbItems);
      } catch { setDbResults([]); } finally { setSearching(false); }
    } else {
      setDbResults([]);
    }
  }, [lang]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const allResults = [...results, ...dbResults];

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allResults.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && allResults[selected]) { handleSelect(allResults[selected]); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg mx-4 glass-card overflow-hidden"
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search className="w-5 h-5 text-white/30 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder={lang === 'en' ? 'Search modules, assets, employees...' : '搜索模块、资产、员工...'}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
              />
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-white/30 text-[10px] font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {query.trim() === '' ? (
                <div className="p-6 text-center">
                  <p className="text-white/20 text-xs">{lang === 'en' ? 'Type to search across all modules' : '输入以搜索所有模块'}</p>
                  <div className="flex items-center justify-center gap-4 mt-3 text-white/15 text-[10px]">
                    <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> {lang === 'en' ? 'to select' : '选择'}</span>
                    <span>↑↓ {lang === 'en' ? 'to navigate' : '导航'}</span>
                    <span className="flex items-center gap-1"><Command className="w-3 h-3" />K {lang === 'en' ? 'to toggle' : '切换'}</span>
                  </div>
                </div>
              ) : allResults.length === 0 ? (
                <div className="p-6 text-center">
                  {searching ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
                  ) : (
                    <p className="text-white/25 text-xs">{lang === 'en' ? 'No results found' : '未找到结果'}</p>
                  )}
                </div>
              ) : (
                <>
                  {results.length > 0 && (
                    <div className="px-2 pt-2">
                      <p className="text-white/25 text-[10px] font-medium uppercase tracking-wider px-2 mb-1">
                        {lang === 'en' ? 'Modules' : '模块'}
                      </p>
                      {results.map((r, i) => (
                        <button
                          key={r.id}
                          onClick={() => handleSelect(r)}
                          onMouseEnter={() => setSelected(i)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                            selected === i ? 'bg-accent-500/15 border border-accent-500/20' : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div>
                            <p className="text-white text-sm">{r.title}</p>
                            <p className="text-white/30 text-[10px]">{r.subtitle}</p>
                          </div>
                          <ArrowRight className={`w-3.5 h-3.5 ${selected === i ? 'text-accent-400' : 'text-white/15'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                  {dbResults.length > 0 && (
                    <div className="px-2 pt-2 pb-2">
                      <p className="text-white/25 text-[10px] font-medium uppercase tracking-wider px-2 mb-1">
                        {lang === 'en' ? 'Records' : '记录'}
                      </p>
                      {dbResults.map((r, i) => {
                        const idx = results.length + i;
                        return (
                          <button
                            key={`${r.type}-${r.id}`}
                            onClick={() => handleSelect(r)}
                            onMouseEnter={() => setSelected(idx)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                              selected === idx ? 'bg-accent-500/15 border border-accent-500/20' : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            <div>
                              <p className="text-white text-sm">{r.title}</p>
                              <p className="text-white/30 text-[10px]">{r.type === 'asset' ? '📦' : '👤'} {r.subtitle}</p>
                            </div>
                            <ArrowRight className={`w-3.5 h-3.5 ${selected === idx ? 'text-accent-400' : 'text-white/15'}`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {allResults.length > 0 && (
              <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-white/20 text-[10px]">
                <span>{allResults.length} {lang === 'en' ? 'results' : '个结果'}</span>
                <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> {lang === 'en' ? 'to open' : '打开'}</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
