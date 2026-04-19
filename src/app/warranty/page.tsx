'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Clock, Mail, Send, CheckCircle, XCircle,
  Bell, Calendar, ChevronDown, RefreshCw, Settings, Eye, X,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

type AlertStatus = 'pending' | 'sent' | 'acknowledged' | 'escalated' | 'expired';

interface WarrantyAsset {
  id: string;
  assetTag: string;
  name: string;
  brand: string;
  warrantyEnd: string;
  customerEmail: string;
  customerName: string;
  assignedTo: string;
  daysLeft: number;
}

interface AlertRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  alertType: '60_day' | '30_day' | '7_day' | 'overdue';
  status: AlertStatus;
  recipientEmail: string;
  ccEmails: string;
  sentAt: string | null;
  attempts: number;
  maxAttempts: number;
  nextAttempt: string | null;
  subject: string;
}

const sampleWarrantyAssets: WarrantyAsset[] = [
  { id: '5', assetTag: 'UT-PR-001', name: 'HP LaserJet Pro M404dn', brand: 'HP', warrantyEnd: '2025-05-15', customerEmail: 'customer1@example.com', customerName: 'ABC Corp Pte Ltd', assignedTo: 'Shared', daysLeft: 12 },
  { id: '7', assetTag: 'UT-PH-001', name: 'iPhone 15 Pro', brand: 'Apple', warrantyEnd: '2025-10-01', customerEmail: 'mike@clientco.sg', customerName: 'Mike Wong', assignedTo: 'Mike Wong', daysLeft: 151 },
  { id: '4', assetTag: 'UT-SV-001', name: 'Dell PowerEdge R740', brand: 'Dell', warrantyEnd: '2026-08-01', customerEmail: 'it@bigclient.sg', customerName: 'Big Client Pte Ltd', assignedTo: 'IT Department', daysLeft: 456 },
  { id: '8', assetTag: 'UT-NW-001', name: 'Cisco Catalyst 9200', brand: 'Cisco', warrantyEnd: '2026-11-01', customerEmail: 'infra@techfirm.sg', customerName: 'Tech Firm Pte Ltd', assignedTo: 'IT Department', daysLeft: 548 },
  { id: '1', assetTag: 'UT-LT-001', name: 'MacBook Pro 16"', brand: 'Apple', warrantyEnd: '2027-06-15', customerEmail: 'john@company.sg', customerName: 'John Tan', assignedTo: 'John Tan', daysLeft: 774 },
];

const sampleAlerts: AlertRecord[] = [
  { id: 'a1', assetId: '5', assetTag: 'UT-PR-001', assetName: 'HP LaserJet Pro M404dn', alertType: '7_day', status: 'sent', recipientEmail: 'customer1@example.com', ccEmails: 'admin@unitech.sg', sentAt: '2025-05-03', attempts: 2, maxAttempts: 5, nextAttempt: '2025-05-06', subject: 'Warranty Expiring in 7 Days - HP LaserJet Pro M404dn' },
  { id: 'a2', assetId: '5', assetTag: 'UT-PR-001', assetName: 'HP LaserJet Pro M404dn', alertType: '30_day', status: 'sent', recipientEmail: 'customer1@example.com', ccEmails: '', sentAt: '2025-04-15', attempts: 1, maxAttempts: 5, nextAttempt: null, subject: 'Warranty Expiring in 30 Days - HP LaserJet Pro M404dn' },
  { id: 'a3', assetId: '5', assetTag: 'UT-PR-001', assetName: 'HP LaserJet Pro M404dn', alertType: '60_day', status: 'acknowledged', recipientEmail: 'customer1@example.com', ccEmails: '', sentAt: '2025-03-16', attempts: 1, maxAttempts: 5, nextAttempt: null, subject: 'Warranty Expiring in 60 Days - HP LaserJet Pro M404dn' },
  { id: 'a4', assetId: '7', assetTag: 'UT-PH-001', assetName: 'iPhone 15 Pro', alertType: '60_day', status: 'pending', recipientEmail: 'mike@clientco.sg', ccEmails: '', sentAt: null, attempts: 0, maxAttempts: 5, nextAttempt: '2025-08-02', subject: 'Warranty Reminder - iPhone 15 Pro (60 Days)' },
];

const alertTypeLabels: Record<string, Record<string, string>> = {
  '60_day': { en: '60-Day Warning', zh: '60天预警' },
  '30_day': { en: '30-Day Warning', zh: '30天预警' },
  '7_day': { en: '7-Day Critical', zh: '7天紧急' },
  'overdue': { en: 'Overdue', zh: '已过期' },
};

