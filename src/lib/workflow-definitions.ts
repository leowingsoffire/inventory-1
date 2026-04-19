import {
  Monitor, Users, Wrench, Shield, FileText, Building2, DollarSign,
  GitBranch, BarChart3, Settings, Bot, Truck, AlertTriangle,
  Plus, Upload, Search, CheckCircle, Clock, Play, Send,
  UserCheck, Clipboard, ShieldCheck, Eye, FileCheck, Receipt,
  CreditCard, RefreshCw, Gauge, Lock, Mail, Archive,
} from 'lucide-react';
import type { WorkflowDefinition } from '@/components/CyberWorkflow';

// Dynamic workflow builder based on real data counts
export function getModuleWorkflows(stats?: {
  assets?: number;
  employees?: number;
  tickets?: number;
  openTickets?: number;
  changeRequests?: number;
  pendingChanges?: number;
  warranties?: number;
  expiringWarranties?: number;
  invoices?: number;
  unpaidInvoices?: number;
  customers?: number;
  vendors?: number;
}): Record<string, WorkflowDefinition> {
  const s = stats || {};

  return {
    assets: {
      id: 'assets',
      title: 'Asset Lifecycle',
      titleZh: '资产生命周期',
      icon: Monitor,
      steps: [
        { id: 'register', label: 'Register', labelZh: '登记', icon: Plus, status: (s.assets ?? 0) > 0 ? 'completed' : 'current', description: 'Add IT assets to inventory' },
        { id: 'assign', label: 'Assign', labelZh: '分配', icon: UserCheck, status: (s.assets ?? 0) > 0 && (s.employees ?? 0) > 0 ? 'completed' : (s.assets ?? 0) > 0 ? 'current' : 'upcoming' },
        { id: 'monitor', label: 'Monitor', labelZh: '监控', icon: Eye, status: (s.assets ?? 0) > 3 ? 'completed' : (s.assets ?? 0) > 0 ? 'current' : 'upcoming' },
        { id: 'maintain', label: 'Maintain', labelZh: '维护', icon: Wrench, status: (s.tickets ?? 0) > 0 ? 'completed' : 'upcoming' },
        { id: 'retire', label: 'Retire', labelZh: '退役', icon: Archive, status: 'upcoming' },
      ],
      aiActions: (s.assets ?? 0) === 0 ? [
        { id: 'a-register', label: 'Register your first asset', labelZh: '注册您的第一个资产', description: 'Add a laptop, server, or any IT equipment to start tracking.', descriptionZh: '添加笔记本、服务器或任何IT设备开始跟踪。', priority: 'high' as const, type: 'approval' as const },
        { id: 'a-import', label: 'Bulk import from spreadsheet', labelZh: '从电子表格批量导入', description: 'Upload a CSV/Excel to import multiple assets at once.', descriptionZh: '上传CSV/Excel批量导入多个资产。', priority: 'medium' as const, type: 'approval' as const },
      ] : (s.employees ?? 0) === 0 ? [
        { id: 'a-add-emp', label: 'Add employees to assign assets', labelZh: '添加员工以分配资产', description: 'Assets need owners. Add employees first, then assign devices.', descriptionZh: '资产需要所有者。先添加员工，然后分配设备。', priority: 'high' as const, type: 'approval' as const },
      ] : [
        { id: 'a-audit', label: 'Run asset audit scan', labelZh: '运行资产审计扫描', description: 'AI will check for unassigned, duplicate, or missing assets.', descriptionZh: 'AI将检查未分配、重复或丢失的资产。', priority: 'low' as const, type: 'auto' as const },
      ],
    },

    maintenance: {
      id: 'maintenance',
      title: 'Ticket Resolution',
      titleZh: '工单解决流程',
      icon: Wrench,
      steps: [
        { id: 'create', label: 'Create', labelZh: '创建', icon: Plus, status: (s.tickets ?? 0) > 0 ? 'completed' : 'current' },
        { id: 'triage', label: 'Triage', labelZh: '分类', icon: Clipboard, status: (s.tickets ?? 0) > 0 ? 'completed' : 'upcoming' },
        { id: 'assign', label: 'Assign', labelZh: '分配', icon: UserCheck, status: (s.openTickets ?? 0) > 0 ? 'current' : (s.tickets ?? 0) > 0 ? 'completed' : 'upcoming' },
        { id: 'resolve', label: 'Resolve', labelZh: '解决', icon: CheckCircle, status: 'upcoming' },
        { id: 'close', label: 'Close', labelZh: '关闭', icon: FileCheck, status: 'upcoming' },
      ],
      aiActions: (s.tickets ?? 0) === 0 ? [
        { id: 'm-create', label: 'Create a support ticket', labelZh: '创建支持工单', description: 'Log your first IT incident or maintenance request.', descriptionZh: '记录您的第一个IT事件或维护请求。', priority: 'medium' as const, type: 'approval' as const },
      ] : (s.openTickets ?? 0) > 0 ? [
        { id: 'm-assign', label: 'Auto-assign open tickets', labelZh: '自动分配未处理工单', description: `${s.openTickets} open ticket(s) need assignment. AI can match to available technicians.`, descriptionZh: `${s.openTickets}个未处理工单需要分配。AI可匹配可用技术人员。`, priority: 'high' as const, type: 'approval' as const },
        { id: 'm-escalate', label: 'Check SLA compliance', labelZh: '检查SLA合规性', description: 'AI will flag tickets approaching SLA breach deadlines.', descriptionZh: 'AI将标记接近SLA违规截止日期的工单。', priority: 'medium' as const, type: 'auto' as const },
      ] : [
        { id: 'm-report', label: 'Generate resolution report', labelZh: '生成解决报告', description: 'All tickets resolved. AI can generate a performance summary.', descriptionZh: '所有工单已解决。AI可生成绩效摘要。', priority: 'low' as const, type: 'auto' as const },
      ],
    },

    changeRequests: {
      id: 'change-requests',
      title: 'Change Management',
      titleZh: '变更管理流程',
      icon: GitBranch,
      steps: [
        { id: 'submit', label: 'Submit', labelZh: '提交', icon: Send, status: (s.changeRequests ?? 0) > 0 ? 'completed' : 'current' },
        { id: 'review', label: 'CAB Review', labelZh: 'CAB审查', icon: Eye, status: (s.pendingChanges ?? 0) > 0 ? 'current' : (s.changeRequests ?? 0) > 0 ? 'completed' : 'upcoming' },
        { id: 'approve', label: 'Approve', labelZh: '批准', icon: ShieldCheck, status: (s.changeRequests ?? 0) > 0 && (s.pendingChanges ?? 0) === 0 ? 'completed' : 'upcoming' },
        { id: 'implement', label: 'Implement', labelZh: '实施', icon: Play, status: 'upcoming' },
        { id: 'close', label: 'Close', labelZh: '关闭', icon: CheckCircle, status: 'upcoming' },
      ],
      aiActions: (s.changeRequests ?? 0) === 0 ? [
        { id: 'c-create', label: 'Submit a change request', labelZh: '提交变更请求', description: 'Document IT changes for CAB review — upgrades, migrations, rollouts.', descriptionZh: '记录IT变更以供CAB审查 — 升级、迁移、部署。', priority: 'medium' as const, type: 'approval' as const },
      ] : (s.pendingChanges ?? 0) > 0 ? [
        { id: 'c-review', label: 'Review pending changes', labelZh: '审核待处理变更', description: `${s.pendingChanges} change(s) awaiting CAB approval. AI prepared risk analysis.`, descriptionZh: `${s.pendingChanges}个变更等待CAB批准。AI已准备风险分析。`, priority: 'high' as const, type: 'approval' as const },
      ] : [
        { id: 'c-audit', label: 'Run change success audit', labelZh: '运行变更成功审计', description: 'AI will analyze implementation success rates and rollback history.', descriptionZh: 'AI将分析实施成功率和回滚历史。', priority: 'low' as const, type: 'auto' as const },
      ],
    },

    warranty: {
      id: 'warranty',
      title: 'Warranty Lifecycle',
      titleZh: '保修生命周期',
      icon: Shield,
      steps: [
        { id: 'register', label: 'Register', labelZh: '登记', icon: Plus, status: (s.warranties ?? 0) > 0 ? 'completed' : 'current' },
        { id: 'monitor', label: 'Monitor', labelZh: '监控', icon: Gauge, status: (s.warranties ?? 0) > 0 ? 'completed' : 'upcoming' },
        { id: 'alert', label: 'Alert', labelZh: '提醒', icon: AlertTriangle, status: (s.expiringWarranties ?? 0) > 0 ? 'current' : 'upcoming' },
        { id: 'renew', label: 'Renew', labelZh: '续期', icon: RefreshCw, status: 'upcoming' },
        { id: 'close', label: 'Archive', labelZh: '归档', icon: Archive, status: 'upcoming' },
      ],
      aiActions: (s.expiringWarranties ?? 0) > 0 ? [
        { id: 'w-alert', label: 'Send warranty expiry alerts', labelZh: '发送保修到期提醒', description: `${s.expiringWarranties} warranty/warranties expiring soon. AI will notify asset owners.`, descriptionZh: `${s.expiringWarranties}个保修即将到期。AI将通知资产所有者。`, priority: 'high' as const, type: 'approval' as const },
        { id: 'w-renew', label: 'Prepare renewal quotes', labelZh: '准备续期报价', description: 'AI will gather renewal costs and prepare comparison quotes.', descriptionZh: 'AI将收集续期成本并准备比较报价。', priority: 'medium' as const, type: 'approval' as const },
      ] : (s.warranties ?? 0) === 0 ? [
        { id: 'w-scan', label: 'Scan assets for warranty data', labelZh: '扫描资产保修数据', description: 'AI will check your assets and extract warranty information.', descriptionZh: 'AI将检查您的资产并提取保修信息。', priority: 'medium' as const, type: 'auto' as const },
      ] : [
        { id: 'w-healthy', label: 'All warranties healthy', labelZh: '所有保修状态正常', description: 'No warranties expiring within 90 days. Next check scheduled.', descriptionZh: '90天内无保修到期。已安排下次检查。', priority: 'low' as const, type: 'auto' as const },
      ],
    },

    finance: {
      id: 'finance',
      title: 'Finance Pipeline',
      titleZh: '财务流程',
      icon: DollarSign,
      steps: [
        { id: 'quote', label: 'Quote', labelZh: '报价', icon: FileText, status: (s.invoices ?? 0) > 0 ? 'completed' : 'current' },
        { id: 'invoice', label: 'Invoice', labelZh: '发票', icon: Receipt, status: (s.invoices ?? 0) > 0 ? 'completed' : 'upcoming' },
        { id: 'send', label: 'Send', labelZh: '发送', icon: Send, status: (s.invoices ?? 0) > 0 ? 'current' : 'upcoming' },
        { id: 'payment', label: 'Payment', labelZh: '付款', icon: CreditCard, status: 'upcoming' },
        { id: 'close', label: 'Complete', labelZh: '完成', icon: CheckCircle, status: 'upcoming' },
      ],
      aiActions: (s.unpaidInvoices ?? 0) > 0 ? [
        { id: 'f-remind', label: 'Send payment reminders', labelZh: '发送付款提醒', description: `${s.unpaidInvoices} unpaid invoice(s). AI will draft reminder emails.`, descriptionZh: `${s.unpaidInvoices}张未付发票。AI将起草催款邮件。`, priority: 'high' as const, type: 'approval' as const },
        { id: 'f-gst', label: 'Generate GST report', labelZh: '生成GST报告', description: 'AI will compile GST summary for IRAS filing.', descriptionZh: 'AI将编制IRAS申报的GST摘要。', priority: 'medium' as const, type: 'auto' as const },
      ] : (s.invoices ?? 0) === 0 ? [
        { id: 'f-create', label: 'Create first invoice', labelZh: '创建第一张发票', description: 'Generate a professional invoice with auto-GST calculation.', descriptionZh: '生成带自动GST计算的专业发票。', priority: 'medium' as const, type: 'approval' as const },
      ] : [
        { id: 'f-summary', label: 'Generate financial summary', labelZh: '生成财务摘要', description: 'AI will compile revenue, expenses, and profit analysis.', descriptionZh: 'AI将编制收入、支出和利润分析。', priority: 'low' as const, type: 'auto' as const },
      ],
    },

    compliance: {
      id: 'compliance',
      title: 'Compliance Framework',
      titleZh: '合规框架',
      icon: Lock,
      steps: [
        { id: 'identify', label: 'Identify', labelZh: '识别', icon: Search, status: 'completed' },
        { id: 'assess', label: 'Assess', labelZh: '评估', icon: Clipboard, status: 'current' },
        { id: 'implement', label: 'Implement', labelZh: '实施', icon: Play, status: 'upcoming' },
        { id: 'audit', label: 'Audit', labelZh: '审计', icon: Eye, status: 'upcoming' },
        { id: 'certify', label: 'Certify', labelZh: '认证', icon: ShieldCheck, status: 'upcoming' },
      ],
      aiActions: [
        { id: 'cp-pdpa', label: 'PDPA compliance check', labelZh: 'PDPA合规检查', description: 'AI will scan for personal data handling gaps per Singapore PDPA.', descriptionZh: 'AI将扫描新加坡PDPA个人数据处理差距。', priority: 'high' as const, type: 'auto' as const },
        { id: 'cp-nist', label: 'NIST framework assessment', labelZh: 'NIST框架评估', description: 'Run automated NIST CSF controls assessment on your environment.', descriptionZh: '对您的环境运行自动NIST CSF控制评估。', priority: 'medium' as const, type: 'approval' as const },
      ],
    },

    customers: {
      id: 'customers',
      title: 'Customer Onboarding',
      titleZh: '客户入驻流程',
      icon: Building2,
      steps: [
        { id: 'add', label: 'Register', labelZh: '注册', icon: Plus, status: (s.customers ?? 0) > 0 ? 'completed' : 'current' },
        { id: 'verify', label: 'Verify', labelZh: '验证', icon: ShieldCheck, status: (s.customers ?? 0) > 0 ? 'current' : 'upcoming' },
        { id: 'contract', label: 'Contract', labelZh: '合同', icon: FileText, status: 'upcoming' },
        { id: 'active', label: 'Active', labelZh: '激活', icon: CheckCircle, status: 'upcoming' },
      ],
      aiActions: (s.customers ?? 0) === 0 ? [
        { id: 'cu-add', label: 'Add your first customer', labelZh: '添加您的第一个客户', description: 'Register customer with UEN/BRN, contact details, and contracts.', descriptionZh: '使用UEN/BRN、联系方式和合同注册客户。', priority: 'medium' as const, type: 'approval' as const },
      ] : [
        { id: 'cu-review', label: 'Review customer health', labelZh: '审查客户健康度', description: 'AI will analyze contract status, payment history, and engagement.', descriptionZh: 'AI将分析合同状态、付款历史和互动情况。', priority: 'low' as const, type: 'auto' as const },
      ],
    },

    vendors: {
      id: 'vendors',
      title: 'Vendor Management',
      titleZh: '供应商管理',
      icon: Truck,
      steps: [
        { id: 'add', label: 'Register', labelZh: '注册', icon: Plus, status: (s.vendors ?? 0) > 0 ? 'completed' : 'current' },
        { id: 'evaluate', label: 'Evaluate', labelZh: '评估', icon: BarChart3, status: (s.vendors ?? 0) > 0 ? 'current' : 'upcoming' },
        { id: 'contract', label: 'Contract', labelZh: '合同', icon: FileText, status: 'upcoming' },
        { id: 'monitor', label: 'Monitor', labelZh: '监控', icon: Eye, status: 'upcoming' },
      ],
      aiActions: (s.vendors ?? 0) === 0 ? [
        { id: 'v-add', label: 'Add vendor/supplier', labelZh: '添加供应商', description: 'Register your IT vendors — Dell, HP, Cisco, etc.', descriptionZh: '注册您的IT供应商 — Dell、HP、Cisco等。', priority: 'medium' as const, type: 'approval' as const },
      ] : [
        { id: 'v-perf', label: 'Vendor performance review', labelZh: '供应商绩效评审', description: 'AI will score vendors on delivery, quality, and pricing.', descriptionZh: 'AI将从交付、质量和定价方面评分供应商。', priority: 'low' as const, type: 'auto' as const },
      ],
    },
  };
}
