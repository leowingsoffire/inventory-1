'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor, Wrench, Shield, AlertTriangle, GitBranch, BookOpen,
  Server, Settings, BarChart3, Users, FileText, Headphones,
  Network, Database, Mail, Lock, HardDrive, Cpu,
  ArrowRight, ExternalLink, TrendingUp, Clock,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function getServiceCategories(counts: Record<string, number>) {
  return [
    {
      title: 'Incident Management',
      titleZh: '事件管理',
      description: 'Track and resolve IT incidents and service disruptions',
      descZh: '跟踪和解决IT事件和服务中断',
      icon: AlertTriangle,
      color: 'from-red-500 to-orange-500',
      href: '/maintenance',
      stats: { label: 'Open Tickets', value: counts.openTickets ?? 0 },
    },
    {
      title: 'Change Management',
      titleZh: '变更管理',
      description: 'Plan, approve, and implement IT changes safely',
      descZh: '安全地规划、审批和实施IT变更',
      icon: GitBranch,
      color: 'from-blue-500 to-accent-500',
      href: '/change-requests',
      stats: { label: 'Pending Changes', value: counts.pendingChanges ?? 0 },
    },
    {
      title: 'Asset Management',
      titleZh: '资产管理',
      description: 'Track hardware, software, and IT inventory lifecycle',
      descZh: '跟踪硬件、软件和IT库存生命周期',
      icon: Monitor,
      color: 'from-violet-500 to-purple-500',
      href: '/assets',
      stats: { label: 'Total Assets', value: counts.totalAssets ?? 0 },
    },
    {
      title: 'Configuration',
      titleZh: '配置管理',
      description: 'Manage system configurations and infrastructure',
      descZh: '管理系统配置和基础设施',
      icon: Settings,
      color: 'from-slate-500 to-slate-600',
      href: '/settings',
      stats: { label: 'Config Items', value: counts.totalAssets ?? 0 },
    },
    {
      title: 'Knowledge Base',
      titleZh: '知识库',
      description: 'Access documentation, guides, and troubleshooting articles',
      descZh: '访问文档、指南和故障排除文章',
      icon: BookOpen,
      color: 'from-emerald-500 to-green-500',
      href: '/ai-assistant',
      stats: { label: 'Articles', value: 0 },
    },
    {
      title: 'Service Catalog',
      titleZh: '服务目录',
      description: 'Browse and request IT services and resources',
      descZh: '浏览和请求IT服务和资源',
      icon: FileText,
      color: 'from-amber-500 to-yellow-500',
      href: '/maintenance?action=add',
      stats: { label: 'Services', value: counts.totalTickets ?? 0 },
    },
    {
      title: 'User Administration',
      titleZh: '用户管理',
      description: 'Manage users, roles, and access permissions',
      descZh: '管理用户、角色和访问权限',
      icon: Users,
      color: 'from-indigo-500 to-blue-500',
      href: '/users',
      stats: { label: 'Active Users', value: counts.activeUsers ?? 0 },
    },
    {
      title: 'Reports & Analytics',
      titleZh: '报告分析',
      description: 'View dashboards, KPIs, and performance metrics',
      descZh: '查看仪表板、KPI和绩效指标',
      icon: BarChart3,
      color: 'from-teal-500 to-emerald-500',
      href: '/reports',
      stats: { label: 'Dashboards', value: 6 },
    },
    {
      title: 'Network & Security',
      titleZh: '网络安全',
      description: 'Monitor network health and security posture',
      descZh: '监控网络健康和安全状态',
      icon: Shield,
      color: 'from-rose-500 to-pink-500',
      href: '/warranty',
      stats: { label: 'Alerts', value: counts.warrantyAlerts ?? 0 },
    },
    {
      title: 'Email & Notifications',
      titleZh: '邮件通知',
      description: 'Configure email alerts, SMTP, and notification rules',
      descZh: '配置邮件警报、SMTP和通知规则',
      icon: Mail,
      color: 'from-sky-500 to-blue-400',
      href: '/settings',
      stats: { label: 'Templates', value: 0 },
    },
    {
      title: 'Vendor Management',
      titleZh: '供应商管理',
      description: 'Track vendors, contracts, and procurement',
      descZh: '跟踪供应商、合同和采购',
      icon: HardDrive,
      color: 'from-orange-500 to-amber-500',
      href: '/vendors',
      stats: { label: 'Vendors', value: counts.totalVendors ?? 0 },
    },
    {
      title: 'Customer Relations',
      titleZh: '客户关系',
      description: 'CRM, invoicing, and customer engagement tracking',
      descZh: 'CRM、发票和客户互动跟踪',
      icon: Headphones,
      color: 'from-fuchsia-500 to-purple-500',
      href: '/customers',
      stats: { label: 'Clients', value: counts.totalCustomers ?? 0 },
    },
  ];
}

