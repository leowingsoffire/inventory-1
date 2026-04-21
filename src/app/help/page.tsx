'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle, BookOpen, FileText, Lightbulb, ExternalLink, Search,
  Monitor, Wrench, Shield, BarChart3, Bot, Settings, GitBranch,
  Server, Zap, ClipboardCheck, MapPin, Mail, CalendarClock, FileCheck,
  Cloud,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import Link from 'next/link';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

interface GuideItem {
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  href: string;
  icon: React.ElementType;
}

const moduleGuides: GuideItem[] = [
  { title: 'Dashboard', titleZh: '仪表盘', description: 'Overview of KPIs, alerts and quick actions', descriptionZh: 'KPI概览、提醒和快捷操作', href: '/dashboard', icon: BarChart3 },
  { title: 'Asset Management', titleZh: '资产管理', description: 'Track hardware, software and licenses', descriptionZh: '跟踪硬件、软件和许可证', href: '/assets', icon: Monitor },
  { title: 'Service Desk', titleZh: '服务台', description: 'Incident management and service requests', descriptionZh: '事件管理和服务请求', href: '/service-desk', icon: Server },
  { title: 'Maintenance', titleZh: '维护工单', description: 'Create and manage maintenance tickets', descriptionZh: '创建和管理维护工单', href: '/maintenance', icon: Wrench },
  { title: 'Change Requests', titleZh: '变更请求', description: 'RFC lifecycle and approvals', descriptionZh: 'RFC生命周期和审批', href: '/change-requests', icon: GitBranch },
  { title: 'PDPA Compliance', titleZh: 'PDPA合规', description: 'Data protection assessments and controls', descriptionZh: '数据保护评估和控制', href: '/compliance', icon: Shield },
  { title: 'Knowledge Base', titleZh: '知识库', description: 'Articles, how-tos and documentation', descriptionZh: '文章、指南和文档', href: '/knowledge-base', icon: BookOpen },
  { title: 'AI Assistant', titleZh: 'AI助手', description: 'Chat, documents and AI-generated guides', descriptionZh: '聊天、文档和AI生成指南', href: '/ai-assistant', icon: Bot },
  { title: 'Automation Center', titleZh: '自动化中心', description: 'Workflow rules and automated actions', descriptionZh: '工作流规则和自动化操作', href: '/automation', icon: Zap },
  { title: 'Approvals', titleZh: '审批管理', description: 'Approval workflows and pending items', descriptionZh: '审批流程和待审项目', href: '/approvals', icon: ClipboardCheck },
  { title: 'Scheduled Tasks', titleZh: '计划任务', description: 'Recurring tasks and maintenance schedules', descriptionZh: '定期任务和维护计划', href: '/scheduled-tasks', icon: CalendarClock },
  { title: 'Contracts', titleZh: '合同管理', description: 'Vendor contracts and renewal tracking', descriptionZh: '供应商合同和续约跟踪', href: '/contracts', icon: FileCheck },
  { title: 'Communications', titleZh: '通讯中心', description: 'Internal messaging and notifications', descriptionZh: '内部消息和通知', href: '/communications', icon: Mail },
  { title: 'Locations', titleZh: '位置管理', description: 'Office and data center locations', descriptionZh: '办公室和数据中心位置', href: '/locations', icon: MapPin },
  { title: 'Settings', titleZh: '系统设置', description: 'System configuration and preferences', descriptionZh: '系统配置和偏好设置', href: '/settings', icon: Settings },
];

interface CloudStorageLink {
  name: string;
  description: string;
  descriptionZh: string;
  url: string;
  color: string;
  logo: string;
}

const cloudStorageLinks: CloudStorageLink[] = [
  { name: 'Google Drive', description: 'Access shared documents and folders', descriptionZh: '访问共享文档和文件夹', url: 'https://drive.google.com', color: 'from-yellow-400 via-green-400 to-blue-500', logo: '📁' },
  { name: 'OneDrive', description: 'Microsoft cloud storage and sync', descriptionZh: 'Microsoft 云存储和同步', url: 'https://onedrive.live.com', color: 'from-blue-400 to-blue-600', logo: '☁️' },
  { name: 'SharePoint', description: 'Team sites and document libraries', descriptionZh: '团队站点和文档库', url: 'https://www.microsoft.com/microsoft-365/sharepoint', color: 'from-teal-400 to-cyan-600', logo: '🏢' },
  { name: 'Dropbox', description: 'File sharing and collaboration', descriptionZh: '文件共享和协作', url: 'https://www.dropbox.com', color: 'from-blue-500 to-indigo-600', logo: '📦' },
];

