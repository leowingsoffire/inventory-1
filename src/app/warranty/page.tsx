'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Clock, Mail, Send, CheckCircle, XCircle,
  Bell, Calendar, ChevronDown, RefreshCw, Settings, Eye, X,
  Plus, Edit3, Trash2, Search, FileText, Package, Filter,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { FeatureGuide, MODULE_GUIDES } from '@/components/FeatureGuide';

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

interface WarrantyRegistration {
  id: string;
  itemName: string;
  serialNumber: string | null;
  category: string;
  brand: string | null;
  modelName: string | null;
  purchaseDate: string | null;
  warrantyStart: string;
  warrantyEnd: string;
  warrantyMonths: number | null;
  warrantyType: string;
  provider: string | null;
  coverageDetails: string | null;
  claimProcess: string | null;
  receiptRef: string | null;
  cost: number | null;
  status: string;
  notes: string | null;
  assetId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  vendorName: string | null;
  registeredBy: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  itemName: '', serialNumber: '', category: 'hardware', brand: '', modelName: '',
  purchaseDate: '', warrantyStart: '', warrantyEnd: '', warrantyMonths: '',
  warrantyType: 'manufacturer', provider: '', coverageDetails: '', claimProcess: '',
  receiptRef: '', cost: '', notes: '', customerName: '', customerEmail: '', vendorName: '',
};

const CATEGORIES = [
  { value: 'hardware', en: 'Hardware', zh: '硬件' },
  { value: 'software', en: 'Software', zh: '软件' },
  { value: 'appliance', en: 'Appliance', zh: '家电' },
  { value: 'vehicle', en: 'Vehicle', zh: '车辆' },
  { value: 'equipment', en: 'Equipment', zh: '设备' },
  { value: 'other', en: 'Other', zh: '其他' },
];

const WARRANTY_TYPES = [
  { value: 'manufacturer', en: 'Manufacturer', zh: '原厂' },
  { value: 'extended', en: 'Extended', zh: '延保' },
  { value: 'third-party', en: 'Third-Party', zh: '第三方' },
];

