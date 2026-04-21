'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useApp } from '@/lib/context';

const routeNames: Record<string, { en: string; zh: string }> = {
  dashboard: { en: 'Dashboard', zh: '仪表盘' },
  assets: { en: 'Assets', zh: '资产' },
  employees: { en: 'Employees', zh: '员工' },
  maintenance: { en: 'Maintenance', zh: '维护' },
  warranty: { en: 'Warranty', zh: '保修' },
  users: { en: 'Users & Roles', zh: '用户权限' },
  reports: { en: 'Reports', zh: '报告' },
  activity: { en: 'Activity Log', zh: '活动日志' },
  settings: { en: 'Settings', zh: '设置' },
  customers: { en: 'Customers', zh: '客户' },
  vendors: { en: 'Vendors', zh: '供应商' },
  crm: { en: 'CRM', zh: '客户关系' },
  finance: { en: 'Finance', zh: '财务' },
  'service-desk': { en: 'Service Desk', zh: '服务台' },
  'change-requests': { en: 'Change Requests', zh: '变更请求' },
  compliance: { en: 'PDPA Compliance', zh: 'PDPA合规' },
  'knowledge-base': { en: 'Knowledge Base', zh: '知识库' },
  'scheduled-tasks': { en: 'Scheduled Tasks', zh: '计划任务' },
  contracts: { en: 'Contracts', zh: '合同' },
  approvals: { en: 'Approvals', zh: '审批' },
  audit: { en: 'Audit Trail', zh: '审计' },
  communications: { en: 'Communications', zh: '通讯' },
  forms: { en: 'Custom Forms', zh: '表单' },
  locations: { en: 'Locations', zh: '位置' },
  automation: { en: 'Automation', zh: '自动化' },
  'ai-assistant': { en: 'AI Assistant', zh: 'AI助手' },
  help: { en: 'Help Center', zh: '帮助中心' },
  profile: { en: 'Profile', zh: '个人资料' },
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { lang } = useApp();

  if (pathname === '/dashboard') return null;

  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-xs text-white/40 mb-4 px-1">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-white/70 transition-colors">
        <Home className="w-3 h-3" />
        <span>{lang === 'en' ? 'Dashboard' : '仪表盘'}</span>
      </Link>
      {segments.map((seg, i) => {
        const route = routeNames[seg];
        const href = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        const label = route ? route[lang] : seg.charAt(0).toUpperCase() + seg.slice(1);
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-white/20" />
            {isLast ? (
              <span className="text-white/70 font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-white/70 transition-colors">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
