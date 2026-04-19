'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Clock, Search,
  ChevronDown, ChevronUp, Edit, Save, X, FileText, Users,
  Lock, Eye, Trash2, Globe, Phone, BarChart3, Filter,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface Assessment {
  id: string;
  category: string;
  controlRef: string;
  controlTitle: string;
  description: string | null;
  status: string;
  evidence: string | null;
  responsiblePerson: string | null;
  reviewDate: string | null;
  nextReviewDate: string | null;
  notes: string | null;
  riskLevel: string;
}

const statusOptions = [
  { value: 'not-started', label: 'Not Started', labelZh: '未开始' },
  { value: 'in-progress', label: 'In Progress', labelZh: '进行中' },
  { value: 'compliant', label: 'Compliant', labelZh: '合规' },
  { value: 'non-compliant', label: 'Non-Compliant', labelZh: '不合规' },
  { value: 'partial', label: 'Partial', labelZh: '部分合规' },
];

const riskOptions = [
  { value: 'low', label: 'Low', labelZh: '低' },
  { value: 'medium', label: 'Medium', labelZh: '中' },
  { value: 'high', label: 'High', labelZh: '高' },
];

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'compliant': { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  'non-compliant': { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  'in-progress': { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  'partial': { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
  'not-started': { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30' },
};

const categoryIcons: Record<string, React.ElementType> = {
  'Governance': Shield,
  'Consent': Users,
  'Purpose Limitation': FileText,
  'Notification': Globe,
  'Access & Correction': Eye,
  'Accuracy': CheckCircle,
  'Protection': Lock,
  'Retention': Trash2,
  'Transfer': Globe,
  'Do Not Call': Phone,
};

export default function CompliancePage() {
  const { lang } = useApp();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Assessment>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAssessments(); }, []);

  const fetchAssessments = async () => {
    try {
      const res = await fetch('/api/compliance');
      if (res.ok) setAssessments(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleEdit = (item: Assessment) => {
    setEditingId(item.id);
    setEditForm({
      status: item.status,
      evidence: item.evidence || '',
      responsiblePerson: item.responsiblePerson || '',
      reviewDate: item.reviewDate ? item.reviewDate.slice(0, 10) : '',
      nextReviewDate: item.nextReviewDate ? item.nextReviewDate.slice(0, 10) : '',
      notes: item.notes || '',
      riskLevel: item.riskLevel,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAssessments(prev => prev.map(a => a.id === updated.id ? updated : a));
        setEditingId(null);
      }
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Compute stats
  const total = assessments.length;
  const compliant = assessments.filter(a => a.status === 'compliant').length;
  const nonCompliant = assessments.filter(a => a.status === 'non-compliant').length;
  const inProgress = assessments.filter(a => a.status === 'in-progress' || a.status === 'partial').length;
  const notStarted = assessments.filter(a => a.status === 'not-started').length;
  const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

  // Group by category
  const categories = [...new Set(assessments.map(a => a.category))];
  const filtered = assessments.filter(a => {
    const matchSearch = !searchQuery || a.controlTitle.toLowerCase().includes(searchQuery.toLowerCase()) || a.controlRef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || a.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });
  const groupedFiltered: Record<string, Assessment[]> = {};
  filtered.forEach(a => {
    if (!groupedFiltered[a.category]) groupedFiltered[a.category] = [];
    groupedFiltered[a.category]!.push(a);
  });

  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreRing = score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500';

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-accent-400" />
              {lang === 'en' ? 'PDPA Compliance' : 'PDPA 合规管理'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Personal Data Protection Act (Singapore) — Assessment & Controls' : '个人数据保护法（新加坡）— 评估与控制'}
            </p>
          </div>
        </div>

        {/* Score Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Score Ring */}
          <div className="glass-card p-4 col-span-2 md:col-span-1 flex flex-col items-center justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" className={scoreRing} strokeWidth="6"
                  strokeDasharray={`${(score / 100) * 213.6} 213.6`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${scoreColor}`}>{score}%</span>
              </div>
            </div>
            <p className="text-white/50 text-xs mt-2">{lang === 'en' ? 'Compliance Score' : '合规评分'}</p>
          </div>
          {[
            { label: lang === 'en' ? 'Total Controls' : '控制总数', value: total, color: 'from-accent-500 to-accent-600' },
            { label: lang === 'en' ? 'Compliant' : '合规', value: compliant, color: 'from-emerald-500 to-green-600' },
            { label: lang === 'en' ? 'Non-Compliant' : '不合规', value: nonCompliant, color: 'from-red-500 to-rose-600' },
            { label: lang === 'en' ? 'In Progress' : '进行中', value: inProgress, color: 'from-amber-500 to-orange-600' },
            { label: lang === 'en' ? 'Not Started' : '未开始', value: notStarted, color: 'from-gray-500 to-gray-600' },
          ].map((stat, i) => (
            <motion.div key={i} className="glass-card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-white/50 text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'en' ? 'Search controls...' : '搜索控制项...'}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent-500/50"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500/50 appearance-none cursor-pointer"
            >
              <option value="all">{lang === 'en' ? 'All Categories' : '全部类别'}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500/50 appearance-none cursor-pointer"
            >
              <option value="all">{lang === 'en' ? 'All Status' : '全部状态'}</option>
              {statusOptions.map(s => <option key={s.value} value={s.value}>{lang === 'en' ? s.label : s.labelZh}</option>)}
            </select>
          </div>
        </div>

        {/* Assessment Controls by Category */}
        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="animate-pulse text-white/50">{lang === 'en' ? 'Loading assessments...' : '加载评估中...'}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedFiltered).map(([category, items]) => {
              const CatIcon = categoryIcons[category] || Shield;
              const catCompliant = items.filter(i => i.status === 'compliant').length;
              const isExpanded = expandedCategories.includes(category);
              return (
                <motion.div key={category} className="glass-card overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent-500/20 flex items-center justify-center">
                        <CatIcon className="w-4.5 h-4.5 text-accent-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{category}</h3>
                        <p className="text-white/40 text-xs">{catCompliant}/{items.length} {lang === 'en' ? 'compliant' : '合规'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Mini progress bar */}
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${items.length > 0 ? (catCompliant / items.length) * 100 : 0}%` }} />
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                  </button>

                  {/* Controls List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        {items.map((item) => {
                          const cfg = statusConfig[item.status] || statusConfig['not-started']!;
                          const StatusIcon = cfg.icon;
                          const isEditing = editingId === item.id;
                          return (
                            <div key={item.id} className="border-b border-white/5 last:border-b-0">
                              <div className="p-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                  {/* Status Icon */}
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <StatusIcon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-accent-400 text-xs font-mono">{item.controlRef}</span>
                                        <span className="text-white font-medium text-sm">{item.controlTitle}</span>
                                      </div>
                                      {item.description && <p className="text-white/40 text-xs mt-0.5">{item.description}</p>}
                                    </div>
                                  </div>
                                  {/* Badges + Edit */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${cfg.bg}`}>
                                      {lang === 'en'
                                        ? statusOptions.find(s => s.value === item.status)?.label
                                        : statusOptions.find(s => s.value === item.status)?.labelZh}
                                    </span>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${
                                      item.riskLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                      item.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    }`}>
                                      {lang === 'en' ? item.riskLevel : riskOptions.find(r => r.value === item.riskLevel)?.labelZh}
                                    </span>
                                    {!isEditing && (
                                      <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Inline Edit Form */}
                                <AnimatePresence>
                                  {isEditing && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="mt-3 pt-3 border-t border-white/10"
                                    >
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <div>
                                          <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Status' : '状态'}</label>
                                          <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500/50">
                                            {statusOptions.map(s => <option key={s.value} value={s.value}>{lang === 'en' ? s.label : s.labelZh}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Risk Level' : '风险等级'}</label>
                                          <select value={editForm.riskLevel} onChange={e => setEditForm(f => ({ ...f, riskLevel: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500/50">
                                            {riskOptions.map(r => <option key={r.value} value={r.value}>{lang === 'en' ? r.label : r.labelZh}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Responsible Person' : '负责人'}</label>
                                          <input type="text" value={editForm.responsiblePerson || ''} onChange={e => setEditForm(f => ({ ...f, responsiblePerson: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500/50"
                                            placeholder={lang === 'en' ? 'Name' : '姓名'} />
                                        </div>
                                        <div>
                                          <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Review Date' : '审核日期'}</label>
                                          <input type="date" value={editForm.reviewDate || ''} onChange={e => setEditForm(f => ({ ...f, reviewDate: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500/50" />
                                        </div>
                                        <div>
                                          <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Next Review' : '下次审核'}</label>
                                          <input type="date" value={editForm.nextReviewDate || ''} onChange={e => setEditForm(f => ({ ...f, nextReviewDate: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500/50" />
                                        </div>
                                      </div>
                                      <div className="mt-3">
                                        <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Evidence / Documentation' : '证据/文档'}</label>
                                        <textarea value={editForm.evidence || ''} onChange={e => setEditForm(f => ({ ...f, evidence: e.target.value }))}
                                          rows={2} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500/50 resize-none"
                                          placeholder={lang === 'en' ? 'Describe evidence of compliance...' : '描述合规证据...'} />
                                      </div>
                                      <div className="mt-2">
                                        <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Notes' : '备注'}</label>
                                        <textarea value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                          rows={2} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500/50 resize-none" />
                                      </div>
                                      <div className="flex justify-end gap-2 mt-3">
                                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 text-xs transition-colors flex items-center gap-1">
                                          <X className="w-3 h-3" /> {lang === 'en' ? 'Cancel' : '取消'}
                                        </button>
                                        <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 rounded-lg text-white text-xs transition-colors flex items-center gap-1 disabled:opacity-50">
                                          <Save className="w-3 h-3" /> {saving ? (lang === 'en' ? 'Saving...' : '保存中...') : (lang === 'en' ? 'Save' : '保存')}
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Show evidence/person if they exist */}
                                {!isEditing && (item.responsiblePerson || item.evidence) && (
                                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                                    {item.responsiblePerson && (
                                      <span className="text-white/30"><Users className="w-3 h-3 inline mr-1" />{item.responsiblePerson}</span>
                                    )}
                                    {item.evidence && (
                                      <span className="text-white/30 truncate max-w-xs"><FileText className="w-3 h-3 inline mr-1" />{item.evidence}</span>
                                    )}
                                    {item.reviewDate && (
                                      <span className="text-white/30"><Clock className="w-3 h-3 inline mr-1" />{new Date(item.reviewDate).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* PDPA Info Footer */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-400" />
            {lang === 'en' ? 'About Singapore PDPA' : '关于新加坡PDPA'}
          </h3>
          <div className="text-white/50 text-xs space-y-1.5 leading-relaxed">
            <p>{lang === 'en'
              ? 'The Personal Data Protection Act 2012 (PDPA) governs the collection, use, disclosure, and care of personal data in Singapore. Organizations must comply with various obligations including consent, purpose limitation, notification, access & correction, accuracy, protection, retention limitation, transfer limitation, and the Do Not Call provisions.'
              : '2012年个人数据保护法（PDPA）规管新加坡个人数据的收集、使用、披露和保管。组织必须遵守各种义务，包括同意、目的限制、通知、访问和更正、准确性、保护、保留限制、转移限制和勿来电条款。'}</p>
            <p>{lang === 'en'
              ? 'Enforcement: The Personal Data Protection Commission (PDPC) may impose financial penalties up to S$1 million for breaches. Organizations are required to notify PDPC of significant data breaches within 3 calendar days.'
              : '执行：个人数据保护委员会（PDPC）可对违规行为处以最高100万新元罚款。组织须在3个日历日内将重大数据泄露通知PDPC。'}</p>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
}