const REG_STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  expiring: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  expired: 'bg-red-500/20 text-red-300 border-red-500/30',
  claimed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  void: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const REG_STATUS_LABELS: Record<string, Record<string, string>> = {
  active: { en: 'Active', zh: '有效' },
  expiring: { en: 'Expiring', zh: '即将到期' },
  expired: { en: 'Expired', zh: '已过期' },
  claimed: { en: 'Claimed', zh: '已索赔' },
  void: { en: 'Void', zh: '作废' },
};

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
  const [tab, setTab] = useState<'registrations' | 'monitor' | 'alerts' | 'config'>('registrations');
  const [warrantyAssets, setWarrantyAssets] = useState<WarrantyAsset[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [registrations, setRegistrations] = useState<WarrantyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WarrantyConfig>(defaultConfig);
  const [showCompose, setShowCompose] = useState<WarrantyAsset | null>(null);
  const [configSaved, setConfigSaved] = useState(false);

  // Registration form state
  const [showRegForm, setShowRegForm] = useState(false);
  const [editingReg, setEditingReg] = useState<WarrantyRegistration | null>(null);
  const [regForm, setRegForm] = useState(EMPTY_FORM);
  const [regSaving, setRegSaving] = useState(false);
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState('all');
  const [regCategoryFilter, setRegCategoryFilter] = useState('all');
  const [viewingReg, setViewingReg] = useState<WarrantyRegistration | null>(null);

  // Fetch warranty data from API
  const fetchData = () => {
    setLoading(true);
    fetch('/api/warranty')
      .then(res => res.json())
      .then(data => {
        if (data.assets) setWarrantyAssets(data.assets);
        if (data.alerts) setAlerts(data.alerts);
        if (data.registrations) setRegistrations(data.registrations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const urgentAssets = useMemo(() =>
    warrantyAssets.filter(a => a.daysLeft <= 60).sort((a, b) => a.daysLeft - b.daysLeft),
  [warrantyAssets]);

  // Filtered registrations
  const filteredRegs = useMemo(() => {
    let list = registrations;
    if (regStatusFilter !== 'all') list = list.filter(r => r.status === regStatusFilter);
    if (regCategoryFilter !== 'all') list = list.filter(r => r.category === regCategoryFilter);
    if (regSearch) {
      const q = regSearch.toLowerCase();
      list = list.filter(r =>
        r.itemName.toLowerCase().includes(q) ||
        (r.serialNumber && r.serialNumber.toLowerCase().includes(q)) ||
        (r.brand && r.brand.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.vendorName && r.vendorName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [registrations, regStatusFilter, regCategoryFilter, regSearch]);

  // Registration stats
  const regStats = useMemo(() => ({
    total: registrations.length,
    active: registrations.filter(r => r.status === 'active').length,
    expiring: registrations.filter(r => r.status === 'expiring').length,
    expired: registrations.filter(r => r.status === 'expired').length,
  }), [registrations]);

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

  const openRegForm = (reg?: WarrantyRegistration) => {
    if (reg) {
      setEditingReg(reg);
      setRegForm({
        itemName: reg.itemName,
        serialNumber: reg.serialNumber || '',
        category: reg.category,
        brand: reg.brand || '',
        modelName: reg.modelName || '',
        purchaseDate: reg.purchaseDate ? reg.purchaseDate.split('T')[0] : '',
        warrantyStart: reg.warrantyStart.split('T')[0],
        warrantyEnd: reg.warrantyEnd.split('T')[0],
        warrantyMonths: reg.warrantyMonths ? String(reg.warrantyMonths) : '',
        warrantyType: reg.warrantyType,
        provider: reg.provider || '',
        coverageDetails: reg.coverageDetails || '',
        claimProcess: reg.claimProcess || '',
        receiptRef: reg.receiptRef || '',
        cost: reg.cost ? String(reg.cost) : '',
        notes: reg.notes || '',
        customerName: reg.customerName || '',
        customerEmail: reg.customerEmail || '',
        vendorName: reg.vendorName || '',
      });
    } else {
      setEditingReg(null);
      setRegForm(EMPTY_FORM);
    }
    setShowRegForm(true);
  };

  const handleRegSave = async () => {
    if (!regForm.itemName.trim() || !regForm.warrantyStart) return;
    setRegSaving(true);
    try {
      const payload = {
        ...regForm,
        warrantyMonths: regForm.warrantyMonths ? parseInt(regForm.warrantyMonths) : null,
        cost: regForm.cost ? parseFloat(regForm.cost) : null,
        ...(editingReg ? { id: editingReg.id } : {}),
      };

      const res = await fetch('/api/warranty/registrations', {
        method: editingReg ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowRegForm(false);
        fetchData();
      }
    } catch { /* ignore */ }
    setRegSaving(false);
  };

  const handleRegDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/warranty/registrations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch { /* ignore */ }
  };

  // Auto-calculate warranty end when start or months change
  const handleWarrantyCalc = (field: string, value: string) => {
    const updated = { ...regForm, [field]: value };
    if (field === 'warrantyStart' || field === 'warrantyMonths') {
      if (updated.warrantyStart && updated.warrantyMonths) {
        const start = new Date(updated.warrantyStart);
        start.setMonth(start.getMonth() + parseInt(updated.warrantyMonths));
        updated.warrantyEnd = start.toISOString().split('T')[0];
      }
    }
    setRegForm(updated);
  };

  const daysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const tabs = [
    { key: 'registrations', label: lang === 'en' ? 'Registrations' : '保修登记', icon: FileText },
    { key: 'monitor', label: lang === 'en' ? 'Warranty Monitor' : '保修监控', icon: Shield },
    { key: 'alerts', label: lang === 'en' ? 'Alert History' : '预警历史', icon: Bell },
    { key: 'config', label: lang === 'en' ? 'Email Settings' : '邮件设置', icon: Settings },
  ];

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-amber-400" />
              {lang === 'en' ? 'Warranty Management' : '保修管理'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Register, track, and monitor warranty items with automated alerts' : '登记、跟踪和监控保修项目，支持自动提醒'}
            </p>
          </div>
          {tab === 'registrations' && (
            <motion.button
              onClick={() => openRegForm()}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              {lang === 'en' ? 'Register Warranty' : '登记保修'}
            </motion.button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: lang === 'en' ? 'Registered' : '已登记', count: regStats.total, color: 'text-white', bg: 'bg-white/5' },
            { label: lang === 'en' ? 'Active' : '有效', count: regStats.active, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: lang === 'en' ? 'Expiring Soon' : '即将到期', count: regStats.expiring, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: lang === 'en' ? 'Expired' : '已过期', count: regStats.expired, color: 'text-red-400', bg: 'bg-red-500/10' },
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
        {tab === 'registrations' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={regSearch}
                  onChange={e => setRegSearch(e.target.value)}
                  placeholder={lang === 'en' ? 'Search items, serial, brand, customer...' : '搜索项目、序列号、品牌、客户...'}
                  className="glass-input w-full pl-10 pr-3 py-2 text-sm"
                />
              </div>
              <select
                value={regStatusFilter}
                onChange={e => setRegStatusFilter(e.target.value)}
                className="glass-input px-3 py-2 text-sm min-w-[130px]"
              >
                <option value="all" className="bg-gray-900">{lang === 'en' ? 'All Status' : '所有状态'}</option>
                {Object.entries(REG_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-gray-900">{v[lang]}</option>
                ))}
              </select>
              <select
                value={regCategoryFilter}
                onChange={e => setRegCategoryFilter(e.target.value)}
                className="glass-input px-3 py-2 text-sm min-w-[130px]"
              >
                <option value="all" className="bg-gray-900">{lang === 'en' ? 'All Categories' : '所有类别'}</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value} className="bg-gray-900">{c[lang === 'zh' ? 'zh' : 'en']}</option>
                ))}
              </select>
            </div>

            {/* Registrations Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Item' : '项目'}</th>
                      <th className="text-left py-3 px-4 text-white/50 text-xs font-medium hidden sm:table-cell">{lang === 'en' ? 'Category' : '类别'}</th>
                      <th className="text-left py-3 px-4 text-white/50 text-xs font-medium hidden md:table-cell">{lang === 'en' ? 'Serial No.' : '序列号'}</th>
                      <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Warranty Period' : '保修期'}</th>
                      <th className="text-left py-3 px-4 text-white/50 text-xs font-medium hidden lg:table-cell">{lang === 'en' ? 'Type' : '类型'}</th>
                      <th className="text-left py-3 px-4 text-white/50 text-xs font-medium hidden lg:table-cell">{lang === 'en' ? 'Customer' : '客户'}</th>
                      <th className="text-left py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Status' : '状态'}</th>
                      <th className="text-right py-3 px-4 text-white/50 text-xs font-medium">{lang === 'en' ? 'Actions' : '操作'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegs.length === 0 && !loading ? (
                      <tr><td colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Package className="w-12 h-12 text-white/20" />
                          <p className="text-white/40 text-sm">{lang === 'en' ? 'No warranty registrations yet' : '暂无保修登记'}</p>
                          <button onClick={() => openRegForm()} className="text-accent-400 hover:text-accent-300 text-sm font-medium flex items-center gap-1">
                            <Plus className="w-4 h-4" />
                            {lang === 'en' ? 'Register your first warranty' : '登记第一个保修'}
                          </button>
                        </div>
                      </td></tr>
                    ) : filteredRegs.map(reg => {
                      const days = daysLeft(reg.warrantyEnd);
                      return (
                        <tr key={reg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-white text-sm font-medium">{reg.itemName}</p>
                            <p className="text-white/40 text-xs">{reg.brand} {reg.modelName}</p>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <span className="text-white/60 text-xs capitalize">{CATEGORIES.find(c => c.value === reg.category)?.[lang === 'zh' ? 'zh' : 'en'] || reg.category}</span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className="text-white/60 text-xs font-mono">{reg.serialNumber || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-white/70 text-xs">{reg.warrantyStart.split('T')[0]}</p>
                            <p className="text-white/40 text-[10px]">→ {reg.warrantyEnd.split('T')[0]}</p>
                            {reg.status !== 'expired' && days > 0 && (
                              <p className={`text-[10px] font-medium ${days <= 7 ? 'text-red-400' : days <= 30 ? 'text-amber-400' : 'text-white/30'}`}>
                                {days} {lang === 'en' ? 'days left' : '天剩余'}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className="text-white/60 text-xs">{WARRANTY_TYPES.find(t => t.value === reg.warrantyType)?.[lang === 'zh' ? 'zh' : 'en'] || reg.warrantyType}</span>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <p className="text-white/60 text-xs">{reg.customerName || '-'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${REG_STATUS_COLORS[reg.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                              {REG_STATUS_LABELS[reg.status]?.[lang] || reg.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => setViewingReg(reg)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-blue-300 transition-all" title={lang === 'en' ? 'View' : '查看'}>
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => openRegForm(reg)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-amber-300 transition-all" title={lang === 'en' ? 'Edit' : '编辑'}>
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleRegDelete(reg.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-300 transition-all" title={lang === 'en' ? 'Delete' : '删除'}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
                  {warrantyAssets.length === 0 && !loading ? (
                    <tr><td colSpan={6} className="py-8">
                      <FeatureGuide {...MODULE_GUIDES.warranty} lang={lang} />
                    </td></tr>
                  ) : warrantyAssets.map(asset => {
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
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent-400" />
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
                  <div className="p-3 rounded-xl bg-accent-500/5 border border-accent-500/10">
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
                    className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
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

          {/* Registration Form Modal */}
          {showRegForm && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegForm(false)}
            >
              <motion.div
                className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent-400" />
                    {editingReg
                      ? (lang === 'en' ? 'Edit Warranty Registration' : '编辑保修登记')
                      : (lang === 'en' ? 'New Warranty Registration' : '新保修登记')}
                  </h3>
                  <button onClick={() => setShowRegForm(false)} className="text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Section: Item Details */}
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">{lang === 'en' ? 'Item Details' : '项目详情'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Item Name *' : '项目名称 *'}</label>
                        <input value={regForm.itemName} onChange={e => setRegForm(p => ({ ...p, itemName: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder={lang === 'en' ? 'e.g. Dell Latitude 7430 Laptop' : '例如：戴尔 Latitude 7430 笔记本'} />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Category' : '类别'}</label>
                        <select value={regForm.category} onChange={e => setRegForm(p => ({ ...p, category: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                          {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-gray-900">{c[lang === 'zh' ? 'zh' : 'en']}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Serial Number' : '序列号'}</label>
                        <input value={regForm.serialNumber} onChange={e => setRegForm(p => ({ ...p, serialNumber: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm font-mono" placeholder="SN-XXXXXX" />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Brand' : '品牌'}</label>
                        <input value={regForm.brand} onChange={e => setRegForm(p => ({ ...p, brand: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder="Dell, HP, Lenovo..." />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Model' : '型号'}</label>
                        <input value={regForm.modelName} onChange={e => setRegForm(p => ({ ...p, modelName: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Warranty Period */}
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">{lang === 'en' ? 'Warranty Period' : '保修期限'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Purchase Date' : '购买日期'}</label>
                        <input type="date" value={regForm.purchaseDate} onChange={e => setRegForm(p => ({ ...p, purchaseDate: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Warranty Start *' : '保修开始 *'}</label>
                        <input type="date" value={regForm.warrantyStart} onChange={e => handleWarrantyCalc('warrantyStart', e.target.value)} className="glass-input w-full px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Period (Months)' : '期限（月）'}</label>
                        <input type="number" min="1" max="120" value={regForm.warrantyMonths} onChange={e => handleWarrantyCalc('warrantyMonths', e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="12, 24, 36..." />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Warranty End *' : '保修结束 *'}</label>
                        <input type="date" value={regForm.warrantyEnd} onChange={e => setRegForm(p => ({ ...p, warrantyEnd: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                        {regForm.warrantyEnd && (
                          <p className="text-white/30 text-[10px] mt-1">{daysLeft(regForm.warrantyEnd) > 0 ? `${daysLeft(regForm.warrantyEnd)} ${lang === 'en' ? 'days from today' : '天后到期'}` : (lang === 'en' ? 'Already expired' : '已过期')}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Warranty Type' : '保修类型'}</label>
                        <select value={regForm.warrantyType} onChange={e => setRegForm(p => ({ ...p, warrantyType: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                          {WARRANTY_TYPES.map(t => <option key={t.value} value={t.value} className="bg-gray-900">{t[lang === 'zh' ? 'zh' : 'en']}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Warranty Cost ($)' : '保修费用 ($)'}</label>
                        <input type="number" min="0" step="0.01" value={regForm.cost} onChange={e => setRegForm(p => ({ ...p, cost: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Provider & Coverage */}
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">{lang === 'en' ? 'Provider & Coverage' : '提供商与覆盖范围'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Warranty Provider' : '保修提供商'}</label>
                        <input value={regForm.provider} onChange={e => setRegForm(p => ({ ...p, provider: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder={lang === 'en' ? 'Dell ProSupport, HP Care Pack...' : '戴尔专业支持、惠普关怀服务...'} />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Receipt/PO Reference' : '收据/采购单号'}</label>
                        <input value={regForm.receiptRef} onChange={e => setRegForm(p => ({ ...p, receiptRef: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm font-mono" placeholder="PO-2024-001" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Coverage Details' : '覆盖详情'}</label>
                        <textarea value={regForm.coverageDetails} onChange={e => setRegForm(p => ({ ...p, coverageDetails: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" rows={2} placeholder={lang === 'en' ? 'Parts, labor, on-site support, accidental damage...' : '零件、人工、上门支持、意外损坏保护...'} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Claim Process' : '索赔流程'}</label>
                        <textarea value={regForm.claimProcess} onChange={e => setRegForm(p => ({ ...p, claimProcess: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" rows={2} placeholder={lang === 'en' ? 'Contact support at 1-800-XXX, or email warranty@vendor.com...' : '联系支持 1-800-XXX，或邮件 warranty@vendor.com...'} />
                      </div>
                    </div>
                  </div>

                  {/* Section: Customer & Vendor */}
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">{lang === 'en' ? 'Customer & Vendor' : '客户与供应商'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Customer Name' : '客户名称'}</label>
                        <input value={regForm.customerName} onChange={e => setRegForm(p => ({ ...p, customerName: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Customer Email' : '客户邮箱'}</label>
                        <input type="email" value={regForm.customerEmail} onChange={e => setRegForm(p => ({ ...p, customerEmail: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Vendor' : '供应商'}</label>
                        <input value={regForm.vendorName} onChange={e => setRegForm(p => ({ ...p, vendorName: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-white/60 text-xs mb-1">{lang === 'en' ? 'Notes' : '备注'}</label>
                    <textarea value={regForm.notes} onChange={e => setRegForm(p => ({ ...p, notes: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" rows={2} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => setShowRegForm(false)} className="glass-button px-4 py-2 text-sm">
                    {lang === 'en' ? 'Cancel' : '取消'}
                  </button>
                  <motion.button
                    onClick={handleRegSave}
                    disabled={regSaving || !regForm.itemName.trim() || !regForm.warrantyStart || !regForm.warrantyEnd}
                    className="px-5 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {regSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {editingReg
                      ? (lang === 'en' ? 'Update' : '更新')
                      : (lang === 'en' ? 'Register' : '登记')}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Registration Detail View Modal */}
          {viewingReg && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingReg(null)}
            >
              <motion.div
                className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent-400" />
                    {lang === 'en' ? 'Warranty Details' : '保修详情'}
                  </h3>
                  <button onClick={() => setViewingReg(null)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white text-lg font-bold">{viewingReg.itemName}</h4>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${REG_STATUS_COLORS[viewingReg.status] || ''}`}>
                      {REG_STATUS_LABELS[viewingReg.status]?.[lang] || viewingReg.status}
                    </span>
                  </div>

                  {[
                    { label: lang === 'en' ? 'Category' : '类别', value: CATEGORIES.find(c => c.value === viewingReg.category)?.[lang === 'zh' ? 'zh' : 'en'] },
                    { label: lang === 'en' ? 'Brand / Model' : '品牌 / 型号', value: [viewingReg.brand, viewingReg.modelName].filter(Boolean).join(' — ') || '-' },
                    { label: lang === 'en' ? 'Serial Number' : '序列号', value: viewingReg.serialNumber || '-', mono: true },
                    { label: lang === 'en' ? 'Purchase Date' : '购买日期', value: viewingReg.purchaseDate?.split('T')[0] || '-' },
                    { label: lang === 'en' ? 'Warranty Period' : '保修期', value: `${viewingReg.warrantyStart.split('T')[0]} → ${viewingReg.warrantyEnd.split('T')[0]}${viewingReg.warrantyMonths ? ` (${viewingReg.warrantyMonths} ${lang === 'en' ? 'months' : '个月'})` : ''}` },
                    { label: lang === 'en' ? 'Days Remaining' : '剩余天数', value: `${daysLeft(viewingReg.warrantyEnd)} ${lang === 'en' ? 'days' : '天'}`, highlight: daysLeft(viewingReg.warrantyEnd) <= 30 },
                    { label: lang === 'en' ? 'Warranty Type' : '保修类型', value: WARRANTY_TYPES.find(t => t.value === viewingReg.warrantyType)?.[lang === 'zh' ? 'zh' : 'en'] },
                    { label: lang === 'en' ? 'Provider' : '提供商', value: viewingReg.provider || '-' },
                    { label: lang === 'en' ? 'Cost' : '费用', value: viewingReg.cost ? `$${viewingReg.cost.toFixed(2)}` : '-' },
                    { label: lang === 'en' ? 'Receipt Ref' : '收据编号', value: viewingReg.receiptRef || '-', mono: true },
                    { label: lang === 'en' ? 'Customer' : '客户', value: [viewingReg.customerName, viewingReg.customerEmail].filter(Boolean).join(' — ') || '-' },
                    { label: lang === 'en' ? 'Vendor' : '供应商', value: viewingReg.vendorName || '-' },
                    { label: lang === 'en' ? 'Coverage' : '覆盖范围', value: viewingReg.coverageDetails || '-' },
                    { label: lang === 'en' ? 'Claim Process' : '索赔流程', value: viewingReg.claimProcess || '-' },
                    { label: lang === 'en' ? 'Notes' : '备注', value: viewingReg.notes || '-' },
                  ].map((row, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 p-2 rounded-lg bg-white/5">
                      <span className="text-white/40 text-xs min-w-[120px] shrink-0">{row.label}</span>
                      <span className={`text-sm flex-1 ${row.highlight ? 'text-amber-400 font-bold' : 'text-white/80'} ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => { setViewingReg(null); openRegForm(viewingReg); }} className="glass-button px-4 py-2 text-sm flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> {lang === 'en' ? 'Edit' : '编辑'}
                  </button>
                  <button onClick={() => setViewingReg(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-all">
                    {lang === 'en' ? 'Close' : '关闭'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}