export default function HelpPage() {
  const { lang } = useApp();
  const [search, setSearch] = useState('');

  const filteredGuides = moduleGuides.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.title.toLowerCase().includes(q) || g.titleZh.includes(q) || g.description.toLowerCase().includes(q);
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
                <HelpCircle className="w-6 h-6 text-cyan-400" />
              </div>
              {lang === 'en' ? 'Help Center' : '帮助中心'}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {lang === 'en' ? 'Guides, documentation and cloud storage links' : '指南、文档和云存储链接'}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'en' ? 'Search guides...' : '搜索指南...'}
              className="glass-input w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div className="glass-card p-5" custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            {lang === 'en' ? 'Quick Tips' : '快速提示'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { en: 'Use the floating AI button (bottom-right) for instant help on any page', zh: '使用右下角的浮动AI按钮可在任何页面获得即时帮助' },
              { en: 'Press Ctrl+K to open global search from anywhere', zh: '按 Ctrl+K 可在任何位置打开全局搜索' },
              { en: 'Click your avatar in the sidebar to switch languages', zh: '点击侧边栏中的头像可切换语言' },
            ].map((tip, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/50 text-xs leading-relaxed">
                {lang === 'en' ? tip.en : tip.zh}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Module Guides */}
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            {lang === 'en' ? 'Module Guides & Documentation' : '模块指南与文档'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGuides.map((guide, i) => {
              const Icon = guide.icon;
              return (
                <Link key={guide.href} href={guide.href}>
                  <motion.div
                    className="glass-card p-4 cursor-pointer hover:bg-white/[0.08] transition-all group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent-500/10 border border-accent-500/20 flex-shrink-0">
                        <Icon className="w-4 h-4 text-accent-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white text-sm font-medium group-hover:text-accent-400 transition-colors">
                          {lang === 'en' ? guide.title : guide.titleZh}
                        </h3>
                        <p className="text-white/35 text-[11px] mt-0.5 line-clamp-2">
                          {lang === 'en' ? guide.description : guide.descriptionZh}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
          {filteredGuides.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">
              {lang === 'en' ? 'No guides match your search' : '没有匹配的指南'}
            </div>
          )}
        </motion.div>

        {/* Cloud Storage Links */}
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" />
            {lang === 'en' ? 'Cloud Storage & Documents' : '云存储与文档'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {cloudStorageLinks.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-4 hover:bg-white/[0.08] transition-all group block"
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center text-xl shadow-lg`}>
                    {link.logo}
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium flex items-center gap-1.5 group-hover:text-accent-400 transition-colors">
                      {link.name}
                      <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-accent-400/60" />
                    </h3>
                  </div>
                </div>
                <p className="text-white/35 text-[11px]">
                  {lang === 'en' ? link.description : link.descriptionZh}
                </p>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Documentation Resources */}
        <motion.div className="glass-card p-5" custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            {lang === 'en' ? 'Additional Resources' : '其他资源'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/knowledge-base">
              <motion.div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer group" whileHover={{ x: 3 }}>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">
                      {lang === 'en' ? 'Knowledge Base' : '知识库'}
                    </h3>
                    <p className="text-white/35 text-[11px]">{lang === 'en' ? 'Browse all articles and how-to guides' : '浏览所有文章和操作指南'}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
            <Link href="/ai-assistant">
              <motion.div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer group" whileHover={{ x: 3 }}>
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-white text-sm font-medium group-hover:text-emerald-400 transition-colors">
                      {lang === 'en' ? 'AI-Generated Guides' : 'AI生成指南'}
                    </h3>
                    <p className="text-white/35 text-[11px]">{lang === 'en' ? 'Auto-generated step-by-step documentation' : '自动生成的分步文档'}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
