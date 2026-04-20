'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Sparkles, Plus, Upload, MousePointerClick, X,
  Monitor, Users, Wrench, Shield, FileText, Building2,
  DollarSign, GitBranch, BarChart3, Settings, Bot,
  Truck, HelpCircle, Lightbulb, ChevronRight,
  Phone, Calendar, Mail, Lock, Globe, Star, Headphones,
  CheckCircle, AlertTriangle, Clock,
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
  customers: {
    title: 'Customer Management',
    titleZh: '客户管理',
    description: 'Build and manage your customer database. Track contracts, billing, and CRM activities in one place.',
    descriptionZh: '建立和管理客户数据库。在一个地方跟踪合同、账单和CRM活动。',
    features: [
      { icon: Plus, title: 'Step 1: Add Customer', titleZh: '步骤1：添加客户', description: 'Click "+ Add Customer" and fill in company name, UEN (Singapore Business Number), and contact details. The system auto-detects Singapore companies.', descriptionZh: '点击"+ 添加客户"，填写公司名称、UEN（新加坡商业注册号）和联系方式。系统自动检测新加坡公司。', action: 'add', actionZh: '立即添加' },
      { icon: FileText, title: 'Step 2: Set Contract', titleZh: '步骤2：设置合同', description: 'Choose contract type: Retainer (monthly), Project (one-time), or Ad-Hoc. Set start/end dates and value. This links to invoicing.', descriptionZh: '选择合同类型：月费、项目或临时。设置起止日期和金额。这与发票关联。' },
      { icon: DollarSign, title: 'Step 3: Create Invoices', titleZh: '步骤3：创建发票', description: 'Once a customer is added, go to Finance to create invoices for them. GST is auto-calculated at 9% for GST-registered customers.', descriptionZh: '添加客户后，前往财务模块为其创建发票。GST注册客户自动按9%计算GST。', action: 'navigate:/finance', actionZh: '前往财务' },
    ],
  },
  vendors: {
    title: 'Vendor & Supplier Management',
    titleZh: '供应商管理',
    description: 'Track your IT vendors, suppliers, and service providers. Compare ratings and manage procurement.',
    descriptionZh: '跟踪IT供应商和服务提供商。比较评分并管理采购。',
    features: [
      { icon: Plus, title: 'Step 1: Add Vendor', titleZh: '步骤1：添加供应商', description: 'Click "+ Add Vendor" and enter company name. The system auto-detects the category (Hardware, Software, Services, Telecom) from the name.', descriptionZh: '点击"+ 添加供应商"，输入公司名称。系统根据名称自动检测类别（硬件、软件、服务、电信）。', action: 'add', actionZh: '立即添加' },
      { icon: Star, title: 'Step 2: Rate Vendors', titleZh: '步骤2：供应商评分', description: 'Rate each vendor 1-5 stars based on service quality, delivery time, and pricing. This helps future procurement decisions.', descriptionZh: '基于服务质量、交付时间和价格对每个供应商进行1-5星评分。这有助于未来采购决策。' },
      { icon: Globe, title: 'Step 3: Track Details', titleZh: '步骤3：跟踪详情', description: 'Record UEN, GST registration, payment terms (default 30 days), website, and notes for each vendor.', descriptionZh: '记录UEN、GST注册、付款条件（默认30天）、网站和每个供应商的备注。' },
    ],
  },
  crm: {
    title: 'CRM Activity Tracking',
    titleZh: 'CRM活动跟踪',
    description: 'Log every customer interaction — calls, emails, meetings, site visits. Never lose track of a follow-up.',
    descriptionZh: '记录每次客户互动 — 电话、邮件、会议、现场访问。不再遗漏任何跟进。',
    features: [
      { icon: Plus, title: 'Step 1: Log Activity', titleZh: '步骤1：记录活动', description: 'Click "+ New Activity" → select a Customer → choose type: Call, Email, Meeting, Site Visit, Follow-up, or Support. Add title and notes.', descriptionZh: '点击"+ 新活动" → 选择客户 → 选择类型：电话、邮件、会议、现场访问、跟进或支持。添加标题和备注。', action: 'add', actionZh: '立即记录' },
      { icon: Calendar, title: 'Step 2: Schedule & Follow-up', titleZh: '步骤2：安排与跟进', description: 'Set scheduled date for future activities. After completion, set a follow-up date so nothing falls through the cracks.', descriptionZh: '为未来的活动设置计划日期。完成后设置跟进日期，确保不遗漏任何事项。' },
      { icon: CheckCircle, title: 'Step 3: Track Status', titleZh: '步骤3：跟踪状态', description: 'Activities flow: Scheduled → Completed or Cancelled. The AI assistant suggests next actions based on activity history.', descriptionZh: '活动流程：已计划 → 已完成或已取消。AI助手根据活动历史建议下一步操作。' },
    ],
  },
  finance: {
    title: 'Finance & Invoicing',
    titleZh: '财务与发票',
    description: 'Create professional invoices, quotations, and credit notes. GST auto-calculated for Singapore businesses.',
    descriptionZh: '创建专业发票、报价单和贷记通知单。新加坡企业GST自动计算。',
    features: [
      { icon: Plus, title: 'Step 1: Create Invoice', titleZh: '步骤1：创建发票', description: 'Click "+ New Invoice" → select Customer → choose type (Invoice, Quotation, or Credit Note) → add line items with quantity and unit price. GST is auto-calculated at 9%.', descriptionZh: '点击"+ 新发票" → 选择客户 → 选择类型（发票、报价单或贷记通知单） → 添加行项目（数量和单价）。GST按9%自动计算。', action: 'add', actionZh: '立即创建' },
      { icon: Clock, title: 'Step 2: Send & Track', titleZh: '步骤2：发送与跟踪', description: 'Invoice status flow: Draft → Sent → Paid or Overdue. Mark payment received with method (Bank Transfer, PayNow, Cash, etc).', descriptionZh: '发票状态流程：草稿 → 已发送 → 已支付或逾期。标记付款时选择方式（银行转账、PayNow、现金等）。' },
      { icon: DollarSign, title: 'Step 3: Review Financials', titleZh: '步骤3：审查财务', description: 'Dashboard shows total revenue, outstanding amount, overdue invoices, and GST collected. Filter by date range or customer.', descriptionZh: '仪表盘显示总收入、未付金额、逾期发票和已收GST。按日期范围或客户筛选。' },
    ],
  },
  changeRequests: {
    title: 'Change Request Management',
    titleZh: '变更请求管理',
    description: 'Plan, approve, and implement IT changes safely following ITIL best practices.',
    descriptionZh: '遵循ITIL最佳实践，安全地规划、审批和实施IT变更。',
    features: [
      { icon: Plus, title: 'Step 1: Submit Request', titleZh: '步骤1：提交请求', description: 'Click "+ New Change" → describe what you want to change → set type (Normal, Standard, Emergency) → set priority and risk level. Add implementation and backout plans.', descriptionZh: '点击"+ 新变更" → 描述变更内容 → 设置类型（普通、标准、紧急） → 设置优先级和风险等级。添加实施和回退计划。', action: 'add', actionZh: '立即提交' },
      { icon: CheckCircle, title: 'Step 2: Approval Workflow', titleZh: '步骤2：审批流程', description: 'Request approval from CAB (Change Advisory Board). Status: Not Requested → Requested → Approved/Rejected. Emergency changes can be fast-tracked.', descriptionZh: '向CAB（变更顾问委员会）申请审批。状态：未申请 → 已申请 → 已批准/已拒绝。紧急变更可加急处理。' },
      { icon: GitBranch, title: 'Step 3: Implement & Close', titleZh: '步骤3：实施与关闭', description: 'After approval, plan schedule → implement → test → review → close. Set closure code: Successful, Unsuccessful, or Incomplete.', descriptionZh: '审批后，计划时间 → 实施 → 测试 → 审查 → 关闭。设置关闭代码：成功、不成功或不完整。' },
    ],
  },
  compliance: {
    title: 'PDPA Compliance Manager',
    titleZh: 'PDPA合规管理',
    description: 'Track your organization\'s compliance with Singapore\'s Personal Data Protection Act (PDPA).',
    descriptionZh: '跟踪组织的新加坡个人数据保护法（PDPA）合规状况。',
    features: [
      { icon: Shield, title: 'Step 1: Review Controls', titleZh: '步骤1：审查控制项', description: 'Browse PDPA controls organized by category: Governance, Collection, Use, Disclosure, Access, Protection, Retention, Transfer, and Breach. Each control has a reference code and description.', descriptionZh: '按类别浏览PDPA控制项：治理、收集、使用、披露、访问、保护、保留、转移和泄露。每个控制项有参考编号和描述。' },
      { icon: CheckCircle, title: 'Step 2: Assess Status', titleZh: '步骤2：评估状态', description: 'For each control, set status: Not Started → In Progress → Compliant/Non-Compliant/Partial. Assign responsible person, document evidence, and set risk level.', descriptionZh: '为每个控制项设置状态：未开始 → 进行中 → 合规/不合规/部分合规。指定负责人、记录证据、设置风险级别。' },
      { icon: Calendar, title: 'Step 3: Schedule Reviews', titleZh: '步骤3：安排审查', description: 'Set review dates for each control. Track compliance progress with the visual dashboard showing % compliant, at-risk items, and overdue reviews.', descriptionZh: '为每个控制项设置审查日期。通过可视化仪表盘跟踪合规进度，显示合规百分比、高风险项目和逾期审查。' },
    ],
  },
  serviceDesk: {
    title: 'IT Service Desk',
    titleZh: 'IT服务台',
    description: 'Your central hub for IT service management — incidents, changes, assets, and knowledge all in one place.',
    descriptionZh: '您的IT服务管理中心 — 事件、变更、资产和知识库集于一处。',
    features: [
      { icon: AlertTriangle, title: 'Report an Incident', titleZh: '报告事件', description: 'Something broken? Go to Maintenance → "+ New Ticket" → describe the issue → set priority. A technician will be assigned automatically.', descriptionZh: '出了问题？前往维护 → "+ 新工单" → 描述问题 → 设置优先级。技术人员将自动分配。', action: 'navigate:/maintenance?action=add', actionZh: '创建工单' },
      { icon: GitBranch, title: 'Request a Change', titleZh: '申请变更', description: 'Need to upgrade software or modify infrastructure? Submit a Change Request for CAB approval before implementation.', descriptionZh: '需要升级软件或修改基础设施？在实施前提交变更请求以获得CAB审批。', action: 'navigate:/change-requests?action=add', actionZh: '提交变更' },
      { icon: Monitor, title: 'Check Your Assets', titleZh: '查看资产', description: 'View all IT assets assigned to you — laptops, phones, monitors. Check warranty status and maintenance history.', descriptionZh: '查看分配给您的所有IT资产 — 笔记本、手机、显示器。检查保修状态和维护历史。', action: 'navigate:/assets', actionZh: '查看资产' },
    ],
  },
  aiAssistant: {
    title: 'AI Assistant — Uni',
    titleZh: 'AI助手 — Uni',
    description: 'Chat with Uni AI to get insights from your data. Ask about assets, tickets, finances, compliance, and more.',
    descriptionZh: '与Uni AI对话获取数据洞察。询问资产、工单、财务、合规等信息。',
    features: [
      { icon: Bot, title: 'Step 1: Start Chatting', titleZh: '步骤1：开始对话', description: 'Type your question in natural language. Examples: "How many laptops do we have?", "What invoices are overdue?", "Show warranty expiring this month".', descriptionZh: '用自然语言输入问题。例如："我们有多少台笔记本？"、"哪些发票逾期了？"、"显示本月到期的保修"。' },
      { icon: Upload, title: 'Step 2: Upload Documents', titleZh: '步骤2：上传文档', description: 'Go to "Documents" tab → upload PDF, Word, Excel, or text files. The AI extracts text and uses it to answer questions and generate guides.', descriptionZh: '前往"文档"选项卡 → 上传PDF、Word、Excel或文本文件。AI提取文本并用于回答问题和生成指南。' },
      { icon: FileText, title: 'Step 3: Auto-Generate Guides', titleZh: '步骤3：自动生成指南', description: 'After uploading, click "Generate Guide" to create user manuals automatically from your documents. Edit and version them.', descriptionZh: '上传后，点击"生成指南"从文档自动创建用户手册。可编辑和版本管理。' },
    ],
  },
};
