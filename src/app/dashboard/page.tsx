'use client';

import { motion } from 'framer-motion';
import {
  Monitor, Users, Wrench, CheckCircle, AlertTriangle,
  TrendingUp, Package, Plus, Bot, ArrowUpRight,
  Laptop, Server, Printer, Smartphone, HardDrive, Clock,
  Shield, ExternalLink, Building2, DollarSign, GitBranch,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { useAuth } from '@/lib/auth-context';
import { t } from '@/lib/i18n';
import { FeatureGuide, MODULE_GUIDES } from '@/components/FeatureGuide';
import { CyberWorkflow } from '@/components/CyberWorkflow';
import { getModuleWorkflows } from '@/lib/workflow-definitions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const stepTime = Math.abs(Math.floor((duration * 1000) / end));
    const timer = setInterval(() => {
      start += Math.ceil(end / 40);
      if (start >= end) {
        setCurrent(end);
        clearInterval(timer);
      } else {
        setCurrent(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{current}</>;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop, desktop: Monitor, server: Server, printer: Printer,
  phone: Smartphone, monitor: Monitor, network: HardDrive, other: HardDrive,
};

interface DashboardStats {
  totalAssets: number; assigned: number; available: number; maintenance: number;
  employees: number; openTickets: number; changes: number; customers: number;
  vendors: number; revenue: number; warrantyExpiring30: number; warrantyExpiring90: number;
  categoryData: { name: string; value: number }[];
  recentActivity: { action: string; entity: string; details?: string; time: string; user: string }[];
  changesByState: { state: string; count: number }[];
}

const emptyStats: DashboardStats = {
  totalAssets: 0, assigned: 0, available: 0, maintenance: 0,
  employees: 0, openTickets: 0, changes: 0, customers: 0,
  vendors: 0, revenue: 0, warrantyExpiring30: 0, warrantyExpiring90: 0,
  categoryData: [], recentActivity: [], changesByState: [],
};

export default function DashboardPage() {
  const { lang, theme } = useApp();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = data.totalAssets === 0 && data.employees === 0 && data.openTickets === 0;

  const stats = [
    { label: t('dash.totalAssets', lang), value: data.totalAssets, icon: Monitor, color: 'from-accent-500 to-accent-600', glow: 'rgba(34,211,238,0.15)', href: '/assets' },
    { label: t('dash.assigned', lang), value: data.assigned, icon: CheckCircle, color: 'from-emerald-500 to-green-600', glow: 'rgba(52,211,153,0.15)', href: '/assets?status=assigned' },
    { label: t('dash.available', lang), value: data.available, icon: Package, color: 'from-violet-500 to-purple-600', glow: 'rgba(167,139,250,0.15)', href: '/assets?status=available' },
    { label: t('dash.maintenance', lang), value: data.maintenance, icon: Wrench, color: 'from-amber-500 to-orange-600', glow: 'rgba(251,191,36,0.15)', href: '/maintenance' },
    { label: t('dash.employees', lang), value: data.employees, icon: Users, color: 'from-pink-500 to-rose-600', glow: 'rgba(236,72,153,0.15)', href: '/employees' },
    { label: t('dash.openTickets', lang), value: data.openTickets, icon: AlertTriangle, color: 'from-red-500 to-rose-600', glow: 'rgba(239,68,68,0.15)', href: '/maintenance?status=open' },
    { label: lang === 'en' ? 'Changes' : '变更', value: data.changes, icon: GitBranch, color: 'from-indigo-500 to-blue-600', glow: 'rgba(99,102,241,0.15)', href: '/change-requests' },
    { label: lang === 'en' ? 'Customers' : '客户', value: data.customers, icon: Building2, color: 'from-fuchsia-500 to-pink-600', glow: 'rgba(217,70,239,0.15)', href: '/customers' },
    { label: lang === 'en' ? 'Revenue' : '收入', value: data.revenue, icon: DollarSign, color: 'from-lime-500 to-emerald-600', glow: 'rgba(132,204,22,0.15)', href: '/finance' },
  ];

  const quickActions = [
    { label: lang === 'en' ? 'Service Desk' : '服务台', href: '/service-desk', icon: Server },
    { label: lang === 'en' ? 'New Change' : '新变更', href: '/change-requests?action=add', icon: GitBranch },
    { label: lang === 'en' ? 'Add Asset' : '添加资产', href: '/assets?action=add', icon: Plus },
    { label: lang === 'en' ? 'Create Ticket' : '创建工单', href: '/maintenance?action=add', icon: Wrench },
    { label: lang === 'en' ? 'New Invoice' : '新发票', href: '/finance?action=add', icon: DollarSign },
    { label: lang === 'en' ? 'AI Assistant' : 'AI 助手', href: '/ai-assistant', icon: Bot },
  ];

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Title */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {t('app.welcome', lang)}, {user?.displayName || user?.name || 'Admin'} 👋
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? "Here's what's happening with your IT inventory today." : '以下是您今天的 IT 资产概况。'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs">
              {new Date().toLocaleDateString(lang === 'en' ? 'en-SG' : 'zh-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <motion.div
                  className="glass-card glass-card-hover p-4 cursor-pointer group relative overflow-hidden"
                  whileHover={{ scale: 1.04, y: -4 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ boxShadow: `0 8px 32px ${stat.glow}` }}
                >
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-white/0 group-hover:text-white/40 transition-all" />
                  </div>
                  <p className="text-2xl font-bold text-white drop-shadow-sm">
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="text-white/60 text-xs mt-1 font-medium">{stat.label}</p>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        {isEmpty ? (
          <motion.div variants={itemVariants}>
            <FeatureGuide
              {...MODULE_GUIDES.dashboard}
              lang={lang}
              onAction={(action) => {
                if (action.startsWith('navigate:')) router.push(action.replace('navigate:', ''));
              }}
            />
          </motion.div>
        ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Distribution Pie */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">{t('dash.assetDistribution', lang)}</h3>
            {data.categoryData.length > 0 ? (
            <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.categoryData.map((_, index) => (
                      <Cell key={index} fill={theme.chartColors[index % theme.chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {data.categoryData.map((cat, i) => {
                const Icon = categoryIcons[cat.name.toLowerCase()] || HardDrive;
                return (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.chartColors[i % theme.chartColors.length] }} />
                    <Icon className="w-3 h-3 text-white/50" />
                    <span className="text-white/70">{cat.name}</span>
                    <span className="text-white/40 ml-auto">{cat.value}</span>
                  </div>
                );
              })}
            </div>
            </>
            ) : (
              <p className="text-white/30 text-sm text-center py-16">{lang === 'en' ? 'Add assets to see distribution' : '添加资产查看分布'}</p>
            )}
          </motion.div>

          {/* Monthly Trend */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">{t('dash.monthlyTrend', lang)}</h3>
            <div className="h-64 flex items-center justify-center">
              <p className="text-white/30 text-sm">{lang === 'en' ? 'Trend data will populate as you use the system' : '使用系统后趋势数据将自动填充'}</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-2">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-400" />
              {t('dash.recentActivity', lang)}
            </h3>
            <div className="space-y-3">
              {data.recentActivity.length > 0 ? data.recentActivity.map((activity, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <div className="w-2 h-2 rounded-full bg-accent-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-white/40 text-xs truncate">{activity.entity} {activity.details ? `• ${activity.details}` : ''}</p>
                  </div>
                  <span className="text-white/30 text-xs whitespace-nowrap">{new Date(activity.time).toLocaleDateString()}</span>
                </motion.div>
              )) : (
                <p className="text-white/30 text-sm text-center py-8">{lang === 'en' ? 'No activity yet. Start by adding assets or creating tickets.' : '暂无活动。开始添加资产或创建工单。'}</p>
              )}
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">{t('dash.quickActions', lang)}</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.href} href={action.href}>
                      <motion.div
                        className="glass-button flex flex-col items-center gap-2 p-4 text-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-5 h-5 text-accent-400" />
                        <span className="text-xs">{action.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Bot className="w-4 h-4 text-violet-400" />
                </motion.div>
                {t('dash.aiInsights', lang)}
              </h3>
              <div className="space-y-2">
                {data.warrantyExpiring30 > 0 && (
                  <motion.div className="p-3 rounded-xl text-xs flex items-start gap-2 bg-amber-500/10 border border-amber-500/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/70">{data.warrantyExpiring30} {lang === 'en' ? 'warranties expiring within 30 days' : '个保修将在30天内到期'}</span>
                  </motion.div>
                )}
                {data.openTickets > 0 && (
                  <motion.div className="p-3 rounded-xl text-xs flex items-start gap-2 bg-accent-500/10 border border-accent-500/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ArrowUpRight className="w-3.5 h-3.5 text-accent-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/70">{data.openTickets} {lang === 'en' ? 'open tickets need attention' : '个待处理工单需要关注'}</span>
                  </motion.div>
                )}
                {data.totalAssets === 0 && (
                  <motion.div className="p-3 rounded-xl text-xs flex items-start gap-2 bg-accent-500/10 border border-accent-500/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <CheckCircle className="w-3.5 h-3.5 text-accent-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/70">{lang === 'en' ? 'Get started by adding your first asset' : '开始添加您的第一个资产'}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        </>
        )}

        {/* Change Requests Summary */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent-400" />
              {lang === 'en' ? 'Recent Change Requests' : '最近变更请求'}
            </h3>
            <Link href="/change-requests">
              <motion.span className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 cursor-pointer" whileHover={{ x: 2 }}>
                {lang === 'en' ? 'View All' : '查看全部'}
                <ArrowUpRight className="w-3 h-3" />
              </motion.span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.changesByState.length > 0 ? data.changesByState.map((cr, i) => (
              <Link key={cr.state} href="/change-requests">
                <motion.div
                  className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer group hover:bg-white/[0.08] hover:border-white/20 transition-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-accent-400 text-xs font-mono capitalize">{cr.state}</span>
                    <ExternalLink className="w-3 h-3 text-white/0 group-hover:text-white/40 transition-all" />
                  </div>
                  <p className="text-white text-2xl font-bold">{cr.count}</p>
                  <p className="text-white/40 text-xs mt-1">{lang === 'en' ? 'change requests' : '变更请求'}</p>
                </motion.div>
              </Link>
            )) : (
              <div className="col-span-3 text-center py-6">
                <p className="text-white/30 text-sm">{lang === 'en' ? 'No change requests yet' : '暂无变更请求'}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Warranty Alerts Section */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              {lang === 'en' ? 'Warranty Alerts' : '保修提醒'}
            </h3>
            <Link href="/warranty">
              <motion.span className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 cursor-pointer" whileHover={{ x: 2 }}>
                {lang === 'en' ? 'View All' : '查看全部'}
                <ArrowUpRight className="w-3 h-3" />
              </motion.span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.warrantyExpiring30 > 0 || data.warrantyExpiring90 > 0 ? (
              <>
                <Link href="/warranty">
                  <motion.div className="p-4 rounded-xl border bg-red-500/10 border-red-500/20 cursor-pointer group hover:ring-1 hover:ring-white/20 transition-all" whileHover={{ scale: 1.02 }}>
                    <span className="text-white text-sm font-medium">{lang === 'en' ? 'Critical (≤30 days)' : '紧急（≤30天）'}</span>
                    <p className="text-red-400 text-2xl font-bold mt-2">{data.warrantyExpiring30}</p>
                  </motion.div>
                </Link>
                <Link href="/warranty">
                  <motion.div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/20 cursor-pointer group hover:ring-1 hover:ring-white/20 transition-all" whileHover={{ scale: 1.02 }}>
                    <span className="text-white text-sm font-medium">{lang === 'en' ? 'Warning (≤90 days)' : '警告（≤90天）'}</span>
                    <p className="text-amber-400 text-2xl font-bold mt-2">{data.warrantyExpiring90}</p>
                  </motion.div>
                </Link>
              </>
            ) : (
              <div className="col-span-3 text-center py-6">
                <p className="text-white/30 text-sm">{lang === 'en' ? 'No warranty alerts. Add assets with warranty dates to enable tracking.' : '无保修提醒。添加含保修日期的资产以启用追踪。'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
