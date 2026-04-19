'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Sparkles, Plus, Upload, MousePointerClick, X,
  Monitor, Users, Wrench, Shield, FileText, Building2,
  DollarSign, GitBranch, BarChart3, Settings, Bot,
  Truck, HelpCircle, Lightbulb, ChevronRight,
} from 'lucide-react';

export interface FeatureGuideItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  action?: string;
  actionZh?: string;
  href?: string;
}

// Icon bounce + glow animation
const iconVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: [0.8, 1.1, 1],
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 15 },
  },
  hover: {
    scale: 1.15,
    rotate: [0, -5, 5, 0],
    transition: { duration: 0.4 },
  },
};

const pulseVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.2, 0.5],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

interface FeatureGuideProps {
  title: string;
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  features: FeatureGuideItem[];
  lang?: string;
  onAction?: (action: string) => void;
}

export function FeatureGuide({ title, titleZh, description, descriptionZh, features, lang = 'en', onAction }: FeatureGuideProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const isZh = lang === 'zh';

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* AI Guide Header */}
      <motion.div className="relative mb-8" variants={iconVariants} initial="initial" animate="animate">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500/20 to-violet-500/20 border border-accent-500/30 flex items-center justify-center">
          <Bot className="w-10 h-10 text-accent-400" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-2xl bg-accent-500/20"
          variants={pulseVariants}
          animate="animate"
        />
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <h2 className="text-xl font-bold text-white mb-2 text-center">
        {isZh && titleZh ? titleZh : title}
      </h2>
      <p className="text-white/50 text-sm text-center max-w-md mb-8">
        {isZh && descriptionZh ? descriptionZh : description}
      </p>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const isExpanded = expandedIndex === i;

          return (
            <motion.div
              key={i}
              className="glass-card p-5 cursor-pointer group relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
            >
              {/* Animated icon */}
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mb-3 relative"
                whileHover="hover"
                variants={iconVariants}
              >
                <Icon className="w-6 h-6 text-accent-400" />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-accent-400/10"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              </motion.div>

              {/* Title */}
              <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
                {isZh && feature.titleZh ? feature.titleZh : feature.title}
                <motion.div animate={{ x: isExpanded ? 4 : 0, rotate: isExpanded ? 90 : 0 }}>
                  <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                </motion.div>
              </h3>

              {/* Description (expandable) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-white/50 text-xs mt-2 leading-relaxed">
                      {isZh && feature.descriptionZh ? feature.descriptionZh : feature.description}
                    </p>
                    {feature.action && (
                      <motion.button
                        className="mt-3 text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1"
                        whileHover={{ x: 4 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction?.(feature.action!);
                        }}
                      >
                        <MousePointerClick className="w-3 h-3" />
                        {isZh && feature.actionZh ? feature.actionZh : feature.action}
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.06), transparent 70%)' }} />
            </motion.div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <motion.p
        className="text-white/30 text-xs mt-8 flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Lightbulb className="w-3 h-3" />
        {isZh ? '点击每张卡片了解更多' : 'Click each card to learn more'}
      </motion.p>
    </motion.div>
  );
}

// Pre-defined feature guides for each module
export const MODULE_GUIDES = {
  dashboard: {
    title: 'Welcome to your Dashboard',
    titleZh: '欢迎来到仪表盘',
    description: 'Start by adding assets, employees, and tickets. Your dashboard will automatically populate with real-time data.',
    descriptionZh: '首先添加资产、员工和工单。仪表盘将自动显示实时数据。',
    features: [
      { icon: Monitor, title: 'Add Assets', titleZh: '添加资产', description: 'Register your IT equipment — laptops, servers, phones, printers. Each gets a unique tag for tracking.', descriptionZh: '注册您的IT设备 — 笔记本、服务器、手机、打印机。每个都有唯一标签用于追踪。', action: 'navigate:/assets?action=add', actionZh: '前往添加' },
      { icon: Users, title: 'Add Employees', titleZh: '添加员工', description: 'Add your team members so you can assign assets and track ownership.', descriptionZh: '添加团队成员以便分配资产和跟踪所有权。', action: 'navigate:/employees', actionZh: '前往添加' },
      { icon: Wrench, title: 'Create Tickets', titleZh: '创建工单', description: 'Log maintenance requests — repairs, replacements, inspections. Track SLAs and priorities.', descriptionZh: '记录维护请求 — 维修、更换、检查。跟踪SLA和优先级。', action: 'navigate:/maintenance?action=add', actionZh: '前往创建' },
      { icon: Shield, title: 'Warranty Tracking', titleZh: '保修追踪', description: 'Monitor warranty expiry dates and get automated alerts before they lapse.', descriptionZh: '监控保修到期日期，到期前自动提醒。', action: 'navigate:/warranty', actionZh: '查看保修' },
      { icon: DollarSign, title: 'Finance Module', titleZh: '财务模块', description: 'Create invoices, quotations, and credit notes in SGD. GST auto-calculated.', descriptionZh: '创建发票、报价和贷记通知单（新元）。自动计算GST。', action: 'navigate:/finance', actionZh: '前往财务' },
      { icon: Bot, title: 'AI Assistant', titleZh: 'AI助手', description: 'Ask Uni AI anything — it uses your real data to give contextual insights and recommendations.', descriptionZh: '向Uni AI提问 — 它使用您的真实数据提供上下文洞察和建议。', action: 'navigate:/ai-assistant', actionZh: '打开AI助手' },
    ],
  },
  assets: {
    title: 'IT Asset Management',
    titleZh: 'IT资产管理',
    description: 'Start tracking your IT inventory. Add assets manually or import from a spreadsheet.',
    descriptionZh: '开始跟踪您的IT资产。手动添加或从电子表格导入。',
    features: [
      { icon: Plus, title: 'Add New Asset', titleZh: '添加新资产', description: 'Register laptops, desktops, servers, printers, phones, and more. Fill in specs, purchase info, and assignment.', descriptionZh: '注册笔记本、台式机、服务器、打印机、手机等。填写规格、采购信息和分配。', action: 'add' },
      { icon: Upload, title: 'Bulk Import', titleZh: '批量导入', description: 'Upload a CSV or Excel file to import multiple assets at once. Download the template first.', descriptionZh: '上传CSV或Excel文件批量导入资产。先下载模板。', action: 'import' },
      { icon: Monitor, title: 'Categories', titleZh: '分类', description: 'Assets are organized by category: Laptop, Desktop, Server, Printer, Phone, Monitor, Network, and more.', descriptionZh: '资产按类别组织：笔记本、台式机、服务器、打印机、手机、显示器、网络等。' },
    ],
  },
  employees: {
    title: 'Employee Directory',
    titleZh: '员工目录',
    description: 'Manage your team. Add employees to assign assets and track who has what.',
    descriptionZh: '管理团队。添加员工以分配资产并跟踪设备归属。',
    features: [
      { icon: Plus, title: 'Add Employee', titleZh: '添加员工', description: 'Add team members with department, contact info, and job title.', descriptionZh: '添加团队成员，包括部门、联系方式和职位。', action: 'add' },
      { icon: Monitor, title: 'Asset Assignment', titleZh: '资产分配', description: 'See which assets are assigned to each employee at a glance.', descriptionZh: '一目了然地查看每位员工分配了哪些资产。' },
      { icon: Upload, title: 'Import Employees', titleZh: '导入员工', description: 'Bulk import from CSV/Excel with name, email, department, and phone.', descriptionZh: '从CSV/Excel批量导入姓名、邮箱、部门和电话。', action: 'import' },
    ],
  },
  maintenance: {
    title: 'Maintenance & Tickets',
    titleZh: '维护与工单',
    description: 'Log and track IT support requests. Set priorities, assign technicians, monitor SLAs.',
    descriptionZh: '记录和跟踪IT支持请求。设置优先级、分配技术人员、监控SLA。',
    features: [
      { icon: Plus, title: 'Create Ticket', titleZh: '创建工单', description: 'Log a new maintenance request: hardware repair, software install, inspection.', descriptionZh: '记录新维护请求：硬件维修、软件安装、检查。', action: 'add' },
      { icon: Wrench, title: 'Priority Levels', titleZh: '优先级', description: 'Set urgency: Low, Medium, High, Critical. Tracks SLA timelines.', descriptionZh: '设置紧急程度：低、中、高、紧急。跟踪SLA时间线。' },
      { icon: Users, title: 'Assign Staff', titleZh: '分配人员', description: 'Assign tickets to technicians and track resolution progress.', descriptionZh: '将工单分配给技术人员并跟踪解决进度。' },
    ],
  },
  warranty: {
    title: 'Warranty Management',
    titleZh: '保修管理',
    description: 'Track warranty expiry dates. Get automated email alerts before warranties lapse.',
    descriptionZh: '跟踪保修到期日期。保修到期前自动邮件提醒。',
    features: [
      { icon: Shield, title: 'Expiry Monitoring', titleZh: '到期监控', description: 'Color-coded alerts: Red (≤30 days), Amber (≤90 days), Green (safe).', descriptionZh: '颜色编码提醒：红色（≤30天）、琥珀色（≤90天）、绿色（安全）。' },
      { icon: FileText, title: 'Email Alerts', titleZh: '邮件提醒', description: 'Automated notifications to asset owners and managers before warranty expires.', descriptionZh: '保修到期前自动通知资产所有者和经理。' },
      { icon: BarChart3, title: 'Reports', titleZh: '报告', description: 'View warranty coverage overview, renewal costs, and renewal history.', descriptionZh: '查看保修覆盖概况、续期成本和续期历史。' },
    ],
  },
  reports: {
    title: 'Reports & Analytics',
    titleZh: '报告与分析',
    description: 'View insights from your real data. Charts auto-populate as you add assets and records.',
    descriptionZh: '从真实数据查看洞察。随着添加资产和记录，图表自动更新。',
    features: [
      { icon: BarChart3, title: 'Asset Analytics', titleZh: '资产分析', description: 'Breakdown by category, status, department, and age. Cost analysis included.', descriptionZh: '按类别、状态、部门和年龄分析。包含成本分析。' },
      { icon: DollarSign, title: 'Financial Reports', titleZh: '财务报告', description: 'Invoice summaries, revenue trends, outstanding payments, GST reports.', descriptionZh: '发票汇总、收入趋势、未付款项、GST报告。' },
      { icon: Wrench, title: 'Maintenance Metrics', titleZh: '维护指标', description: 'Resolution times, ticket volumes, SLA performance, technician KPIs.', descriptionZh: '解决时间、工单数量、SLA性能、技术人员KPI。' },
    ],
  },
  users: {
    title: 'User Management',
    titleZh: '用户管理',
    description: 'Manage system users, roles, and permissions. Control who can access what.',
    descriptionZh: '管理系统用户、角色和权限。控制访问权限。',
    features: [
      { icon: Plus, title: 'Add User', titleZh: '添加用户', description: 'Create accounts with roles: Admin, Finance Controller, Engineer.', descriptionZh: '创建帐户并分配角色：管理员、财务总监、工程师。', action: 'add' },
      { icon: Shield, title: 'Role-Based Access', titleZh: '基于角色的访问控制', description: 'Each role has specific permissions. Admins manage everything.', descriptionZh: '每个角色有特定权限。管理员管理所有内容。' },
      { icon: Settings, title: 'Profile & Password', titleZh: '个人资料与密码', description: 'Upload photos, change passwords, update personal details.', descriptionZh: '上传照片、更改密码、更新个人信息。' },
    ],
  },
};
