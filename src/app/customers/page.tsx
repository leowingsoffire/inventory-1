'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Search, Edit, Trash2, X, Eye, Globe, Phone, Mail,
  MapPin, FileText, Sparkles, ExternalLink, Calendar, DollarSign, Star,
  ArrowRight, Hash,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { FeatureGuide, MODULE_GUIDES } from '@/components/FeatureGuide';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Customer {
  id: string;
  companyName: string;
  uen: string | null;
  address: string | null;
  postalCode: string | null;
  country: string;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  contractType: string | null;
  contractValue: number | null;
  contractStart: string | null;
  contractEnd: string | null;
  status: string;
  notes: string | null;
  gstRegistered: boolean;
  gstNumber: string | null;
  paymentTerms: number;
  creditLimit: number | null;
  createdAt: string;
  _count?: { invoices: number; crmActivities: number };
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  prospect: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const contractTypeLabels: Record<string, { en: string; zh: string }> = {
  retainer: { en: 'Retainer', zh: '月费' },
  project: { en: 'Project', zh: '项目' },
  'ad-hoc': { en: 'Ad-Hoc', zh: '临时' },
};

// AI company detection - Singapore business registry patterns
function aiDetectCompany(name: string): Partial<Customer> {
  const lower = name.toLowerCase();
  const suggestions: Partial<Customer> = {};
  if (lower.includes('pte') || lower.includes('ltd')) {
    suggestions.country = 'Singapore';
    suggestions.gstRegistered = true;
  }
  if (lower.includes('trading') || lower.includes('import') || lower.includes('export')) suggestions.industry = 'Trading & Distribution';
  else if (lower.includes('tech') || lower.includes('software') || lower.includes('digital')) suggestions.industry = 'Technology';
  else if (lower.includes('food') || lower.includes('f&b') || lower.includes('restaurant') || lower.includes('cafe')) suggestions.industry = 'Food & Beverage';
  else if (lower.includes('logistics') || lower.includes('transport') || lower.includes('shipping')) suggestions.industry = 'Logistics';
  else if (lower.includes('construction') || lower.includes('building')) suggestions.industry = 'Construction';
  else if (lower.includes('media') || lower.includes('creative') || lower.includes('design')) suggestions.industry = 'Media & Creative';
  else if (lower.includes('consult')) suggestions.industry = 'Consulting';
  else if (lower.includes('clinic') || lower.includes('medical') || lower.includes('health')) suggestions.industry = 'Healthcare';
  else if (lower.includes('education') || lower.includes('school') || lower.includes('tuition')) suggestions.industry = 'Education';
  else if (lower.includes('engineering') || lower.includes('manufact')) suggestions.industry = 'Engineering';
  else if (lower.includes('property') || lower.includes('real estate') || lower.includes('realty')) suggestions.industry = 'Real Estate';
  else if (lower.includes('legal') || lower.includes('law')) suggestions.industry = 'Legal';
  else if (lower.includes('retail') || lower.includes('shop') || lower.includes('store')) suggestions.industry = 'Retail';
  return suggestions;
}

export default function CustomersPage() {
  const { lang } = useApp();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Partial<Customer>>({});
  const [showAiHint, setShowAiHint] = useState(false);

  const [form, setForm] = useState({
    companyName: '', uen: '', address: '', postalCode: '', country: 'Singapore',
    contactPerson: '', contactEmail: '', contactPhone: '', website: '',
    industry: '', companySize: '', contractType: '', contractValue: '',
    status: 'active', notes: '', gstRegistered: false, gstNumber: '', paymentTerms: '30', creditLimit: '',
  });

  useEffect(() => {
    fetchCustomers();
    const action = searchParams.get('action');
    if (action === 'add') setShowModal(true);
    const search = searchParams.get('search');
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const handleCompanyNameChange = (name: string) => {
    setForm(f => ({ ...f, companyName: name }));
    if (name.length >= 3) {
      const detected = aiDetectCompany(name);
      if (Object.keys(detected).length > 0) {
        setAiSuggestions(detected);
        setShowAiHint(true);
      }
    } else {
      setShowAiHint(false);
    }
  };

  const applyAiSuggestions = () => {
    setForm(f => ({
      ...f,
      ...(aiSuggestions.industry && !f.industry ? { industry: aiSuggestions.industry } : {}),
      ...(aiSuggestions.country ? { country: aiSuggestions.country } : {}),
      ...(aiSuggestions.gstRegistered !== undefined ? { gstRegistered: aiSuggestions.gstRegistered } : {}),
    }));
    setShowAiHint(false);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      contractValue: form.contractValue ? parseFloat(form.contractValue) : null,
      paymentTerms: parseInt(form.paymentTerms) || 30,
      creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : null,
      uen: form.uen || null,
      website: form.website || null,
    };
    try {
      if (editingCustomer) {
        await fetch(`/api/customers/${editingCustomer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch { /* empty */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      fetchCustomers();
      setShowDetail(null);
    } catch { /* empty */ }
  };

  const resetForm = () => {
    setForm({ companyName: '', uen: '', address: '', postalCode: '', country: 'Singapore', contactPerson: '', contactEmail: '', contactPhone: '', website: '', industry: '', companySize: '', contractType: '', contractValue: '', status: 'active', notes: '', gstRegistered: false, gstNumber: '', paymentTerms: '30', creditLimit: '' });
    setShowAiHint(false);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      companyName: c.companyName, uen: c.uen || '', address: c.address || '', postalCode: c.postalCode || '',
      country: c.country, contactPerson: c.contactPerson || '', contactEmail: c.contactEmail || '',
      contactPhone: c.contactPhone || '', website: c.website || '', industry: c.industry || '',
      companySize: c.companySize || '', contractType: c.contractType || '',
      contractValue: c.contractValue?.toString() || '', status: c.status, notes: c.notes || '',
      gstRegistered: c.gstRegistered, gstNumber: c.gstNumber || '',
      paymentTerms: c.paymentTerms.toString(), creditLimit: c.creditLimit?.toString() || '',
    });
    setShowModal(true);
  };

  const filtered = customers.filter(c => {
    const matchSearch = !searchQuery || c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || c.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) || c.uen?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
              {lang === 'en' ? 'Customer Management' : '客户管理'}
            </h1>
            <p className="text-white/50 text-xs sm:text-sm mt-1">{lang === 'en' ? 'Manage your SME clients and contracts' : '管理您的中小企业客户和合同'}</p>
          </div>
          <motion.button onClick={() => { resetForm(); setEditingCustomer(null); setShowModal(true); }} className="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 w-full sm:w-auto justify-center" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Plus className="w-4 h-4" /> {lang === 'en' ? 'Add Customer' : '添加客户'}
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={lang === 'en' ? 'Search by company, contact or UEN...' : '按公司名、联系人或UEN搜索...'} className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-1.5">
            {['all', 'active', 'prospect', 'inactive'].map(st => (
              <button key={st} onClick={() => setStatusFilter(st)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${statusFilter === st ? 'bg-white/15 text-white border border-white/20' : 'text-white/40 hover:text-white/60 border border-transparent'}`}>
                {st === 'all' ? (lang === 'en' ? 'All' : '全部') : st === 'active' ? (lang === 'en' ? 'Active' : '活跃') : st === 'prospect' ? (lang === 'en' ? 'Prospect' : '潜客') : (lang === 'en' ? 'Inactive' : '不活跃')}
              </button>
            ))}
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === 'en' ? 'Total Customers' : '客户总数', value: customers.length, color: 'from-blue-500 to-blue-600' },
            { label: lang === 'en' ? 'Active' : '活跃', value: customers.filter(c => c.status === 'active').length, color: 'from-emerald-500 to-emerald-600' },
            { label: lang === 'en' ? 'Prospects' : '潜客', value: customers.filter(c => c.status === 'prospect').length, color: 'from-violet-500 to-violet-600' },
            { label: lang === 'en' ? 'Contract Value' : '合同总值', value: `$${(customers.reduce((s, c) => s + (c.contractValue || 0), 0) / 1000).toFixed(1)}K`, color: 'from-amber-500 to-amber-600' },
          ].map((s, i) => (
            <motion.div key={s.label} className="glass-card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-white/40 text-[10px]">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Customer Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="glass-card p-5 h-48 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <FeatureGuide {...MODULE_GUIDES.customers} lang={lang} onAction={(a) => { if (a === 'add') { resetForm(); setEditingCustomer(null); setShowModal(true); } }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <motion.div key={c.id} className="glass-card glass-card-hover p-5 cursor-pointer group" onClick={() => setShowDetail(c)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -2 }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {c.companyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{c.companyName}</h3>
                      {c.uen && <p className="text-white/30 text-[10px] flex items-center gap-1"><Hash className="w-2.5 h-2.5" />UEN: {c.uen}</p>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${statusColors[c.status]}`}>{c.status}</span>
                </div>

                {c.contactPerson && <p className="text-white/60 text-xs mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.contactPerson}</p>}
                {c.industry && <p className="text-white/40 text-[10px] mb-2">{c.industry}</p>}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex gap-3 text-[10px]">
                    {c.contractType && <span className="text-white/40">{contractTypeLabels[c.contractType]?.[lang] || c.contractType}</span>}
                    {c.contractValue && <span className="text-emerald-400">${c.contractValue.toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-1.5">
                    <Link href={`/crm?customer=${encodeURIComponent(c.companyName)}`}>
                      <span className="text-white/30 hover:text-white/60 text-[10px] flex items-center gap-0.5">CRM <ExternalLink className="w-2.5 h-2.5" /></span>
                    </Link>
                    <Link href={`/finance?customer=${encodeURIComponent(c.companyName)}`}>
                      <span className="text-white/30 hover:text-white/60 text-[10px] flex items-center gap-0.5">{lang === 'en' ? 'Invoices' : '发票'} <ExternalLink className="w-2.5 h-2.5" /></span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetail && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(null)}>
              <motion.div className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">{showDetail.companyName.charAt(0)}</div>
                    <div>
                      <h2 className="text-white font-bold text-lg">{showDetail.companyName}</h2>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${statusColors[showDetail.status]}`}>{showDetail.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { openEdit(showDetail); setShowDetail(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(showDetail.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={() => setShowDetail(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-3">
                  {showDetail.uen && <div className="flex items-center gap-2 text-xs"><Hash className="w-3.5 h-3.5 text-white/30" /><span className="text-white/40">UEN/BRN:</span><span className="text-white">{showDetail.uen}</span></div>}
                  {showDetail.contactPerson && <div className="flex items-center gap-2 text-xs"><Mail className="w-3.5 h-3.5 text-white/30" /><span className="text-white/40">Contact:</span><span className="text-white">{showDetail.contactPerson}</span></div>}
                  {showDetail.contactEmail && <div className="flex items-center gap-2 text-xs"><Mail className="w-3.5 h-3.5 text-white/30" /><span className="text-white">{showDetail.contactEmail}</span></div>}
                  {showDetail.contactPhone && <div className="flex items-center gap-2 text-xs"><Phone className="w-3.5 h-3.5 text-white/30" /><span className="text-white">{showDetail.contactPhone}</span></div>}
                  {showDetail.website && <div className="flex items-center gap-2 text-xs"><Globe className="w-3.5 h-3.5 text-white/30" /><span className="text-blue-400">{showDetail.website}</span></div>}
                  {showDetail.address && <div className="flex items-center gap-2 text-xs"><MapPin className="w-3.5 h-3.5 text-white/30" /><span className="text-white">{showDetail.address}{showDetail.postalCode ? `, ${showDetail.postalCode}` : ''}</span></div>}
                  {showDetail.industry && <div className="flex items-center gap-2 text-xs"><Building2 className="w-3.5 h-3.5 text-white/30" /><span className="text-white/40">Industry:</span><span className="text-white">{showDetail.industry}</span></div>}

                  {(showDetail.contractType || showDetail.contractValue) && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 mt-2">
                      <p className="text-white/40 text-[10px] mb-1.5 font-medium">{lang === 'en' ? 'CONTRACT' : '合同'}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {showDetail.contractType && <div><span className="text-white/40">Type: </span><span className="text-white">{contractTypeLabels[showDetail.contractType]?.[lang] || showDetail.contractType}</span></div>}
                        {showDetail.contractValue && <div><span className="text-white/40">Value: </span><span className="text-emerald-400">${showDetail.contractValue.toLocaleString()}</span></div>}
                        <div><span className="text-white/40">Payment: </span><span className="text-white">{showDetail.paymentTerms} days</span></div>
                        {showDetail.gstRegistered && <div><span className="text-white/40">GST: </span><span className="text-white">{showDetail.gstNumber || 'Registered'}</span></div>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Link href={`/crm?customer=${encodeURIComponent(showDetail.companyName)}`} className="flex-1">
                      <motion.div className="glass-card p-3 text-center cursor-pointer hover:bg-white/10 transition-all" whileHover={{ scale: 1.02 }}>
                        <FileText className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                        <p className="text-white text-[10px]">{lang === 'en' ? 'CRM Activities' : 'CRM活动'}</p>
                        <p className="text-white/40 text-[10px]">{showDetail._count?.crmActivities || 0} {lang === 'en' ? 'records' : '记录'}</p>
                      </motion.div>
                    </Link>
                    <Link href={`/finance?customer=${encodeURIComponent(showDetail.companyName)}`} className="flex-1">
                      <motion.div className="glass-card p-3 text-center cursor-pointer hover:bg-white/10 transition-all" whileHover={{ scale: 1.02 }}>
                        <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-white text-[10px]">{lang === 'en' ? 'Invoices' : '发票'}</p>
                        <p className="text-white/40 text-[10px]">{showDetail._count?.invoices || 0} {lang === 'en' ? 'records' : '记录'}</p>
                      </motion.div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowModal(false); setEditingCustomer(null); }}>
              <motion.div className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold text-lg">{editingCustomer ? (lang === 'en' ? 'Edit Customer' : '编辑客户') : (lang === 'en' ? 'Add Customer' : '添加客户')}</h2>
                  <button onClick={() => { setShowModal(false); setEditingCustomer(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                {/* AI Suggestion Banner */}
                <AnimatePresence>
                  {showAiHint && (
                    <motion.div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          <div>
                            <p className="text-violet-300 text-xs font-medium">{lang === 'en' ? 'AI Detected' : 'AI 检测到'}</p>
                            <p className="text-violet-300/60 text-[10px]">
                              {aiSuggestions.industry && `Industry: ${aiSuggestions.industry}`}
                              {aiSuggestions.gstRegistered && ' • GST Registered'}
                            </p>
                          </div>
                        </div>
                        <button onClick={applyAiSuggestions} className="px-3 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg text-[10px] font-medium flex items-center gap-1">
                          {lang === 'en' ? 'Apply' : '应用'} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Company Name *' : '公司名称 *'}</label>
                    <input type="text" value={form.companyName} onChange={e => handleCompanyNameChange(e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="Acme Pte Ltd" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'UEN / BRN Number' : 'UEN / BRN 号码'}</label>
                    <input type="text" value={form.uen} onChange={e => setForm(f => ({ ...f, uen: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder="202312345A" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Industry' : '行业'}</label>
                    <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      {['Technology', 'Trading & Distribution', 'Food & Beverage', 'Logistics', 'Engineering', 'Media & Creative', 'Healthcare', 'Education', 'Consulting', 'Real Estate', 'Construction', 'Retail', 'Legal', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Contact Person' : '联系人'}</label>
                    <input type="text" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Contact Email' : '联系邮箱'}</label>
                    <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Phone' : '电话'}</label>
                    <input type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder="+65" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Website' : '网站'}</label>
                    <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Address' : '地址'}</label>
                    <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Postal Code' : '邮编'}</label>
                    <input type="text" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Company Size' : '公司规模'}</label>
                    <select value={form.companySize} onChange={e => setForm(f => ({ ...f, companySize: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      {['1-5', '5-10', '10-20', '20-50', '50-100', '100-200', '200+'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Contract Type' : '合同类型'}</label>
                    <select value={form.contractType} onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      <option value="retainer">{lang === 'en' ? 'Retainer' : '月费'}</option>
                      <option value="project">{lang === 'en' ? 'Project' : '项目'}</option>
                      <option value="ad-hoc">{lang === 'en' ? 'Ad-Hoc' : '临时'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Contract Value (SGD)' : '合同金额 (新元)'}</label>
                    <input type="number" value={form.contractValue} onChange={e => setForm(f => ({ ...f, contractValue: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Payment Terms (days)' : '付款期限（天）'}</label>
                    <input type="number" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Status' : '状态'}</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="active">{lang === 'en' ? 'Active' : '活跃'}</option>
                      <option value="prospect">{lang === 'en' ? 'Prospect' : '潜客'}</option>
                      <option value="inactive">{lang === 'en' ? 'Inactive' : '不活跃'}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.gstRegistered} onChange={e => setForm(f => ({ ...f, gstRegistered: e.target.checked }))} className="w-4 h-4 rounded border-white/20 bg-white/5" />
                      <span className="text-white/60 text-xs">{lang === 'en' ? 'GST Registered' : 'GST已注册'}</span>
                    </label>
                  </div>
                  {form.gstRegistered && (
                    <div>
                      <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'GST Number' : 'GST号码'}</label>
                      <input type="text" value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder="M90012345A" />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Notes' : '备注'}</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" rows={2} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => { setShowModal(false); setEditingCustomer(null); }} className="px-4 py-2 text-white/50 hover:text-white text-sm">{lang === 'en' ? 'Cancel' : '取消'}</button>
                  <motion.button onClick={handleSubmit} className="px-5 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    {editingCustomer ? (lang === 'en' ? 'Update' : '更新') : (lang === 'en' ? 'Create' : '创建')}
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
