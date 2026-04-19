'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, Search, Edit, Trash2, X, FileText, Calendar,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertTriangle, Sparkles,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { useSearchParams, useRouter } from 'next/navigation';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  type: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  items: string | null;
  notes: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  customer: { companyName: string; uen: string | null };
}

interface Customer {
  id: string;
  companyName: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const typeColors: Record<string, string> = {
  invoice: 'from-blue-500 to-blue-600',
  quotation: 'from-amber-500 to-amber-600',
  'credit-note': 'from-rose-500 to-rose-600',
};

export default function FinancePage() {
  const { lang } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [form, setForm] = useState({
    invoiceNumber: '', customerId: '', type: 'invoice', status: 'draft',
    issueDate: new Date().toISOString().slice(0, 10), dueDate: '',
    subtotal: '', gstRate: '9', currency: 'SGD', notes: '',
    paymentMethod: '', items: '[]',
  });

  const [lineItems, setLineItems] = useState<{ description: string; qty: number; unitPrice: number }[]>([
    { description: '', qty: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    const custId = searchParams.get('customer');
    if (custId) {
      setForm(f => ({ ...f, customerId: custId }));
    }
    const action = searchParams.get('action');
    if (action === 'add') setShowModal(true);
  }, [searchParams]);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch { /* empty */ }
  };

  const generateInvoiceNumber = () => {
    const prefix = form.type === 'quotation' ? 'QUO' : form.type === 'credit-note' ? 'CN' : 'INV';
    const year = new Date().getFullYear();
    const seq = String(invoices.length + 1).padStart(3, '0');
    return `${prefix}-${year}-${seq}`;
  };

  const calcSubtotal = () => lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const handleSubmit = async () => {
    const subtotal = calcSubtotal();
    const payload = {
      invoiceNumber: form.invoiceNumber || generateInvoiceNumber(),
      customerId: form.customerId,
      type: form.type, status: form.status,
      issueDate: new Date(form.issueDate).toISOString(),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      subtotal,
      gstRate: parseFloat(form.gstRate) || 9,
      currency: form.currency,
      items: JSON.stringify(lineItems.filter(l => l.description)),
      notes: form.notes || null,
      paymentMethod: form.paymentMethod || null,
    };
    try {
      if (editingInvoice) {
        await fetch(`/api/invoices/${editingInvoice.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      fetchInvoices();
    } catch { /* empty */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      fetchInvoices();
    } catch { /* empty */ }
  };

  const resetForm = () => {
    setForm({ invoiceNumber: '', customerId: '', type: 'invoice', status: 'draft', issueDate: new Date().toISOString().slice(0, 10), dueDate: '', subtotal: '', gstRate: '9', currency: 'SGD', notes: '', paymentMethod: '', items: '[]' });
    setLineItems([{ description: '', qty: 1, unitPrice: 0 }]);
  };

  const openEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setForm({
      invoiceNumber: inv.invoiceNumber, customerId: inv.customerId, type: inv.type, status: inv.status,
      issueDate: new Date(inv.issueDate).toISOString().slice(0, 10),
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '',
      subtotal: inv.subtotal.toString(), gstRate: inv.gstRate.toString(), currency: inv.currency,
      notes: inv.notes || '', paymentMethod: inv.paymentMethod || '',
      items: inv.items || '[]',
    });
    try {
      const parsed = JSON.parse(inv.items || '[]');
      setLineItems(parsed.length > 0 ? parsed : [{ description: '', qty: 1, unitPrice: 0 }]);
    } catch { setLineItems([{ description: '', qty: 1, unitPrice: 0 }]); }
    setShowModal(true);
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = !searchQuery || inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || inv.customer.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const subtotalCalc = calcSubtotal();
  const gstCalc = subtotalCalc * (parseFloat(form.gstRate) || 9) / 100;

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-emerald-400" />
              {lang === 'en' ? 'Finance & Invoicing' : '财务与发票'}
            </h1>
            <p className="text-white/50 text-sm mt-1">{lang === 'en' ? 'Manage invoices, quotations and payments' : '管理发票、报价单和付款'}</p>
          </div>
          <motion.button onClick={() => { resetForm(); setEditingInvoice(null); setShowModal(true); }} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Plus className="w-4 h-4" /> {lang === 'en' ? 'Create Invoice' : '创建发票'}
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === 'en' ? 'Total Revenue' : '总收入', value: `$${totalRevenue.toLocaleString()}`, color: 'from-emerald-500 to-emerald-600', icon: ArrowUpRight },
            { label: lang === 'en' ? 'Outstanding' : '待收款', value: `$${totalOutstanding.toLocaleString()}`, color: 'from-blue-500 to-blue-600', icon: Clock },
            { label: lang === 'en' ? 'Overdue' : '逾期', value: overdueCount, color: 'from-red-500 to-red-600', icon: AlertTriangle },
            { label: lang === 'en' ? 'Invoices' : '发票数', value: invoices.length, color: 'from-violet-500 to-violet-600', icon: FileText },
          ].map((s, i) => (
            <motion.div key={s.label} className="glass-card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-white/40 text-[10px]">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={lang === 'en' ? 'Search invoices...' : '搜索发票...'} className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-1.5">
            {['all', 'draft', 'sent', 'paid', 'overdue'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? 'bg-white/15 text-white border border-white/20' : 'text-white/40 hover:text-white/60 border border-transparent'}`}>
                {s === 'all' ? (lang === 'en' ? 'All' : '全部') : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass-card p-5 h-20 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inv, i) => (
              <motion.div key={inv.id} className="glass-card glass-card-hover p-4 flex items-center gap-4 group cursor-pointer" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[inv.type] || typeColors.invoice} flex items-center justify-center flex-shrink-0`}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-medium text-sm">{inv.invoiceNumber}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] border flex-shrink-0 ${statusColors[inv.status]}`}>{inv.status}</span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] border border-white/10 text-white/30 capitalize">{inv.type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-white/40">
                    <span className="cursor-pointer hover:text-violet-400" onClick={() => router.push(`/customers?search=${encodeURIComponent(inv.customer.companyName)}`)}>{inv.customer.companyName}</span>
                    <span>• <Calendar className="w-2.5 h-2.5 inline" /> {new Date(inv.issueDate).toLocaleDateString()}</span>
                    {inv.dueDate && <span>• Due: {new Date(inv.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-white/30 text-[10px]">GST: {inv.gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="glass-card p-12 text-center">
                <DollarSign className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">{lang === 'en' ? 'No invoices found' : '未找到发票'}</p>
              </div>
            )}
          </div>
        )}

        {/* GST Info */}
        <motion.div className="glass-card p-4 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-300 text-xs font-medium">{lang === 'en' ? 'Singapore GST Notice' : '新加坡消费税通知'}</p>
            <p className="text-white/40 text-[10px]">{lang === 'en' ? 'Current GST rate is 9%. All invoices auto-calculate GST. Ensure your company is GST-registered with IRAS if annual taxable turnover exceeds S$1 million.' : '当前消费税税率为9%。所有发票自动计算消费税。如年应税营业额超过100万新元，请确保您的公司已在IRAS注册消费税。'}</p>
          </div>
        </motion.div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowModal(false); setEditingInvoice(null); }}>
              <motion.div className="glass-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold text-lg">{editingInvoice ? (lang === 'en' ? 'Edit Invoice' : '编辑发票') : (lang === 'en' ? 'Create Invoice' : '创建发票')}</h2>
                  <button onClick={() => { setShowModal(false); setEditingInvoice(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Invoice Number' : '发票编号'}</label>
                    <input type="text" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} placeholder={generateInvoiceNumber()} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Customer *' : '客户 *'}</label>
                    <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Type' : '类型'}</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="invoice">{lang === 'en' ? 'Invoice' : '发票'}</option>
                      <option value="quotation">{lang === 'en' ? 'Quotation' : '报价单'}</option>
                      <option value="credit-note">{lang === 'en' ? 'Credit Note' : '贷项通知'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Issue Date' : '开具日期'}</label>
                    <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Due Date' : '到期日'}</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Status' : '状态'}</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="draft">{lang === 'en' ? 'Draft' : '草稿'}</option>
                      <option value="sent">{lang === 'en' ? 'Sent' : '已发送'}</option>
                      <option value="paid">{lang === 'en' ? 'Paid' : '已付款'}</option>
                      <option value="overdue">{lang === 'en' ? 'Overdue' : '逾期'}</option>
                    </select>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white/40 text-[10px] font-medium">{lang === 'en' ? 'LINE ITEMS' : '明细项目'}</label>
                    <button onClick={() => setLineItems([...lineItems, { description: '', qty: 1, unitPrice: 0 }])} className="text-blue-400 text-[10px] hover:text-blue-300">+ {lang === 'en' ? 'Add Row' : '添加行'}</button>
                  </div>
                  <div className="space-y-2">
                    {lineItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input type="text" value={item.description} onChange={e => { const n = [...lineItems]; n[idx].description = e.target.value; setLineItems(n); }} placeholder={lang === 'en' ? 'Description' : '描述'} className="glass-input flex-1 px-3 py-2 text-sm" />
                        <input type="number" value={item.qty} onChange={e => { const n = [...lineItems]; n[idx].qty = parseInt(e.target.value) || 0; setLineItems(n); }} className="glass-input w-16 px-2 py-2 text-sm text-center" min={1} />
                        <input type="number" value={item.unitPrice} onChange={e => { const n = [...lineItems]; n[idx].unitPrice = parseFloat(e.target.value) || 0; setLineItems(n); }} className="glass-input w-28 px-2 py-2 text-sm text-right" step="0.01" />
                        <span className="text-white/60 text-xs w-24 text-right">{(item.qty * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        {lineItems.length > 1 && <button onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))} className="p-1 text-white/20 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">{lang === 'en' ? 'Subtotal' : '小计'}</span>
                    <span className="text-white">{form.currency} {subtotalCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">GST ({form.gstRate}%)</span>
                    <span className="text-white">{form.currency} {gstCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-white/10">
                    <span className="text-white">{lang === 'en' ? 'Total' : '总计'}</span>
                    <span className="text-emerald-400">{form.currency} {(subtotalCalc + gstCalc).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Payment Method' : '支付方式'}</label>
                    <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      <option value="bank-transfer">Bank Transfer</option>
                      <option value="paynow">PayNow</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                      <option value="credit-card">Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] mb-1 block">GST Rate (%)</label>
                    <input type="number" value={form.gstRate} onChange={e => setForm(f => ({ ...f, gstRate: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" step="0.1" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-white/40 text-[10px] mb-1 block">{lang === 'en' ? 'Notes' : '备注'}</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="glass-input w-full px-3 py-2 text-sm" rows={2} placeholder={lang === 'en' ? 'Payment terms, bank details, etc.' : '付款条件、银行信息等'} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => { setShowModal(false); setEditingInvoice(null); }} className="px-4 py-2 text-white/50 hover:text-white text-sm">{lang === 'en' ? 'Cancel' : '取消'}</button>
                  <motion.button onClick={handleSubmit} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    {editingInvoice ? (lang === 'en' ? 'Update' : '更新') : (lang === 'en' ? 'Create' : '创建')}
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
