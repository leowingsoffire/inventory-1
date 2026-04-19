'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Globe, User, Shield, Wrench, Monitor, X, ArrowRight } from 'lucide-react';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import WeatherCard from './WeatherCard';

const searchRoutes = [
  { keywords: ['asset', 'laptop', 'desktop', 'server', 'printer', 'phone', 'monitor', 'network', 'macbook', 'thinkpad', 'dell', 'hp', 'cisco', 'iphone', 'hardware'], route: '/assets', label: 'Assets' },
  { keywords: ['employee', 'staff', 'john', 'sarah', 'mike', 'lisa', 'david', 'amy', 'kevin', 'rachel', 'people', 'hr'], route: '/employees', label: 'Employees' },
  { keywords: ['ticket', 'maintenance', 'repair', 'fix', 'broken', 'issue', 'problem', 'support', 'incident'], route: '/maintenance', label: 'Maintenance' },
  { keywords: ['change', 'change request', 'chg', 'implement', 'rollout', 'upgrade', 'migration'], route: '/change-requests', label: 'Change Requests' },
  { keywords: ['service desk', 'itsm', 'service catalog', 'itil', 'service management'], route: '/service-desk', label: 'Service Desk' },
  { keywords: ['warranty', 'expir', 'renew'], route: '/warranty', label: 'Warranty' },
  { keywords: ['report', 'analytics', 'chart', 'statistic', 'summary'], route: '/reports', label: 'Reports' },
  { keywords: ['setting', 'config', 'theme', 'smtp', 'email', 'whatsapp', 'company'], route: '/settings', label: 'Settings' },
  { keywords: ['user', 'role', 'permission', 'rbac', 'access'], route: '/users', label: 'Users & Roles' },
  { keywords: ['ai', 'assistant', 'chat', 'help', 'recommend'], route: '/ai-assistant', label: 'AI Assistant' },
  { keywords: ['customer', 'client', 'uen', 'brn', 'contract', 'prospect'], route: '/customers', label: 'Customers' },
  { keywords: ['vendor', 'supplier', 'procurement', 'purchase'], route: '/vendors', label: 'Vendors' },
  { keywords: ['crm', 'activity', 'follow-up', 'meeting', 'site visit', 'relationship'], route: '/crm', label: 'CRM' },
  { keywords: ['invoice', 'finance', 'payment', 'billing', 'quotation', 'gst', 'revenue'], route: '/finance', label: 'Finance' },
];

const notifications = [
  { id: 1, text: 'iPhone 15 Pro warranty expires in 12 days', type: 'warning', href: '/warranty', time: '2h ago' },
  { id: 2, text: 'Server RAM upgrade ticket is open', type: 'alert', href: '/maintenance?search=Server+RAM', time: '4h ago' },
  { id: 3, text: 'HP LaserJet Pro needs maintenance', type: 'alert', href: '/maintenance?search=HP+LaserJet', time: '1d ago' },
  { id: 4, text: '3 assets available for assignment', type: 'info', href: '/assets?status=available', time: '1d ago' },
];

export default function Header() {
  const { lang, setLang, sidebarOpen } = useApp();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const lower = searchQuery.toLowerCase();
    const match = searchRoutes.find(r => r.keywords.some(k => lower.includes(k)));
    if (match) {
      router.push(`${match.route}?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  const suggestions = searchQuery.trim().length >= 2
    ? searchRoutes.filter(r => r.keywords.some(k => k.includes(searchQuery.toLowerCase())))
    : [];

  return (
    <motion.header
      className="h-16 bg-black/10 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ marginLeft: sidebarOpen ? 260 : 72 }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <form onSubmit={handleSearch}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            placeholder={t('app.search', lang)}
            className="glass-input w-full pl-10 pr-4 py-2 text-sm"
          />
        </form>
        <AnimatePresence>
          {showSearch && suggestions.length > 0 && (
            <motion.div
              className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {suggestions.map(s => (
                <button
                  key={s.route}
                  onClick={() => { router.push(`${s.route}?search=${encodeURIComponent(searchQuery.trim())}`); setSearchQuery(''); setShowSearch(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-left transition-all"
                >
                  <span className="text-white/70 text-xs">{lang === 'en' ? `Search in ${s.label}` : `在${s.label}中搜索`}</span>
                  <ArrowRight className="w-3 h-3 text-white/30" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <WeatherCard />

        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          className="glass-button flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? '中文' : 'EN'}</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button className="relative glass-button p-2" onClick={() => setShowNotif(!showNotif)}>
            <Bell className="w-4 h-4" />
            <motion.span
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {notifications.length}
            </motion.span>
          </button>
          <AnimatePresence>
            {showNotif && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-80 glass-card p-3 z-50"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-xs font-semibold">{lang === 'en' ? 'Notifications' : '通知'}</span>
                  <button onClick={() => setShowNotif(false)} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <motion.button
                      key={n.id}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-left transition-all"
                      onClick={() => { router.push(n.href); setShowNotif(false); }}
                      whileHover={{ x: 2 }}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        n.type === 'warning' ? 'bg-amber-400' : n.type === 'alert' ? 'bg-red-400' : 'bg-cyan-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs leading-relaxed">{n.text}</p>
                        <span className="text-white/30 text-[10px]">{n.time}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-white/20 flex-shrink-0 mt-1" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 glass-button px-2.5 py-1.5">
          <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <span className="text-xs text-white/80">Admin</span>
        </div>
      </div>
    </motion.header>
  );
}
