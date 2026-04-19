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
import { t } from '@/lib/i18n';
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

const categoryData = [
  { name: 'Laptops', value: 45, icon: Laptop },
  { name: 'Desktops', value: 28, icon: Monitor },
  { name: 'Servers', value: 12, icon: Server },
  { name: 'Printers', value: 8, icon: Printer },
  { name: 'Phones', value: 15, icon: Smartphone },
  { name: 'Others', value: 10, icon: HardDrive },
];

const monthlyData = [
  { month: 'Jan', assets: 85, tickets: 12 },
  { month: 'Feb', assets: 92, tickets: 8 },
  { month: 'Mar', assets: 98, tickets: 15 },
  { month: 'Apr', assets: 105, tickets: 10 },
  { month: 'May', assets: 110, tickets: 7 },
  { month: 'Jun', assets: 118, tickets: 13 },
];

const recentActivities = [
  { action: 'New laptop assigned', entity: 'MacBook Pro 16"', user: 'John Tan', time: '5 min ago', type: 'assign', href: '/assets?search=MacBook' },
  { action: 'Maintenance completed', entity: 'HP LaserJet Pro', user: 'Sarah Lim', time: '1 hour ago', type: 'maintenance', href: '/maintenance?search=HP+LaserJet' },
  { action: 'New asset registered', entity: 'Dell Monitor U2723QE', user: 'Admin', time: '2 hours ago', type: 'new', href: '/assets?search=Dell+Monitor' },
  { action: 'Warranty expiring', entity: 'Lenovo ThinkPad X1', user: 'System', time: '3 hours ago', type: 'warning', href: '/warranty' },
  { action: 'Ticket resolved', entity: 'Network Switch #5', user: 'Mike Wong', time: '5 hours ago', type: 'resolve', href: '/maintenance?search=Network+Switch' },
];

const aiInsights = [
  { text: '3 laptops have warranties expiring in 30 days', type: 'warning', href: '/warranty' },
  { text: 'Server room temperature trend is optimal', type: 'success', href: '/reports' },
  { text: 'Recommend upgrading 5 desktops with >4 years age', type: 'info', href: '/assets?status=assigned&category=desktop' },
  { text: 'Monthly maintenance costs decreased by 15%', type: 'success', href: '/reports' },
];

const warrantyAlerts = [
  { name: 'iPhone 15 Pro', tag: 'UT-PH-001', daysLeft: 12, status: 'critical' },
  { name: 'HP LaserJet Pro', tag: 'UT-PR-001', daysLeft: 28, status: 'warning' },
  { name: 'Dell PowerEdge R740', tag: 'UT-SV-001', daysLeft: 90, status: 'info' },
];

