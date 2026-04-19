'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Plus, Search, Edit, Trash2, X, Globe, Phone, Mail,
  MapPin, Star, Hash, Sparkles, ArrowRight,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { useSearchParams } from 'next/navigation';

interface Vendor {
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
  category: string | null;
  rating: number | null;
  status: string;
  paymentTerms: number;
  notes: string | null;
  gstRegistered: boolean;
  gstNumber: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const categoryIcons: Record<string, string> = {
  hardware: 'from-blue-500 to-cyan-500',
  software: 'from-violet-500 to-purple-500',
  services: 'from-emerald-500 to-teal-500',
  telecom: 'from-amber-500 to-orange-500',
};

function aiDetectVendor(name: string): Partial<Vendor> {
  const lower = name.toLowerCase();
  const s: Partial<Vendor> = {};
  if (lower.includes('pte') || lower.includes('ltd')) {
    s.country = 'Singapore';
    s.gstRegistered = true;
  }
  if (lower.includes('dell') || lower.includes('hp') || lower.includes('lenovo') || lower.includes('cisco') || lower.includes('asus')) s.category = 'hardware';
  else if (lower.includes('microsoft') || lower.includes('adobe') || lower.includes('oracle') || lower.includes('sap') || lower.includes('vmware')) s.category = 'software';
  else if (lower.includes('singtel') || lower.includes('starhub') || lower.includes('m1') || lower.includes('telecom')) s.category = 'telecom';
  else if (lower.includes('service') || lower.includes('consult') || lower.includes('solution')) s.category = 'services';
  return s;
}

export default function VendorsPage() {
  const { lang } = useApp();
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Partial<Vendor>>({});
  const [showAiHint, setShowAiHint] = useState(false);

  const [form, setForm] = useState({
    companyName: '', uen: '', address: '', postalCode: '', country: 'Singapore',
    contactPerson: '', contactEmail: '', contactPhone: '', website: '',
    category: '', rating: '3', status: 'active', paymentTerms: '30', notes: '',
    gstRegistered: false, gstNumber: '',
  });

  useEffect(() => {
    fetchVendors();
    const action = searchParams.get('action');
    if (action === 'add') setShowModal(true);
    const search = searchParams.get('search');
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      setVendors(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const handleCompanyNameChange = (name: string) => {
    setForm(f => ({ ...f, companyName: name }));
    if (name.length >= 3) {
      const detected = aiDetectVendor(name);
      if (Object.keys(detected).length > 0) { setAiSuggestions(detected); setShowAiHint(true); }
    } else { setShowAiHint(false); }
  };

  const applyAiSuggestions = () => {
    setForm(f => ({
      ...f,
      ...(aiSuggestions.category && !f.category ? { category: aiSuggestions.category } : {}),
      ...(aiSuggestions.country ? { country: aiSuggestions.country } : {}),
      ...(aiSuggestions.gstRegistered !== undefined ? { gstRegistered: aiSuggestions.gstRegistered } : {}),
    }));
    setShowAiHint(false);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      rating: parseInt(form.rating) || 3,
      paymentTerms: parseInt(form.paymentTerms) || 30,
      uen: form.uen || null,
      website: form.website || null,
    };
    try {
      if (editingVendor) {
        await fetch(`/api/vendors/${editingVendor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setShowModal(false);
      setEditingVendor(null);
      resetForm();
      fetchVendors();
    } catch { /* empty */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      fetchVendors();
      setShowDetail(null);
    } catch { /* empty */ }
  };

  const resetForm = () => {
    setForm({ companyName: '', uen: '', address: '', postalCode: '', country: 'Singapore', contactPerson: '', contactEmail: '', contactPhone: '', website: '', category: '', rating: '3', status: 'active', paymentTerms: '30', notes: '', gstRegistered: false, gstNumber: '' });
    setShowAiHint(false);
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    setForm({
      companyName: v.companyName, uen: v.uen || '', address: v.address || '', postalCode: v.postalCode || '',
      country: v.country, contactPerson: v.contactPerson || '', contactEmail: v.contactEmail || '',
      contactPhone: v.contactPhone || '', website: v.website || '', category: v.category || '',
      rating: (v.rating || 3).toString(), status: v.status, paymentTerms: v.paymentTerms.toString(),
      notes: v.notes || '', gstRegistered: v.gstRegistered, gstNumber: v.gstNumber || '',
    });
    setShowModal(true);
  };

  const filtered = vendors.filter(v => {
    const matchSearch = !searchQuery || v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || v.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) || v.uen?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = catFilter === 'all' || v.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Truck className="w-7 h-7 text-emerald-400" />
              {lang === 'en' ? 'Vendor Management' : '供应商管理'}
            </h1>
            <p className="text-white/50 text-sm mt-1">{lang === 'en' ? 'Manage IT suppliers and service providers' : '管理IT供应商和服务提供商'}</p>
          </div>
          <motion.button onClick={() => { resetForm(); setEditingVendor(null); setShowModal(true); }} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Plus className="w-4 h-4" /> {lang === 'en' ? 'Add Vendor' : '添加供应商'}
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={lang === 'en' ? 'Search vendors...' : '搜索供应商...'} className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-1.5">
            {['all', 'hardware', 'software', 'services', 'telecom'].map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${catFilter === cat ? 'bg-white/15 text-white border border-white/20' : 'text-white/40 hover:text-white/60 border border-transparent'}`}>
                {cat === 'all' ? (lang === 'en' ? 'All' : '全部') : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === 'en' ? 'Total Vendors' : '供应商总数', value: vendors.length, color: 'from-emerald-500 to-emerald-600' },
            { label: lang === 'en' ? 'Hardware' : '硬件', value: vendors.filter(v => v.category === 'hardware').length, color: 'from-blue-500 to-cyan-500' },
            { label: lang === 'en' ? 'Software' : '软件', value: vendors.filter(v => v.category === 'software').length, color: 'from-violet-500 to-purple-500' },
            { label: lang === 'en' ? 'Services' : '服务', value: vendors.filter(v => v.category === 'services').length, color: 'from-amber-500 to-orange-500' },
          ].map((s, i) => (
            <motion.div key={s.label} className="glass-card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                <Truck className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-white/40 text-[10px]">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Vendor Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="glass-card p-5 h-48 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v, i) => (
              <motion.div key={v.id} className="glass-card glass-card-hover p-5 cursor-pointer group" onClick={() => setShowDetail(v)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -2 }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryIcons[v.category || ''] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-bold text-sm`}>
                      {v.companyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{v.companyName}</h3>
                      {v.uen && <p className="text-white/30 text-[10px] flex items-center gap-1"><Hash className="w-2.5 h-2.5" />UEN: {v.uen}</p>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${statusColors[v.status]}`}>{v.status}</span>
                </div>

                {v.contactPerson && <p className="text-white/60 text-xs mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3" />{v.contactPerson}</p>}
                {v.category && <p className="text-white/40 text-[10px] mb-2 capitalize">{v.category}</p>}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= (v.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                    ))}
                  </div>
                  <span className="text-white/30 text-[10px]">{v.paymentTerms}d terms</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetail && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(null)}>
              <motion.div className="glass-card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryIcons[showDetail.category || ''] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-bold text-lg`}>{showDetail.companyName.charAt(0)}</div>
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
                  {showDetail.category && <div className="flex items-center gap-2 text-xs"><Truck className="w-3.5 h-3.5 text-white/30" /><span className="text-white/40">Category:</span><span className="text-white capitalize">{showDetail.category}</span></div>}
                  {showDetail.contactPerson && <div className="flex items-center gap-2 text-xs"><Mail className="w-3.5 h-3.5 text-white/30" /><span className="text-white/40">Contact:</span><span className="text-white">{showDetail.contactPerson}</span></div>}
                  {showDetail.contactEmail && <div className="flex items-center gap-2 text-xs"><Mail className="w-3.5 h-3.5 text-white/30" /><span className="text-white">{showDetail.contactEmail}</span></div>}
                  {showDetail.contactPhone && <div className="flex items-center gap-2 text-xs"><Phone className="w-3.5 h-3.5 text-white/30" /><span className="text-white">{showDetail.contactPhone}</span></div>}
                  {showDetail.website && <div className="flex items-center gap-2 text-xs"><Globe className="w-3.5 h-3.5 text-white/30" /><span className="text-blue-400">{showDetail.website}</span></div>}
                  {showDetail.address && <div className="flex items-center gap-2 text-xs"><MapPin className="w-3.5 h-3.5 text-white/30" /><span className="text-white">{showDetail.address}{showDetail.postalCode ? `, ${showDetail.postalCode}` : ''}</span></div>}

                  <div className="flex items-center gap-2 text-xs">
                    <Star className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-white/40">Rating:</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= (showDetail.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 mt-2">
                    <p className="text-white/40 text-[10px] mb-1.5 font-medium">PAYMENT</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-white/40">Terms: </span><span className="text-white">{showDetail.paymentTerms} days</span></div>
                      {showDetail.gstRegistered && <div><span className="text-white/40">GST: </span><span className="text-white">{showDetail.gstNumber || 'Registered'}</span></div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowModal(false); setEditingVendor(null); }}>
              <motion.div className="glass-card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold text-lg">{editingVendor ? (lang === 'en' ? 'Edit Vendor' : '编辑供应商') : (lang === 'en' ? 'Add Vendor' : '添加供应商')}</h2>
                  <button onClick={() => { setShowModal(false); setEditingVendor(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                {/* AI Suggestion */}
                <AnimatePresence>
                  {showAiHint && (
                    <motion.div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          <div>
                            <p className="text-violet-300 text-xs font-medium">{lang === 'en' ? 'AI Detected' : 'AI 检测到'}</p>
                            <p className="text-violet-300/60 text-[10px]">
                              {aiSuggestions.category && `Category: ${aiSuggestions.category}`}
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
                    <input type="text" value={form.companyName} onChange={e => handleCompanyNameChange(e.target.value)} className="glass-input w-full px-3 py-2 text-sm" placeholder="Dell Technologies Pte Ltd" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">UEN / BRN</label>
                    <input type="text" value={form.uen} onChange={e => setForm(f => ({ ...f, uen: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" placeholder="202312345A" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Category' : '类别'}</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      <option value="hardware">{lang === 'en' ? 'Hardware' : '硬件'}</option>
                      <option value="software">{lang === 'en' ? 'Software' : '软件'}</option>
                      <option value="services">{lang === 'en' ? 'Services' : '服务'}</option>
                      <option value="telecom">{lang === 'en' ? 'Telecom' : '电信'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Contact Person' : '联系人'}</label>
                    <input type="text" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Email' : '邮箱'}</label>
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
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Rating (1-5)' : '评级 (1-5)'}</label>
                    <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      {[1,2,3,4,5].map(r => <option key={r} value={r.toString()}>{r} ★</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Payment Terms (days)' : '付款期限（天）'}</label>
                    <input type="number" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Status' : '状态'}</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="active">{lang === 'en' ? 'Active' : '活跃'}</option>
                      <option value="inactive">{lang === 'en' ? 'Inactive' : '不活跃'}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.gstRegistered} onChange={e => setForm(f => ({ ...f, gstRegistered: e.target.checked }))} className="w-4 h-4 rounded" />
                      <span className="text-white/60 text-xs">GST Registered</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Notes' : '备注'}</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" rows={2} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => { setShowModal(false); setEditingVendor(null); }} className="px-4 py-2 text-white/50 hover:text-white text-sm">{lang === 'en' ? 'Cancel' : '取消'}</button>
                  <motion.button onClick={handleSubmit} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    {editingVendor ? (lang === 'en' ? 'Update' : '更新') : (lang === 'en' ? 'Create' : '创建')}
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
