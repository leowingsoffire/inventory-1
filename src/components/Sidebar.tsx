'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Monitor,
  Users,
  Wrench,
  BarChart3,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Cpu,
  Shield,
  ShieldCheck,
  Building2,
  Truck,
  FileText,
  DollarSign,
  GitBranch,
  Server,
  AlertTriangle,
  Plus,
  List,
  FolderOpen,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import { getAvatar } from '@/lib/ai-avatars';
import KoreanFaceAvatar from '@/components/KoreanFaceAvatar';

interface SubItem {
  href: string;
  label: string;
  labelZh: string;
  icon?: React.ElementType;
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  children?: SubItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
  { href: '/service-desk', icon: Server, label: 'nav.serviceDesk',
    children: [
      { href: '/service-desk', label: 'Overview', labelZh: '概览', icon: LayoutDashboard },
      { href: '/maintenance?action=add', label: 'Create Incident', labelZh: '创建事件', icon: Plus },
      { href: '/change-requests?action=add', label: 'New Change', labelZh: '新变更', icon: Plus },
    ],
  },
  { href: '/maintenance', icon: AlertTriangle, label: 'nav.maintenance',
    children: [
      { href: '/maintenance?action=add', label: 'Create New', labelZh: '创建工单', icon: Plus },
      { href: '/maintenance?status=open', label: 'Open', labelZh: '待处理', icon: FolderOpen },
      { href: '/maintenance?status=inProgress', label: 'In Progress', labelZh: '处理中', icon: Clock },
      { href: '/maintenance?status=resolved', label: 'Resolved', labelZh: '已解决', icon: CheckCircle },
      { href: '/maintenance', label: 'All', labelZh: '全部', icon: List },
    ],
  },
  { href: '/change-requests', icon: GitBranch, label: 'nav.changes',
    children: [
      { href: '/change-requests?action=add', label: 'Create New', labelZh: '新建', icon: Plus },
      { href: '/change-requests?state=new', label: 'Open', labelZh: '待处理' },
      { href: '/change-requests?state=closed', label: 'Closed', labelZh: '已关闭' },
      { href: '/change-requests', label: 'All', labelZh: '全部', icon: List },
    ],
  },
  { href: '/assets', icon: Monitor, label: 'nav.assets' },
  { href: '/employees', icon: Users, label: 'nav.employees' },
  { href: '/customers', icon: Building2, label: 'nav.customers' },
  { href: '/vendors', icon: Truck, label: 'nav.vendors' },
  { href: '/crm', icon: FileText, label: 'nav.crm' },
  { href: '/finance', icon: DollarSign, label: 'nav.finance' },
  { href: '/compliance', icon: Shield, label: 'nav.compliance' },
  { href: '/warranty', icon: AlertTriangle, label: 'nav.warranty' },
  { href: '/users', icon: ShieldCheck, label: 'nav.users' },
  { href: '/reports', icon: BarChart3, label: 'nav.reports' },
  { href: '/activity', icon: Clock, label: 'nav.activity' },
  { href: '/ai-assistant', icon: Bot, label: 'nav.ai' },
  { href: '/settings', icon: Settings, label: 'nav.settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen, aiAvatar } = useApp();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const currentAvatar = getAvatar(aiAvatar);

  function toggleGroup(href: string) {
    setExpandedGroups((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 260 : 72 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="glass-sidebar fixed left-0 top-0 h-screen z-40 flex flex-col"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
            <motion.div
              className="flex-shrink-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Cpu className="w-8 h-8 text-accent-400" />
            </motion.div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <h1 className="text-white font-bold text-lg leading-tight">Unitech IT</h1>
                  <p className="text-white/50 text-xs">{t('app.subtitle', lang)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/') ||
                (item.children && item.children.some((c) => pathname === c.href.split('?')[0]));
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0 && sidebarOpen;
              const isExpanded = expandedGroups.includes(item.href);

              return (
                <div key={item.href}>
                  <div className="flex items-center">
                    <Link href={item.href} className="flex-1">
                      <motion.div
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-white/15 text-white shadow-lg'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isActive && (
                          <motion.div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-400 rounded-r-full"
                            layoutId="activeTab"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        {item.href === '/ai-assistant' ? (
                          <div className="w-5 h-5 flex-shrink-0"><KoreanFaceAvatar avatar={currentAvatar} size="xs" animate={false} /></div>
                        ) : (
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent-400' : ''}`} />
                        )}
                        <AnimatePresence>
                          {sidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-sm font-medium whitespace-nowrap flex-1"
                            >
                              {t(item.label, lang)}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </Link>
                    {hasChildren && (
                      <button
                        onClick={(e) => { e.preventDefault(); toggleGroup(item.href); }}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                      >
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </motion.div>
                      </button>
                    )}
                  </div>

                  {/* Sub items */}
                  <AnimatePresence>
                    {hasChildren && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden ml-6 border-l border-white/10 pl-2 mt-0.5"
                      >
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const childPath = child.href.split('?')[0];
                          const isChildActive = pathname === childPath && (
                            !child.href.includes('?') || 
                            typeof window !== 'undefined' && window.location.search === '?' + child.href.split('?')[1]
                          );
                          return (
                            <Link key={child.href} href={child.href}>
                              <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                                isChildActive ? 'text-accent-400 bg-white/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }`}>
                                {ChildIcon && <ChildIcon className="w-3 h-3" />}
                                <span>{lang === 'en' ? child.label : child.labelZh}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Toggle Button */}
          <div className="p-2 border-t border-white/10">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>
    </>
  );
}