const statusColors: Record<AlertStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  sent: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  acknowledged: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  escalated: 'bg-red-500/20 text-red-300 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const statusLabels: Record<AlertStatus, Record<string, string>> = {
  pending: { en: 'Pending', zh: '待发送' },
  sent: { en: 'Sent', zh: '已发送' },
  acknowledged: { en: 'Acknowledged', zh: '已确认' },
  escalated: { en: 'Escalated', zh: '已升级' },
  expired: { en: 'Expired', zh: '已过期' },
};

// Email config for settings panel
interface WarrantyConfig {
  smtpHost: string;
  smtpPort: number;
  senderEmail: string;
  adminCcEmail: string;
  maxAttempts: number;
  alertDays: number[];
  escalateAfterAttempts: number;
}

const defaultConfig: WarrantyConfig = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  senderEmail: 'alerts@unitech.sg',
  adminCcEmail: 'admin@unitech.sg',
  maxAttempts: 5,
  alertDays: [60, 30, 7],
  escalateAfterAttempts: 3,
};

export default function WarrantyPage() {
  const { lang } = useApp();
  const [tab, setTab] = useState<'monitor' | 'alerts' | 'config'>('monitor');
  const [alerts, setAlerts] = useState<AlertRecord[]>(sampleAlerts);
  const [config, setConfig] = useState<WarrantyConfig>(defaultConfig);
  const [showCompose, setShowCompose] = useState<WarrantyAsset | null>(null);
  const [configSaved, setConfigSaved] = useState(false);

  const urgentAssets = useMemo(() =>
    sampleWarrantyAssets.filter(a => a.daysLeft <= 60).sort((a, b) => a.daysLeft - b.daysLeft),
  []);

  const handleSendAlert = (asset: WarrantyAsset, alertType: string) => {
    const newAlert: AlertRecord = {
      id: String(Date.now()),
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      alertType: alertType as AlertRecord['alertType'],
      status: 'sent',
      recipientEmail: asset.customerEmail,
      ccEmails: alertType === '7_day' ? config.adminCcEmail : '',
      sentAt: new Date().toISOString().split('T')[0],
      attempts: 1,
      maxAttempts: config.maxAttempts,
      nextAttempt: null,
      subject: `Warranty ${alertType === '7_day' ? 'Expiring Soon' : 'Reminder'} - ${asset.name}`,
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleSaveConfig = () => {
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const tabs = [
    { key: 'monitor', label: lang === 'en' ? 'Warranty Monitor' : '保修监控', icon: Shield },
    { key: 'alerts', label: lang === 'en' ? 'Alert History' : '预警历史', icon: Bell },
    { key: 'config', label: lang === 'en' ? 'Email Settings' : '邮件设置', icon: Settings },
  ];

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-amber-400" />
            {lang === 'en' ? 'Warranty Monitoring' : '保修监控'}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {lang === 'en' ? 'Track warranty expiry and send automated email alerts to customers' : '跟踪保修到期并自动向客户发送邮件提醒'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: lang === 'en' ? 'Expiring < 7 Days' : '7天内到期', count: sampleWarrantyAssets.filter(a => a.daysLeft <= 7).length, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: lang === 'en' ? 'Expiring < 30 Days' : '30天内到期', count: sampleWarrantyAssets.filter(a => a.daysLeft <= 30 && a.daysLeft > 7).length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: lang === 'en' ? 'Expiring < 60 Days' : '60天内到期', count: sampleWarrantyAssets.filter(a => a.daysLeft <= 60 && a.daysLeft > 30).length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: lang === 'en' ? 'Alerts Sent' : '已发送提醒', count: alerts.filter(a => a.status === 'sent').length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          ].map((card, i) => (
            <motion.div key={i} className={`glass-card p-4 ${card.bg}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <p className="text-white/40 text-xs">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.count}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === key ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'monitor' && (
          <div className="space-y-4">
            {/* Urgent section */}
            {urgentAssets.length > 0 && (
              <div className="glass-card p-4 border border-red-500/20">
                <h3 className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {lang === 'en' ? 'Requires Immediate Attention' : '需要立即注意'}
                </h3>
                <div className="space-y-2">
                  {urgentAssets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                          asset.daysLeft <= 7 ? 'bg-red-500/20 text-red-300' : asset.daysLeft <= 30 ? 'bg-amber-500/20 text-amber-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {asset.daysLeft}d
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{asset.name}</p>
                          <p className="text-white/40 text-xs">{asset.assetTag} &middot; {asset.brand} &middot; {lang === 'en' ? 'Expires' : '到期'}: {asset.warrantyEnd}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-xs">{asset.customerEmail}</span>
                        <motion.button
                          onClick={() => setShowCompose(asset)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-medium transition-all"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Send className="w-3 h-3" />
                          {lang === 'en' ? 'Send Alert' : '发送提醒'}
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All assets by warranty */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">{lang === 'en' ? 'All Assets by Warranty Expiry' : '按保修到期排序的所有资产'}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Asset' : '资产'}</th>
                    <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Customer' : '客户'}</th>
                    <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Warranty End' : '保修到期'}</th>
                    <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Days Left' : '剩余天数'}</th>
                    <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Status' : '状态'}</th>
                    <th className="text-right py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Actions' : '操作'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleWarrantyAssets.map(asset => {
                    const urgency = asset.daysLeft <= 7 ? 'critical' : asset.daysLeft <= 30 ? 'warning' : asset.daysLeft <= 60 ? 'caution' : 'safe';
                    const urgencyColors = {
                      critical: 'text-red-400',
                      warning: 'text-amber-400',
                      caution: 'text-yellow-400',
                      safe: 'text-emerald-400',
                    };
                    const urgencyBg = {
                      critical: 'bg-red-500/20 border-red-500/30',
                      warning: 'bg-amber-500/20 border-amber-500/30',
                      caution: 'bg-yellow-500/20 border-yellow-500/30',
                      safe: 'bg-emerald-500/20 border-emerald-500/30',
                    };
                    return (
                      <tr key={asset.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-white text-sm">{asset.name}</p>
                          <p className="text-white/40 text-xs">{asset.assetTag}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white/70 text-sm">{asset.customerName}</p>
                          <p className="text-white/30 text-xs">{asset.customerEmail}</p>
                        </td>
                        <td className="py-3 px-4 text-white/70 text-sm">{asset.warrantyEnd}</td>
                        <td className="py-3 px-4">
                          <span className={`font-bold text-sm ${urgencyColors[urgency]}`}>{asset.daysLeft}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${urgencyBg[urgency]}`}>
                            {urgency === 'critical' ? (lang === 'en' ? 'Critical' : '紧急') :
                             urgency === 'warning' ? (lang === 'en' ? 'Warning' : '警告') :
                             urgency === 'caution' ? (lang === 'en' ? 'Caution' : '注意') :
                             (lang === 'en' ? 'Safe' : '安全')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setShowCompose(asset)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-blue-300 transition-all"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'alerts' && (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">{lang === 'en' ? 'Alert History & Escalation Tracker' : '预警历史与升级跟踪'}</h3>
              <button className="text-white/40 hover:text-white/60 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Asset' : '资产'}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Alert Type' : '预警类型'}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Recipient' : '收件人'}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Status' : '状态'}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Attempts' : '尝试次数'}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Sent' : '发送时间'}</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => (
                  <tr key={alert.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-white text-sm">{alert.assetName}</p>
                      <p className="text-white/40 text-xs">{alert.assetTag}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
                        alert.alertType === '7_day' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        alert.alertType === '30_day' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {alertTypeLabels[alert.alertType]?.[lang]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white/70 text-xs">{alert.recipientEmail}</p>
                      {alert.ccEmails && <p className="text-white/30 text-[10px]">CC: {alert.ccEmails}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${statusColors[alert.status]}`}>
                        {statusLabels[alert.status]?.[lang]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-white/70 text-sm">{alert.attempts}/{alert.maxAttempts}</span>
                        {alert.attempts >= config.escalateAfterAttempts && alert.status !== 'acknowledged' && (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/50 text-xs">{alert.sentAt || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'config' && (
          <div className="glass-card p-6 max-w-2xl">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-white/60" />
              {lang === 'en' ? 'Warranty Alert Email Configuration' : '保修预警邮件配置'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs mb-1.5">{lang === 'en' ? 'SMTP Host' : 'SMTP 主机'}</label>
                <input value={config.smtpHost} onChange={e => setConfig(p => ({ ...p, smtpHost: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">{lang === 'en' ? 'SMTP Port' : 'SMTP 端口'}</label>
                <input type="number" value={config.smtpPort} onChange={e => setConfig(p => ({ ...p, smtpPort: Number(e.target.value) }))} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">{lang === 'en' ? 'Sender Email' : '发送邮箱'}</label>
                <input value={config.senderEmail} onChange={e => setConfig(p => ({ ...p, senderEmail: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">{lang === 'en' ? 'Admin CC Email' : '管理员抄送邮箱'}</label>
                <input value={config.adminCcEmail} onChange={e => setConfig(p => ({ ...p, adminCcEmail: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">{lang === 'en' ? 'Max Reminder Attempts' : '最大提醒次数'}</label>
                <input type="number" value={config.maxAttempts} onChange={e => setConfig(p => ({ ...p, maxAttempts: Number(e.target.value) }))} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">{lang === 'en' ? 'Escalate After Attempts' : '升级阈值（次数）'}</label>
                <input type="number" value={config.escalateAfterAttempts} onChange={e => setConfig(p => ({ ...p, escalateAfterAttempts: Number(e.target.value) }))} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-white/60 text-xs mb-1.5">{lang === 'en' ? 'Alert Days (comma-separated)' : '预警天数（逗号分隔）'}</label>
                <input value={config.alertDays.join(', ')} onChange={e => setConfig(p => ({ ...p, alertDays: e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) }))} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-white/5">
              <p className="text-white/40 text-xs leading-relaxed">
                {lang === 'en'
                  ? '💡 AI Escalation Logic: After the initial alert, if the customer does not respond, the system will automatically send up to 5 follow-up reminders with an escalating tone. After 3 unanswered attempts, IT Admin will be added in CC. The writing tone progresses from friendly reminder → gentle follow-up → urgent notice → final warning → escalation to management.'
                  : '💡 AI 升级逻辑：初始提醒后，若客户未回复，系统将自动发送最多5次后续提醒，语气逐步升级。3次未答复后，IT管理员将被加入抄送。语气从友好提醒 → 温和跟进 → 紧急通知 → 最终警告 → 升级至管理层。'}
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <motion.button
                onClick={handleSaveConfig}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {configSaved ? (
                    <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> {lang === 'en' ? 'Saved!' : '已保存！'}
                    </motion.span>
                  ) : (
                    <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> {lang === 'en' ? 'Save Configuration' : '保存配置'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        )}

        {/* Compose Alert Modal */}
        <AnimatePresence>
          {showCompose && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="glass-card p-6 w-full max-w-lg"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    {lang === 'en' ? 'Send Warranty Alert' : '发送保修提醒'}
                  </h3>
                  <button onClick={() => setShowCompose(null)} className="text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white/40 text-xs">{lang === 'en' ? 'Asset' : '资产'}</p>
                    <p className="text-white text-sm">{showCompose.name} ({showCompose.assetTag})</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white/40 text-xs">{lang === 'en' ? 'Warranty End' : '保修到期'}</p>
                    <p className="text-white text-sm">{showCompose.warrantyEnd} ({showCompose.daysLeft} {lang === 'en' ? 'days left' : '天剩余'})</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white/40 text-xs">{lang === 'en' ? 'Recipient' : '收件人'}</p>
                    <p className="text-white text-sm">{showCompose.customerName} &lt;{showCompose.customerEmail}&gt;</p>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">{lang === 'en' ? 'Alert Type' : '预警类型'}</label>
                    <select className="glass-input w-full px-3 py-2 text-sm" id="alert-type-select">
                      <option value="60_day" className="bg-gray-900">{alertTypeLabels['60_day'][lang]}</option>
                      <option value="30_day" className="bg-gray-900">{alertTypeLabels['30_day'][lang]}</option>
                      <option value="7_day" className="bg-gray-900">{alertTypeLabels['7_day'][lang]}</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                    <p className="text-blue-300 text-xs font-medium mb-1">
                      {lang === 'en' ? '🤖 AI-Generated Email Preview' : '🤖 AI 生成邮件预览'}
                    </p>
                    <p className="text-white/60 text-xs leading-relaxed">
                      {lang === 'en'
                        ? `Dear ${showCompose.customerName},\n\nWe hope this message finds you well. This is a friendly reminder that the warranty for your ${showCompose.name} (${showCompose.assetTag}) is set to expire on ${showCompose.warrantyEnd}.\n\nWe recommend reaching out to discuss renewal options to ensure continued coverage and support.\n\nBest regards,\nUnitech IT Solutions`
                        : `尊敬的${showCompose.customerName}，\n\n您好！我们在此温馨提醒您，您的${showCompose.name}（${showCompose.assetTag}）的保修将于${showCompose.warrantyEnd}到期。\n\n建议您联系我们讨论续保方案，以确保持续的保障和支持。\n\n此致，\nUnitech IT Solutions`}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => setShowCompose(null)} className="glass-button px-4 py-2 text-sm">
                    {lang === 'en' ? 'Cancel' : '取消'}
                  </button>
                  <motion.button
                    onClick={() => {
                      const select = document.getElementById('alert-type-select') as HTMLSelectElement;
                      handleSendAlert(showCompose, select?.value || '60_day');
                      setShowCompose(null);
                    }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="w-4 h-4" />
                    {lang === 'en' ? 'Send Alert' : '发送提醒'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}
