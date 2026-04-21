'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Globe, User, Shield, Wrench, Monitor, X, ArrowRight, LogOut,
  AlertTriangle, DollarSign, GitBranch, CheckCircle, MessageSquare, Check,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { useAuth } from '@/lib/auth-context';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

const notifTypeIcons: Record<string, React.ElementType> = {
  'warranty-expiry': AlertTriangle,
  'invoice-overdue': DollarSign,
  'approval-needed': Shield,
  'ticket-assigned': Wrench,
  'change-approved': CheckCircle,
  'change-rejected': X,
  'general': MessageSquare,
};

const notifTypeColors: Record<string, string> = {
  'warranty-expiry': 'bg-amber-400',
  'invoice-overdue': 'bg-red-400',
  'approval-needed': 'bg-blue-400',
  'ticket-assigned': 'bg-orange-400',
  'change-approved': 'bg-emerald-400',
  'change-rejected': 'bg-red-400',
  'general': 'bg-accent-400',
};

function formatNotifTime(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'en' ? 'Just now' : '刚刚';
  if (mins < 60) return lang === 'en' ? `${mins}m ago` : `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === 'en' ? `${hrs}h ago` : `${hrs}小时前`;
  const days = Math.floor(hrs / 24);
  return lang === 'en' ? `${days}d ago` : `${days}天前`;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function Header() {
  const { lang, setLang, sidebarOpen } = useApp();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* silent */ }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
          <button className="relative glass-button p-2" onClick={() => { setShowNotif(!showNotif); if (!showNotif) fetchNotifications(); }}>
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold px-1"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </button>
          <AnimatePresence>
            {showNotif && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-96 glass-card p-0 z-50 overflow-hidden"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/10">
                  <span className="text-white text-xs font-semibold">{lang === 'en' ? 'Notifications' : '通知'}</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true, userId: user?.id }) });
                          fetchNotifications();
                        }}
                        className="text-accent-400 hover:text-accent-300 text-[10px] flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {lang === 'en' ? 'Mark all read' : '全部已读'}
                      </button>
                    )}
                    <button onClick={() => setShowNotif(false)} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-white/30 text-xs">{lang === 'en' ? 'No notifications yet' : '暂无通知'}</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon = notifTypeIcons[n.type] || MessageSquare;
                      const dotColor = notifTypeColors[n.type] || 'bg-accent-400';
                      const timeAgo = formatNotifTime(n.createdAt, lang);
                      return (
                        <motion.button
                          key={n.id}
                          className={`w-full flex items-start gap-2.5 p-3 text-left transition-all border-b border-white/5 last:border-b-0 ${
                            n.isRead ? 'hover:bg-white/5' : 'bg-white/[0.03] hover:bg-white/[0.07]'
                          }`}
                          onClick={async () => {
                            if (!n.isRead) {
                              await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [n.id] }) });
                              fetchNotifications();
                            }
                            if (n.link) { router.push(n.link); setShowNotif(false); }
                          }}
                          whileHover={{ x: 2 }}
                        >
                          <div className={`w-7 h-7 rounded-lg ${n.isRead ? 'bg-white/5' : 'bg-white/10'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Icon className={`w-3.5 h-3.5 ${n.isRead ? 'text-white/30' : 'text-white/70'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!n.isRead && <div className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />}
                              <p className={`text-xs font-medium truncate ${n.isRead ? 'text-white/40' : 'text-white/90'}`}>{n.title}</p>
                            </div>
                            <p className={`text-[11px] leading-relaxed mt-0.5 line-clamp-2 ${n.isRead ? 'text-white/25' : 'text-white/50'}`}>{n.message}</p>
                            <span className="text-white/20 text-[10px]">{timeAgo}</span>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-white/10">
                    <button
                      onClick={() => { router.push('/activity'); setShowNotif(false); }}
                      className="w-full text-center text-accent-400/80 hover:text-accent-400 text-[11px] py-1.5 rounded-lg hover:bg-white/5 transition-all"
                    >
                      {lang === 'en' ? 'View Activity Log' : '查看活动日志'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User & Sign Out */}
        <Link href="/profile" className="flex items-center gap-2 glass-button px-2.5 py-1.5 hover:bg-white/10 transition-all cursor-pointer">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-accent-500/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-accent-300" />
            </div>
          )}
          <span className="text-xs text-white/80">{user?.displayName || user?.username || 'Admin'}</span>
        </Link>
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="glass-button flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all"
          title={t('app.logout', lang)}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('app.logout', lang)}</span>
        </button>
      </div>
    </motion.header>
  );
}