export default function DashboardPage() {
  const { lang, theme } = useApp();
  const router = useRouter();

  const stats = [
    { label: t('dash.totalAssets', lang), value: 118, icon: Monitor, color: 'from-cyan-500 to-teal-600', glow: 'rgba(34,211,238,0.15)', href: '/assets' },
    { label: t('dash.assigned', lang), value: 89, icon: CheckCircle, color: 'from-emerald-500 to-green-600', glow: 'rgba(52,211,153,0.15)', href: '/assets?status=assigned' },
    { label: t('dash.available', lang), value: 21, icon: Package, color: 'from-violet-500 to-purple-600', glow: 'rgba(167,139,250,0.15)', href: '/assets?status=available' },
    { label: t('dash.maintenance', lang), value: 8, icon: Wrench, color: 'from-amber-500 to-orange-600', glow: 'rgba(251,191,36,0.15)', href: '/maintenance' },
    { label: t('dash.employees', lang), value: 52, icon: Users, color: 'from-pink-500 to-rose-600', glow: 'rgba(236,72,153,0.15)', href: '/employees' },
    { label: t('dash.openTickets', lang), value: 5, icon: AlertTriangle, color: 'from-red-500 to-rose-600', glow: 'rgba(239,68,68,0.15)', href: '/maintenance?status=open' },
    { label: lang === 'en' ? 'Changes' : '变更', value: 12, icon: GitBranch, color: 'from-indigo-500 to-blue-600', glow: 'rgba(99,102,241,0.15)', href: '/change-requests' },
    { label: lang === 'en' ? 'Customers' : '客户', value: 5, icon: Building2, color: 'from-fuchsia-500 to-pink-600', glow: 'rgba(217,70,239,0.15)', href: '/customers' },
    { label: lang === 'en' ? 'Revenue' : '收入', value: 15800, icon: DollarSign, color: 'from-lime-500 to-emerald-600', glow: 'rgba(132,204,22,0.15)', href: '/finance' },
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
              {t('app.welcome', lang)}, Admin 👋
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
                  <p className="text-2xl font-bold text-white">
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="text-white/50 text-xs mt-1">{stat.label}</p>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Distribution Pie */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">{t('dash.assetDistribution', lang)}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
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
              {categoryData.map((cat, i) => {
                const Icon = cat.icon;
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
          </motion.div>

          {/* Monthly Trend */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">{t('dash.monthlyTrend', lang)}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.chartColors[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={theme.chartColors[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white',
                    }}
                  />
                  <Area type="monotone" dataKey="assets" stroke={theme.chartColors[0]} fillOpacity={1} fill="url(#colorAssets)" strokeWidth={2} />
                  <Bar dataKey="tickets" fill={theme.chartColors[1]} radius={[4, 4, 0, 0]} opacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-2">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              {t('dash.recentActivity', lang)}
            </h3>
            <div className="space-y-3">
              {recentActivities.map((activity, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  onClick={() => router.push(activity.href)}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'assign' ? 'bg-blue-400' :
                    activity.type === 'maintenance' ? 'bg-amber-400' :
                    activity.type === 'new' ? 'bg-emerald-400' :
                    activity.type === 'warning' ? 'bg-red-400' :
                    'bg-violet-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-white/40 text-xs truncate">{activity.entity} • {activity.user}</p>
                  </div>
                  <span className="text-white/30 text-xs whitespace-nowrap">{activity.time}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/0 group-hover:text-white/40 transition-all flex-shrink-0" />
                </motion.div>
              ))}
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
                        <Icon className="w-5 h-5 text-cyan-400" />
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
                {aiInsights.map((insight, i) => (
                  <motion.div
                    key={i}
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 cursor-pointer group hover:ring-1 hover:ring-white/20 transition-all ${
                      insight.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                      insight.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                      'bg-cyan-500/10 border border-cyan-500/20'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    onClick={() => router.push(insight.href)}
                    whileHover={{ x: 4 }}
                  >
                    {insight.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" /> :
                     insight.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> :
                     <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />}
                    <span className="text-white/70 flex-1">{insight.text}</span>
                    <ExternalLink className="w-3 h-3 text-white/0 group-hover:text-white/40 transition-all flex-shrink-0 mt-0.5" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Change Requests Summary */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              {lang === 'en' ? 'Recent Change Requests' : '最近变更请求'}
            </h3>
            <Link href="/change-requests">
              <motion.span className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer" whileHover={{ x: 2 }}>
                {lang === 'en' ? 'View All' : '查看全部'}
                <ArrowUpRight className="w-3 h-3" />
              </motion.span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { number: 'CHG0000001', desc: 'Upgrade server room UPS system', state: 'implement', approval: 'approved', type: 'normal' },
              { number: 'CHG0000002', desc: 'Migrate email to Microsoft 365', state: 'scheduled', approval: 'approved', type: 'normal' },
              { number: 'CHG0000004', desc: 'Deploy endpoint protection', state: 'implement', approval: 'approved', type: 'standard' },
            ].map((cr, i) => (
              <Link key={cr.number} href="/change-requests">
                <motion.div
                  className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer group hover:bg-white/[0.08] hover:border-white/20 transition-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-400 text-xs font-mono">{cr.number}</span>
                    <ExternalLink className="w-3 h-3 text-white/0 group-hover:text-white/40 transition-all" />
                  </div>
                  <p className="text-white text-sm mb-2 truncate">{cr.desc}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${
                      cr.state === 'implement' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                      cr.state === 'scheduled' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {cr.state.charAt(0).toUpperCase() + cr.state.slice(1)}
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {cr.approval.charAt(0).toUpperCase() + cr.approval.slice(1)}
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
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
              <motion.span className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer" whileHover={{ x: 2 }}>
                {lang === 'en' ? 'View All' : '查看全部'}
                <ArrowUpRight className="w-3 h-3" />
              </motion.span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {warrantyAlerts.map((alert, i) => (
              <Link key={i} href={`/warranty`}>
                <motion.div
                  className={`p-4 rounded-xl border cursor-pointer group hover:ring-1 hover:ring-white/20 transition-all ${
                    alert.status === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                    alert.status === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-cyan-500/10 border-cyan-500/20'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">{alert.name}</span>
                    <ExternalLink className="w-3 h-3 text-white/0 group-hover:text-white/40 transition-all" />
                  </div>
                  <p className="text-white/40 text-xs font-mono mb-2">{alert.tag}</p>
                  <div className={`text-xs font-medium ${
                    alert.status === 'critical' ? 'text-red-400' :
                    alert.status === 'warning' ? 'text-amber-400' :
                    'text-cyan-400'
                  }`}>
                    {alert.daysLeft} {lang === 'en' ? 'days remaining' : '天剩余'}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