const quickLinks = [
  { label: 'Create Incident', labelZh: '创建事件', href: '/maintenance?action=add', icon: AlertTriangle },
  { label: 'New Change Request', labelZh: '新变更请求', href: '/change-requests?action=add', icon: GitBranch },
  { label: 'Register Asset', labelZh: '登记资产', href: '/assets?action=add', icon: Monitor },
  { label: 'View All Changes', labelZh: '查看所有变更', href: '/change-requests', icon: FileText },
  { label: 'AI Assistant', labelZh: 'AI 助手', href: '/ai-assistant', icon: Cpu },
  { label: 'System Settings', labelZh: '系统设置', href: '/settings', icon: Settings },
];

export default function ServiceDeskPage() {
  const { lang } = useApp();
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/ai/context').then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        setCounts({
          openTickets: (data.maintenance?.open ?? 0) + (data.maintenance?.inProgress ?? 0),
          pendingChanges: data.changeRequests?.total ?? 0,
          totalAssets: data.assets?.total ?? 0,
          totalTickets: data.maintenance?.total ?? 0,
          activeUsers: data.employees?.total ?? 0,
          warrantyAlerts: data.assets?.warrantyExpiringSoon ?? 0,
          totalVendors: data.vendors?.total ?? 0,
          totalCustomers: data.customers?.total ?? 0,
        });
      }
    }).catch(() => {});
  }, []);

  const serviceCategories = getServiceCategories(counts);

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-accent-500 flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Service Desk' : '服务台'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'IT Service Management Hub — Manage incidents, changes, assets, and services' : 'IT服务管理中心 — 管理事件、变更、资产和服务'}
            </p>
          </div>
        </motion.div>

        {/* Quick Links Bar */}
        <motion.div variants={itemVariants} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-white/70 text-sm font-medium">{lang === 'en' ? 'Quick Actions' : '快捷操作'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-sm transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {lang === 'en' ? link.label : link.labelZh}
                  </motion.button>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Service Category Tiles — ServiceNow-style grid */}
        <motion.div variants={itemVariants}>
          <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">
            {lang === 'en' ? 'Service Categories' : '服务类别'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {serviceCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.title} href={cat.href}>
                  <motion.div
                    className="glass-card glass-card-hover p-5 cursor-pointer group relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    {/* Gradient accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-white/0 group-hover:text-white/40 transition-all" />
                    </div>
                    
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {lang === 'en' ? cat.title : cat.titleZh}
                    </h3>
                    <p className="text-white/40 text-xs leading-relaxed mb-3">
                      {lang === 'en' ? cat.description : cat.descZh}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-white/30" />
                        <span className="text-white/40 text-xs">{cat.stats.label}</span>
                      </div>
                      <span className="text-white font-bold text-sm">{cat.stats.value}</span>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom info bar */}
        <motion.div variants={itemVariants} className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/50 text-sm">
              {lang === 'en' ? 'All systems operational' : '所有系统正常运行'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>{lang === 'en' ? 'Last refreshed: just now' : '最后刷新：刚刚'}</span>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-blue-400/80 hover:text-blue-400 transition-colors"
            >
              {lang === 'en' ? 'Go to Dashboard' : '前往仪表板'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
