'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, Palette, Globe, Bot, Building2, Save, Check, Eye,
  Mail, MessageSquare, Bell, Shield, Database, Cloud, Webhook, Link2,
  Monitor, Users, Wrench, TrendingUp, ScanLine, ArrowRight, Sparkles,
  ArrowDown, LayoutDashboard, FileText, ShieldCheck, Upload, Image, AlertCircle, CheckCircle,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import { themes, type ThemeKey } from '@/lib/themes';
import Link from 'next/link';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

export default function SettingsPage() {
  const { themeKey, setTheme, lang, setLang, aiApiKey, setAiApiKey } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(aiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Company Profile (fetched from API)
  const [company, setCompany] = useState({
    companyName: '', uen: '', logoUrl: '', address: '', postalCode: '', country: 'Singapore',
    phone: '', email: '', website: '', gstNumber: '', bankName: '', bankAccount: '', bankSwift: '',
    invoicePrefix: 'INV', invoiceFooter: '', quotationFooter: '',
  });
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Import
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTarget, setImportTarget] = useState('customers');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported?: number; skipped?: number; errors?: string[]; totalRows?: number } | null>(null);

  // Fetch company on mount
  useEffect(() => {
    fetch('/api/company').then(r => r.ok ? r.json() : null).then(data => { if (data) setCompany(data); });
  }, []);

  const handleSaveCompany = async () => {
    setCompanySaving(true);
    try {
      const res = await fetch('/api/company', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(company) });
      if (res.ok) { setCompanySaved(true); setTimeout(() => setCompanySaved(false), 2000); }
    } catch { /* silent */ } finally { setCompanySaving(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return; // 2MB max
    const reader = new FileReader();
    reader.onload = () => setCompany(prev => ({ ...prev, logoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true); setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', importFile);
      form.append('target', importTarget);
      const res = await fetch('/api/import', { method: 'POST', body: form });
      const data = await res.json();
      setImportResult(data);
    } catch { setImportResult({ success: false, errors: ['Upload failed'] }); } finally { setImporting(false); }
  };

  // SMTP
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // WhatsApp
  const [waApiKey, setWaApiKey] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [showWaKey, setShowWaKey] = useState(false);

  // Integrations
  const [webhookUrl, setWebhookUrl] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'workflow' | 'guide'>('general');

  const themeEntries: { key: ThemeKey; label: string; preview: string }[] = [
    { key: 'carbon', label: lang === 'en' ? 'Carbon' : '碳黑', preview: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]' },
    { key: 'neon', label: lang === 'en' ? 'Neon' : '霓虹', preview: 'from-[#0d0b1e] via-[#1a1040] to-[#13072e]' },
    { key: 'daylight', label: lang === 'en' ? 'Daylight' : '晨光', preview: 'from-[#0f172a] via-[#1e293b] to-[#0c1524]' },
  ];

  const handleSave = () => {
    setAiApiKey(apiKeyInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { key: 'general' as const, label: lang === 'en' ? 'General' : '常规', icon: SettingsIcon },
    { key: 'integrations' as const, label: lang === 'en' ? 'Integrations' : '集成', icon: Link2 },
    { key: 'workflow' as const, label: lang === 'en' ? 'Architecture' : '架构', icon: Database },
    { key: 'guide' as const, label: lang === 'en' ? 'Quick Guide' : '快速指南', icon: Sparkles },
  ];

  const workflowNodes = [
    { icon: LayoutDashboard, label: lang === 'en' ? 'Dashboard' : '仪表盘', color: 'from-blue-500 to-blue-600', desc: lang === 'en' ? 'Overview & stats' : '概览和统计', href: '/dashboard' },
    { icon: Monitor, label: lang === 'en' ? 'Assets' : '资产', color: 'from-emerald-500 to-emerald-600', desc: lang === 'en' ? 'Register & track hardware' : '注册和跟踪硬件', href: '/assets' },
    { icon: Users, label: lang === 'en' ? 'Employees' : '员工', color: 'from-violet-500 to-violet-600', desc: lang === 'en' ? 'Assign assets to staff' : '分配资产给员工', href: '/employees' },
    { icon: Wrench, label: lang === 'en' ? 'Maintenance' : '维护', color: 'from-amber-500 to-amber-600', desc: lang === 'en' ? 'Create repair tickets' : '创建维修工单', href: '/maintenance' },
    { icon: Shield, label: lang === 'en' ? 'Warranty' : '保修', color: 'from-red-500 to-red-600', desc: lang === 'en' ? 'Monitor & alert expiry' : '监控并提醒到期', href: '/warranty' },
    { icon: TrendingUp, label: lang === 'en' ? 'Reports' : '报告', color: 'from-accent-500 to-accent-600', desc: lang === 'en' ? 'Analytics & insights' : '分析和洞察', href: '/reports' },
    { icon: ShieldCheck, label: lang === 'en' ? 'RBAC' : '权限', color: 'from-pink-500 to-pink-600', desc: lang === 'en' ? 'Manage user roles' : '管理用户角色', href: '/users' },
    { icon: Bot, label: lang === 'en' ? 'AI Assistant' : 'AI助手', color: 'from-indigo-500 to-indigo-600', desc: lang === 'en' ? 'Ask anything about IT' : '询问IT相关问题', href: '/ai-assistant' },
  ];

  const guideCards = [
    { title: lang === 'en' ? '1. Add Assets' : '1. 添加资产', desc: lang === 'en' ? 'Start by registering all IT hardware. Use barcode scanner or manual entry.' : '首先注册所有IT硬件。使用条码扫描或手动输入。', icon: Monitor, color: 'from-blue-500 to-accent-500', href: '/assets?action=add', action: lang === 'en' ? 'Add Asset' : '添加资产' },
    { title: lang === 'en' ? '2. Register Employees' : '2. 注册员工', desc: lang === 'en' ? 'Add staff profiles, then assign assets to them from the Assets page.' : '添加员工档案，然后从资产页面分配资产。', icon: Users, color: 'from-violet-500 to-purple-500', href: '/employees', action: lang === 'en' ? 'Add Employee' : '添加员工' },
    { title: lang === 'en' ? '3. Track Warranties' : '3. 跟踪保修', desc: lang === 'en' ? 'System auto-detects expiring warranties. Configure email/WhatsApp alerts.' : '系统自动检测到期保修。配置邮件/WhatsApp提醒。', icon: Shield, color: 'from-amber-500 to-orange-500', href: '/warranty', action: lang === 'en' ? 'View Warranty' : '查看保修' },
    { title: lang === 'en' ? '4. Maintenance Tickets' : '4. 维护工单', desc: lang === 'en' ? 'Log repair & upgrade tickets. Link to specific assets for tracking.' : '记录维修和升级工单。链接到具体资产进行跟踪。', icon: Wrench, color: 'from-emerald-500 to-teal-500', href: '/maintenance?action=add', action: lang === 'en' ? 'Create Ticket' : '创建工单' },
    { title: lang === 'en' ? '5. Set Permissions' : '5. 设置权限', desc: lang === 'en' ? 'Configure RBAC roles (Admin/Manager/Staff) with granular resource access.' : '配置RBAC角色（管理员/经理/员工）细粒度资源访问。', icon: ShieldCheck, color: 'from-pink-500 to-rose-500', href: '/users', action: lang === 'en' ? 'Manage Roles' : '管理角色' },
    { title: lang === 'en' ? '6. AI Insights' : '6. AI洞察', desc: lang === 'en' ? 'Ask AI about asset health, cost optimization, and smart recommendations.' : '向AI询问资产健康、成本优化和智能推荐。', icon: Bot, color: 'from-indigo-500 to-violet-500', href: '/ai-assistant', action: lang === 'en' ? 'Ask AI' : '询问AI' },
  ];

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 90, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <SettingsIcon className="w-7 h-7 text-white/60" />
              </motion.div>
              {t('settings.title', lang)}
            </h1>
            <p className="text-white/50 text-sm mt-1">{t('settings.subtitle', lang)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass-card p-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all flex-1 justify-center ${
                  activeTab === tab.key ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {activeTab === tab.key && (
                  <motion.div className="absolute inset-0 bg-white/10 rounded-xl border border-white/20" layoutId="settingsTab" />
                )}
                <span className="relative flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Theme */}
            <motion.div className="glass-card p-5" custom={0} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                <Palette className="w-4 h-4 text-pink-400" />
                {t('settings.theme', lang)}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {themeEntries.map((entry) => (
                  <motion.button
                    key={entry.key}
                    onClick={() => setTheme(entry.key)}
                    className={`relative p-3 rounded-xl border transition-all text-left ${
                      themeKey === entry.key ? 'border-white/40 bg-white/10 ring-2 ring-white/20' : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${entry.preview} mb-2 border border-white/10`} />
                    <p className="text-white text-xs font-medium">{entry.label}</p>
                    {themeKey === entry.key && (
                      <motion.div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Language */}
            <motion.div className="glass-card p-5" custom={1} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-blue-400" />
                {lang === 'en' ? 'Language' : '语言'}
              </h2>
              <div className="flex gap-2">
                {[
                  { value: 'en' as const, label: 'English', flag: '🇬🇧' },
                  { value: 'zh' as const, label: '中文', flag: '🇨🇳' },
                ].map(l => (
                  <motion.button key={l.value} onClick={() => setLang(l.value)} className={`px-5 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-sm ${lang === l.value ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 bg-white/5 text-white/50 hover:text-white/70'}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <span className="text-lg">{l.flag}</span>{l.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* AI Config */}
            <motion.div className="glass-card p-5" custom={2} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                <Bot className="w-4 h-4 text-violet-400" />
                {lang === 'en' ? 'AI Configuration' : 'AI 配置'}
              </h2>
              <p className="text-white/40 text-xs mb-3">
                {lang === 'en' ? 'OpenAI API key for AI chat assistant & smart recommendations.' : 'OpenAI API密钥用于AI聊天助手和智能推荐。'}
              </p>
              <div className="relative">
                <input type={showApiKey ? 'text' : 'password'} value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="sk-..." className="glass-input w-full px-3 py-2 text-sm pr-10" />
                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"><Eye className="w-3.5 h-3.5" /></button>
              </div>
            </motion.div>

            {/* Company Branding & Profile */}
            <motion.div className="glass-card p-5" custom={3} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-amber-400" />
                {lang === 'en' ? 'Company Branding & Profile' : '公司品牌与档案'}
              </h2>

              {/* Logo */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 overflow-hidden flex-shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Image className="w-6 h-6 text-white/30" />
                  )}
                </div>
                <div>
                  <button onClick={() => logoInputRef.current?.click()} className="px-3 py-1.5 bg-accent-500/20 hover:bg-accent-500/30 border border-accent-500/30 rounded-lg text-accent-400 text-xs transition-colors flex items-center gap-1.5">
                    <Upload className="w-3 h-3" /> {lang === 'en' ? 'Upload Logo' : '上传标志'}
                  </button>
                  <p className="text-white/30 text-[10px] mt-1">{lang === 'en' ? 'Max 2MB. Appears on invoices & reports.' : '最大2MB。显示在发票和报告上。'}</p>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'companyName', label: lang === 'en' ? 'Company Name' : '公司名称', type: 'text' },
                  { key: 'uen', label: lang === 'en' ? 'UEN (Registration No.)' : 'UEN（注册号）', type: 'text' },
                  { key: 'email', label: lang === 'en' ? 'Email' : '电子邮件', type: 'email' },
                  { key: 'phone', label: lang === 'en' ? 'Phone' : '电话', type: 'tel' },
                  { key: 'website', label: lang === 'en' ? 'Website' : '网站', type: 'url' },
                  { key: 'address', label: lang === 'en' ? 'Address' : '地址', type: 'text' },
                  { key: 'postalCode', label: lang === 'en' ? 'Postal Code' : '邮编', type: 'text' },
                  { key: 'country', label: lang === 'en' ? 'Country' : '国家', type: 'text' },
                  { key: 'gstNumber', label: lang === 'en' ? 'GST Registration No.' : 'GST注册号', type: 'text' },
                  { key: 'bankName', label: lang === 'en' ? 'Bank Name' : '银行名称', type: 'text' },
                  { key: 'bankAccount', label: lang === 'en' ? 'Bank Account No.' : '银行账号', type: 'text' },
                  { key: 'bankSwift', label: lang === 'en' ? 'SWIFT Code' : 'SWIFT代码', type: 'text' },
                  { key: 'invoicePrefix', label: lang === 'en' ? 'Invoice Prefix' : '发票前缀', type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-white/40 text-[10px] mb-1 block">{field.label}</label>
                    <input type={field.type} value={(company as Record<string, string>)[field.key] || ''} onChange={e => setCompany(prev => ({ ...prev, [field.key]: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Invoice Footer Text' : '发票页脚'}</label>
                  <textarea value={company.invoiceFooter} onChange={e => setCompany(prev => ({ ...prev, invoiceFooter: e.target.value }))} rows={2} className="glass-input w-full px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Quotation Footer Text' : '报价单页脚'}</label>
                  <textarea value={company.quotationFooter} onChange={e => setCompany(prev => ({ ...prev, quotationFooter: e.target.value }))} rows={2} className="glass-input w-full px-3 py-2 text-sm resize-none" />
                </div>
              </div>
              <div className="mt-3">
                <motion.button onClick={handleSaveCompany} disabled={companySaving} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                  {companySaved ? <><Check className="w-3.5 h-3.5" /> {lang === 'en' ? 'Saved!' : '已保存！'}</> : <><Save className="w-3.5 h-3.5" /> {lang === 'en' ? 'Save Company Profile' : '保存公司档案'}</>}
                </motion.button>
              </div>
            </motion.div>

            {/* Data Import */}
            <motion.div className="glass-card p-5" custom={4} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                <Upload className="w-4 h-4 text-emerald-400" />
                {lang === 'en' ? 'Data Import (CSV / Excel)' : '数据导入（CSV / Excel）'}
              </h2>
              <p className="text-white/40 text-xs mb-3">
                {lang === 'en' ? 'Import existing data from CSV or TSV files. Save your Excel as CSV before uploading.' : '从CSV或TSV文件导入现有数据。上传前请将Excel另存为CSV。'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <select value={importTarget} onChange={e => setImportTarget(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500/50 appearance-none">
                  {[
                    { value: 'customers', label: lang === 'en' ? 'Customers' : '客户' },
                    { value: 'vendors', label: lang === 'en' ? 'Vendors' : '供应商' },
                    { value: 'assets', label: lang === 'en' ? 'Assets' : '资产' },
                    { value: 'employees', label: lang === 'en' ? 'Employees' : '员工' },
                    { value: 'invoices', label: lang === 'en' ? 'Invoices' : '发票' },
                    { value: 'warranty', label: lang === 'en' ? 'Warranty Alerts' : '保修提醒' },
                  ].map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <label className="flex-1 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/8 transition-colors">
                  <Upload className="w-4 h-4 text-white/30" />
                  <span className="text-white/50 text-sm truncate">{importFile ? importFile.name : (lang === 'en' ? 'Choose CSV file...' : '选择CSV文件...')}</span>
                  <input type="file" accept=".csv,.tsv,.txt" onChange={e => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }} className="hidden" />
                </label>
                <motion.button onClick={handleImport} disabled={!importFile || importing} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-40" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                  {importing ? (lang === 'en' ? 'Importing...' : '导入中...') : (lang === 'en' ? 'Import' : '导入')}
                </motion.button>
              </div>
              {importResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-3 p-3 rounded-xl border text-xs ${importResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {importResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="font-medium">{importResult.success ? (lang === 'en' ? 'Import Complete' : '导入完成') : (lang === 'en' ? 'Import Failed' : '导入失败')}</span>
                  </div>
                  {importResult.success && (
                    <p>{lang === 'en' ? `${importResult.imported} imported, ${importResult.skipped} skipped out of ${importResult.totalRows} rows` : `${importResult.totalRows}行中导入${importResult.imported}条，跳过${importResult.skipped}条`}</p>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <ul className="mt-1 space-y-0.5 list-disc list-inside text-[10px] opacity-80 max-h-24 overflow-y-auto">{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                  )}
                </motion.div>
              )}
            </motion.div>

            <motion.button onClick={handleSave} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span key="saved" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check className="w-4 h-4" /> {lang === 'en' ? 'Saved!' : '已保存！'}</motion.span>
                ) : (
                  <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Save className="w-4 h-4" /> {lang === 'en' ? 'Save Settings' : '保存设置'}</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* SMTP */}
            <motion.div className="glass-card p-5" custom={0} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-blue-400" />
                {lang === 'en' ? 'SMTP Email Configuration' : 'SMTP 邮件配置'}
              </h2>
              <p className="text-white/40 text-xs mb-3">{lang === 'en' ? 'Configure SMTP for warranty alerts, ticket notifications & reports.' : '配置SMTP用于保修提醒、工单通知和报告。'}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'SMTP Host' : 'SMTP主机'}</label>
                  <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Port' : '端口'}</label>
                  <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="587" />
                </div>
                <div>
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Username' : '用户名'}</label>
                  <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="your@email.com" />
                </div>
                <div className="relative">
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Password' : '密码'}</label>
                  <input type={showSmtpPass ? 'text' : 'password'} value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} className="glass-input w-full px-3 py-2 text-sm pr-10" placeholder="••••••••" />
                  <button onClick={() => setShowSmtpPass(!showSmtpPass)} className="absolute right-3 bottom-2.5 text-white/30 hover:text-white/60"><Eye className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {lang === 'en' ? 'AI Tip: Used for warranty expiry alerts (escalating tone), ticket status updates & monthly report emails.' : 'AI提示：用于保修到期提醒（逐步升级语气）、工单状态更新和月度报告邮件。'}
                </p>
              </div>
            </motion.div>

            {/* WhatsApp */}
            <motion.div className="glass-card p-5" custom={1} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                {lang === 'en' ? 'WhatsApp Business API' : 'WhatsApp Business API'}
              </h2>
              <p className="text-white/40 text-xs mb-3">{lang === 'en' ? 'Send instant warranty & maintenance alerts via WhatsApp.' : '通过WhatsApp发送即时保修和维护提醒。'}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'API Key' : 'API密钥'}</label>
                  <input type={showWaKey ? 'text' : 'password'} value={waApiKey} onChange={(e) => setWaApiKey(e.target.value)} className="glass-input w-full px-3 py-2 text-sm pr-10" placeholder="whsec_..." />
                  <button onClick={() => setShowWaKey(!showWaKey)} className="absolute right-3 bottom-2.5 text-white/30 hover:text-white/60"><Eye className="w-3.5 h-3.5" /></button>
                </div>
                <div>
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Phone Number ID' : '电话号码ID'}</label>
                  <input type="text" value={waPhoneId} onChange={(e) => setWaPhoneId(e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="1234567890" />
                </div>
              </div>
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-300 text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {lang === 'en' ? 'AI Tip: Links to Warranty page alerts. When warranty is near expiry, both email + WhatsApp are sent.' : 'AI提示：链接到保修页面提醒。当保修即将到期时，同时发送邮件和WhatsApp。'}
                </p>
              </div>
            </motion.div>

            {/* Webhook / Slack */}
            <motion.div className="glass-card p-5" custom={2} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                <Webhook className="w-4 h-4 text-orange-400" />
                {lang === 'en' ? 'Webhooks & Slack' : 'Webhooks 和 Slack'}
              </h2>
              <p className="text-white/40 text-xs mb-3">{lang === 'en' ? 'Push real-time events to external systems.' : '推送实时事件到外部系统。'}</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Custom Webhook URL' : '自定义Webhook URL'}</label>
                  <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="https://your-api.com/webhook" />
                </div>
                <div>
                  <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Slack Incoming Webhook' : 'Slack传入Webhook'}</label>
                  <input type="url" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="https://hooks.slack.com/services/..." />
                </div>
              </div>
            </motion.div>

            {/* Notification Channels */}
            <motion.div className="glass-card p-5" custom={3} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4 text-rose-400" />
                {lang === 'en' ? 'Notification Channels' : '通知渠道'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: lang === 'en' ? 'Email' : '邮件', icon: Mail, enabled: true, color: 'blue' },
                  { label: 'WhatsApp', icon: MessageSquare, enabled: false, color: 'emerald' },
                  { label: 'Slack', icon: MessageSquare, enabled: false, color: 'orange' },
                  { label: 'Webhook', icon: Webhook, enabled: false, color: 'violet' },
                ].map((ch, i) => {
                  const ChIcon = ch.icon;
                  return (
                    <motion.div key={ch.label} className={`p-3 rounded-xl border text-center ${ch.enabled ? `bg-${ch.color}-500/10 border-${ch.color}-500/30` : 'bg-white/5 border-white/10'}`} whileHover={{ scale: 1.03 }}>
                      <ChIcon className={`w-5 h-5 mx-auto mb-1.5 ${ch.enabled ? `text-${ch.color}-400` : 'text-white/30'}`} />
                      <p className={`text-xs font-medium ${ch.enabled ? 'text-white' : 'text-white/40'}`}>{ch.label}</p>
                      <span className={`text-[9px] ${ch.enabled ? 'text-emerald-400' : 'text-white/30'}`}>{ch.enabled ? (lang === 'en' ? 'Active' : '活跃') : (lang === 'en' ? 'Inactive' : '未激活')}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.button onClick={handleSave} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Save className="w-4 h-4" /> {lang === 'en' ? 'Save Integrations' : '保存集成'}
            </motion.button>
          </motion.div>
        )}

        {/* Architecture Diagram Tab */}
        {activeTab === 'workflow' && (
          <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-white font-semibold mb-1 flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-accent-400" />
                {lang === 'en' ? 'System Architecture' : '系统架构'}
              </h2>
              <p className="text-white/40 text-xs mb-5">{lang === 'en' ? 'All modules are interconnected. Click any node to navigate.' : '所有模块互相连接。点击任何节点进行导航。'}</p>

              {/* Architecture visual */}
              <div className="relative">
                {/* Top: Dashboard */}
                <div className="flex justify-center mb-3">
                  <Link href="/dashboard">
                    <motion.div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer w-32 transition-all" whileHover={{ scale: 1.05, y: -2 }}>
                      <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg" animate={{ boxShadow: ['0 0 0px rgba(59,130,246,0.3)', '0 0 20px rgba(59,130,246,0.5)', '0 0 0px rgba(59,130,246,0.3)'] }} transition={{ duration: 2, repeat: Infinity }}>
                        <LayoutDashboard className="w-5 h-5 text-white" />
                      </motion.div>
                      <span className="text-white text-xs font-medium">{lang === 'en' ? 'Dashboard' : '仪表盘'}</span>
                      <span className="text-white/40 text-[9px]">{lang === 'en' ? 'Central hub' : '中心枢纽'}</span>
                    </motion.div>
                  </Link>
                </div>

                {/* Animated arrows down */}
                <div className="flex justify-center mb-3">
                  <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowDown className="w-5 h-5 text-white/20" />
                  </motion.div>
                </div>

                {/* Middle row: Core modules */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {workflowNodes.slice(1, 5).map((node, i) => {
                    const NodeIcon = node.icon;
                    return (
                      <Link key={node.label} href={node.href}>
                        <motion.div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all" whileHover={{ scale: 1.05, y: -2 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                          <motion.div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center shadow-lg`} animate={{ rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}>
                            <NodeIcon className="w-4.5 h-4.5 text-white" />
                          </motion.div>
                          <span className="text-white text-xs font-medium">{node.label}</span>
                          <span className="text-white/40 text-[9px] text-center">{node.desc}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>

                {/* Arrows */}
                <div className="flex justify-center mb-3">
                  <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>
                    <ArrowDown className="w-5 h-5 text-white/20" />
                  </motion.div>
                </div>

                {/* Bottom row: Support modules */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {workflowNodes.slice(5).map((node, i) => {
                    const NodeIcon = node.icon;
                    return (
                      <Link key={node.label} href={node.href}>
                        <motion.div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all" whileHover={{ scale: 1.05, y: -2 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                          <motion.div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center shadow-lg`} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}>
                            <NodeIcon className="w-4.5 h-4.5 text-white" />
                          </motion.div>
                          <span className="text-white text-xs font-medium">{node.label}</span>
                          <span className="text-white/40 text-[9px] text-center">{node.desc}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>

                {/* Integration layer */}
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 border-dashed">
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                      <Cloud className="w-4 h-4 text-accent-400" />
                    </motion.div>
                    <span className="text-white/60 text-xs font-medium">{lang === 'en' ? 'Integration Layer' : '集成层'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'SMTP Email', icon: Mail, color: 'text-blue-400' },
                      { label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
                      { label: 'Slack', icon: MessageSquare, color: 'text-orange-400' },
                      { label: 'Webhook', icon: Webhook, color: 'text-violet-400' },
                      { label: 'OpenAI', icon: Bot, color: 'text-indigo-400' },
                      { label: 'Barcode', icon: ScanLine, color: 'text-amber-400' },
                      { label: 'Weather API', icon: Cloud, color: 'text-accent-400' },
                    ].map((int, i) => {
                      const IntIcon = int.icon;
                      return (
                        <motion.div key={int.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }}>
                          <IntIcon className={`w-3 h-3 ${int.color}`} />
                          <span className="text-white/50 text-[10px]">{int.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Data Flow Legend */}
            <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-blue-400" />
                {lang === 'en' ? 'Data Flow' : '数据流'}
              </h2>
              <div className="space-y-2">
                {[
                  { from: lang === 'en' ? 'Assets' : '资产', to: lang === 'en' ? 'Employees' : '员工', desc: lang === 'en' ? 'Assign hardware to staff' : '将硬件分配给员工', color: 'bg-emerald-400' },
                  { from: lang === 'en' ? 'Assets' : '资产', to: lang === 'en' ? 'Warranty' : '保修', desc: lang === 'en' ? 'Auto-track warranty expiry' : '自动跟踪保修到期', color: 'bg-amber-400' },
                  { from: lang === 'en' ? 'Assets' : '资产', to: lang === 'en' ? 'Maintenance' : '维护', desc: lang === 'en' ? 'Create repair tickets for assets' : '为资产创建维修工单', color: 'bg-blue-400' },
                  { from: lang === 'en' ? 'Warranty' : '保修', to: lang === 'en' ? 'SMTP/WhatsApp' : 'SMTP/WhatsApp', desc: lang === 'en' ? 'Escalating alert emails & messages' : '逐步升级的提醒邮件和消息', color: 'bg-red-400' },
                  { from: lang === 'en' ? 'All Modules' : '所有模块', to: lang === 'en' ? 'Dashboard' : '仪表盘', desc: lang === 'en' ? 'Aggregate stats & activity feed' : '聚合统计和活动动态', color: 'bg-violet-400' },
                ].map((flow, i) => (
                  <motion.div key={i} className="flex items-center gap-2 text-xs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                    <div className={`w-1.5 h-1.5 rounded-full ${flow.color}`} />
                    <span className="text-white/60 font-medium">{flow.from}</span>
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ArrowRight className="w-3 h-3 text-white/20" />
                    </motion.div>
                    <span className="text-white/60 font-medium">{flow.to}</span>
                    <span className="text-white/30 ml-1">— {flow.desc}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Quick Guide Tab */}
        {activeTab === 'guide' && (
          <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* AI Welcome Card */}
            <motion.div className="glass-card p-5 bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-violet-500/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-3">
                <motion.div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center" animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </motion.div>
                <div>
                  <h2 className="text-white font-semibold text-sm">{lang === 'en' ? 'AI Getting Started Guide' : 'AI 入门指南'}</h2>
                  <p className="text-white/40 text-[10px]">{lang === 'en' ? 'Follow these steps to set up your IT inventory system' : '按照以下步骤设置您的IT资产管理系统'}</p>
                </div>
              </div>
            </motion.div>

            {/* Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {guideCards.map((card, i) => {
                const CardIcon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    className="glass-card glass-card-hover p-4"
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <motion.div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`} animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.3 }}>
                        <CardIcon className="w-4 h-4 text-white" />
                      </motion.div>
                      <h3 className="text-white text-xs font-semibold">{card.title}</h3>
                    </div>
                    <p className="text-white/50 text-[10px] leading-relaxed mb-3">{card.desc}</p>
                    <Link href={card.href}>
                      <motion.div className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-[10px] font-medium cursor-pointer" whileHover={{ x: 4 }}>
                        {card.action}
                        <ArrowRight className="w-3 h-3" />
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Connections Card */}
            <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                <Link2 className="w-4 h-4 text-accent-400" />
                {lang === 'en' ? 'How Features Connect' : '功能如何连接'}
              </h2>
              <div className="space-y-2.5">
                {[
                  { emoji: '🔗', text: lang === 'en' ? 'Dashboard stats link directly to filtered views (click any number to jump)' : '仪表盘统计直接链接到过滤视图（点击任何数字跳转）' },
                  { emoji: '📊', text: lang === 'en' ? 'Asset details show warranty status + related maintenance tickets' : '资产详情显示保修状态和相关维护工单' },
                  { emoji: '👤', text: lang === 'en' ? 'Employee cards link to their assigned assets in the Assets page' : '员工卡片链接到资产页面中其分配的资产' },
                  { emoji: '🔧', text: lang === 'en' ? 'Maintenance tickets link back to the specific asset being serviced' : '维护工单链接回到正在服务的具体资产' },
                  { emoji: '🔔', text: lang === 'en' ? 'Notifications bell shows live warranty + maintenance alerts (clickable)' : '通知铃显示实时保修和维护提醒（可点击）' },
                  { emoji: '🔍', text: lang === 'en' ? 'Global search routes to the correct page based on keyword context' : '全局搜索根据关键词上下文路由到正确页面' },
                  { emoji: '📱', text: lang === 'en' ? 'Barcode scanner on Assets page finds assets instantly by code' : '资产页面的条码扫描器通过代码即时查找资产' },
                  { emoji: '📧', text: lang === 'en' ? 'SMTP/WhatsApp in Settings powers warranty alert delivery' : '设置中的SMTP/WhatsApp驱动保修提醒发送' },
                ].map((item, i) => (
                  <motion.div key={i} className="flex items-start gap-2 text-xs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.04 }}>
                    <span className="text-sm flex-shrink-0">{item.emoji}</span>
                    <span className="text-white/60 leading-relaxed">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </MainLayout>
  );
}
