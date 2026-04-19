'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Edit2, Trash2, Eye, X,
  Monitor, Laptop, Server, Printer, Smartphone, HardDrive,
  ChevronDown, Download, Upload, ScanLine, Shield, Wrench,
  ExternalLink,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import BarcodeScanner from '@/components/BarcodeScanner';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import { FeatureGuide, MODULE_GUIDES } from '@/components/FeatureGuide';
import AIFormAssist from '@/components/AIFormAssist';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: string;
  condition: string;
  location: string;
  purchaseDate: string;
  purchasePrice: number;
  warrantyEnd: string;
  assignedTo: string;
  notes: string;
  ipAddress: string;
  macAddress: string;
}

const sampleAssets: Asset[] = [];

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  desktop: Monitor,
  server: Server,
  printer: Printer,
  phone: Smartphone,
  monitor: Monitor,
  network: HardDrive,
  peripheral: HardDrive,
  software: HardDrive,
  other: HardDrive,
};

const statusColors: Record<string, string> = {
  available: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  assigned: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  maintenance: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  retired: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  disposed: 'bg-red-500/20 text-red-300 border-red-500/30',
};

// Related tickets fetched from API
const relatedTickets: Record<string, { id: string; title: string; status: string; priority: string }[]> = {};

function getWarrantyStatus(warrantyEnd: string): { label: string; color: string; daysLeft: number } {
  if (!warrantyEnd) return { label: 'N/A', color: 'text-white/40', daysLeft: -1 };
  const now = new Date();
  const end = new Date(warrantyEnd);
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Expired', color: 'text-red-400', daysLeft };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'text-red-400', daysLeft };
  if (daysLeft <= 90) return { label: `${daysLeft}d left`, color: 'text-amber-400', daysLeft };
  return { label: `${daysLeft}d left`, color: 'text-emerald-400', daysLeft };
}

export default function AssetsPage() {
  const { lang } = useApp();
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [showScanner, setShowScanner] = useState(false);

  // Fetch assets from API
  useEffect(() => {
    fetch('/api/assets')
      .then(r => r.json())
      .then(data => setAssets(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle URL query params for cross-page navigation
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    const actionParam = searchParams.get('action');
    if (statusParam) setFilterStatus(statusParam);
    if (searchParam) setSearchTerm(searchParam);
    if (actionParam === 'add') openAddModal();
  }, [searchParams]);

  const filteredAssets = assets.filter(asset => {
    const matchSearch = !searchTerm ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'all' || asset.category === filterCategory;
    const matchStatus = filterStatus === 'all' || asset.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const openAddModal = () => {
    setEditingAsset(null);
    setFormData({
      assetTag: `UT-XX-${String(assets.length + 1).padStart(3, '0')}`,
      name: '', category: 'laptop', type: '', brand: '', model: '',
      serialNumber: '', status: 'available', condition: 'good',
      location: '', purchasePrice: 0, assignedTo: '', notes: '',
      ipAddress: '', macAddress: '',
    });
    setShowModal(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({ ...asset });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingAsset) {
      setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...formData } as Asset : a));
    } else {
      const newAsset: Asset = {
        ...formData,
        id: String(Date.now()),
        purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
        warrantyEnd: formData.warrantyEnd || '',
      } as Asset;
      setAssets(prev => [...prev, newAsset]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('asset.title', lang)}</h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? `${filteredAssets.length} assets found` : `找到 ${filteredAssets.length} 项资产`}
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ScanLine className="w-4 h-4" />
              {lang === 'en' ? 'Scan Barcode' : '扫描条码'}
            </motion.button>
            <motion.button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              {t('asset.add', lang)}
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search assets...' : '搜索资产...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="glass-input px-4 py-2.5 text-sm pr-8 appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all" className="bg-gray-800">{t('common.all', lang)} {t('asset.category', lang)}</option>
              <option value="laptop" className="bg-gray-800">{t('cat.laptop', lang)}</option>
              <option value="desktop" className="bg-gray-800">{t('cat.desktop', lang)}</option>
              <option value="server" className="bg-gray-800">{t('cat.server', lang)}</option>
              <option value="printer" className="bg-gray-800">{t('cat.printer', lang)}</option>
              <option value="phone" className="bg-gray-800">{t('cat.phone', lang)}</option>
              <option value="monitor" className="bg-gray-800">{t('cat.monitor', lang)}</option>
              <option value="network" className="bg-gray-800">{t('cat.network', lang)}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-input px-4 py-2.5 text-sm pr-8 appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all" className="bg-gray-800">{t('common.all', lang)} {t('asset.status', lang)}</option>
              <option value="available" className="bg-gray-800">{t('status.available', lang)}</option>
              <option value="assigned" className="bg-gray-800">{t('status.assigned', lang)}</option>
              <option value="maintenance" className="bg-gray-800">{t('status.maintenance', lang)}</option>
              <option value="retired" className="bg-gray-800">{t('status.retired', lang)}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Assets Table */}
        {assets.length === 0 && !loading ? (
          <FeatureGuide {...MODULE_GUIDES.assets} lang={lang} onAction={(a) => { if (a === 'add') openAddModal(); }} />
        ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium uppercase">{t('asset.tag', lang)}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium uppercase">{t('asset.name', lang)}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium uppercase">{t('asset.category', lang)}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium uppercase">{t('asset.status', lang)}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium uppercase">{t('asset.assignedTo', lang)}</th>
                  <th className="text-left py-3 px-4 text-white/50 text-xs font-medium uppercase">{t('asset.location', lang)}</th>
                  <th className="text-right py-3 px-4 text-white/50 text-xs font-medium uppercase">{t('common.actions', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, i) => {
                  const CatIcon = categoryIcons[asset.category] || HardDrive;
                  return (
                    <motion.tr
                      key={asset.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setShowDetail(asset)}
                    >
                      <td className="py-3 px-4">
                        <span className="text-blue-300 text-sm font-mono">{asset.assetTag}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CatIcon className="w-4 h-4 text-white/40" />
                          <div>
                            <p className="text-white text-sm font-medium">{asset.name}</p>
                            <p className="text-white/40 text-xs">{asset.brand} {asset.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white/70 text-sm capitalize">{asset.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColors[asset.status] || ''}`}>
                          {t(`status.${asset.status}`, lang)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white/70 text-sm">{asset.assignedTo || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white/70 text-sm">{asset.location}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setShowDetail(asset)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(asset)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-blue-300 transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(asset.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-300 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Monitor className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">{t('common.noData', lang)}</p>
            </div>
          )}
        </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetail && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(null)} />
              <motion.div
                className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl relative z-10 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{showDetail.name}</h2>
                    <p className="text-blue-300 text-sm font-mono">{showDetail.assetTag}</p>
                  </div>
                  <button onClick={() => setShowDetail(null)} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    [t('asset.brand', lang), showDetail.brand],
                    [t('asset.model', lang), showDetail.model],
                    [t('asset.serial', lang), showDetail.serialNumber],
                    [t('asset.category', lang), showDetail.category],
                    [t('asset.status', lang), t(`status.${showDetail.status}`, lang)],
                    [t('asset.condition', lang), showDetail.condition],
                    [t('asset.location', lang), showDetail.location],
                    [t('asset.purchaseDate', lang), showDetail.purchaseDate],
                    [t('asset.purchasePrice', lang), `SGD $${showDetail.purchasePrice?.toLocaleString()}`],
                    [t('asset.ip', lang), showDetail.ipAddress || '-'],
                    [t('asset.mac', lang), showDetail.macAddress || '-'],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="p-3 rounded-xl bg-white/5">
                      <p className="text-white/40 text-xs mb-1">{label}</p>
                      <p className="text-white text-sm">{value}</p>
                    </div>
                  ))}
                  {/* Assigned To - clickable to employee page */}
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white/40 text-xs mb-1">{t('asset.assignedTo', lang)}</p>
                    {showDetail.assignedTo ? (
                      <Link href={`/employees?search=${encodeURIComponent(showDetail.assignedTo)}`} className="text-blue-300 text-sm hover:text-blue-200 flex items-center gap-1" onClick={() => setShowDetail(null)}>
                        {showDetail.assignedTo}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <p className="text-white text-sm">-</p>
                    )}
                  </div>
                </div>

                {/* Warranty Status */}
                {(() => {
                  const warranty = getWarrantyStatus(showDetail.warrantyEnd);
                  return (
                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-400" />
                          <p className="text-white text-sm font-medium">{lang === 'en' ? 'Warranty Status' : '保修状态'}</p>
                        </div>
                        <Link href="/warranty" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" onClick={() => setShowDetail(null)}>
                          {lang === 'en' ? 'Manage' : '管理'}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white/50 text-xs">{lang === 'en' ? 'Expires:' : '到期:'} {showDetail.warrantyEnd || 'N/A'}</span>
                        <span className={`text-xs font-medium ${warranty.color}`}>{warranty.label}</span>
                      </div>
                      {warranty.daysLeft >= 0 && warranty.daysLeft <= 90 && (
                        <div className="mt-2 w-full bg-white/10 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${warranty.daysLeft <= 30 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(5, Math.min(100, (warranty.daysLeft / 90) * 100))}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Related Maintenance Tickets */}
                {relatedTickets[showDetail.assetTag] && (
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-blue-400" />
                        <p className="text-white text-sm font-medium">{lang === 'en' ? 'Maintenance Tickets' : '维护工单'}</p>
                      </div>
                      <Link href={`/maintenance?search=${encodeURIComponent(showDetail.assetTag)}`} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" onClick={() => setShowDetail(null)}>
                        {lang === 'en' ? 'View All' : '查看全部'}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    {relatedTickets[showDetail.assetTag].map(ticket => (
                      <Link key={ticket.id} href={`/maintenance?search=${encodeURIComponent(ticket.title)}`} onClick={() => setShowDetail(null)}>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                          <span className="text-white/70 text-xs">{ticket.title}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${ticket.status === 'open' ? 'bg-blue-500/20 text-blue-300' : ticket.status === 'inProgress' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {showDetail.notes && (
                  <div className="mt-4 p-3 rounded-xl bg-white/5">
                    <p className="text-white/40 text-xs mb-1">{t('asset.notes', lang)}</p>
                    <p className="text-white text-sm">{showDetail.notes}</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              <motion.div
                className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl relative z-10 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {editingAsset ? t('asset.edit', lang) : t('asset.add', lang)}
                  </h2>
                  <div className="flex items-center gap-2">
                    <AIFormAssist
                      module="asset"
                      currentValues={Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, String(v || '')]))}
                      onApplySuggestion={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                    />
                    <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'assetTag', label: t('asset.tag', lang), type: 'text' },
                    { key: 'name', label: t('asset.name', lang), type: 'text' },
                    { key: 'brand', label: t('asset.brand', lang), type: 'text' },
                    { key: 'model', label: t('asset.model', lang), type: 'text' },
                    { key: 'serialNumber', label: t('asset.serial', lang), type: 'text' },
                    { key: 'location', label: t('asset.location', lang), type: 'text' },
                    { key: 'purchaseDate', label: t('asset.purchaseDate', lang), type: 'date' },
                    { key: 'purchasePrice', label: t('asset.purchasePrice', lang), type: 'number' },
                    { key: 'warrantyEnd', label: t('asset.warranty', lang), type: 'date' },
                    { key: 'assignedTo', label: t('asset.assignedTo', lang), type: 'text' },
                    { key: 'ipAddress', label: t('asset.ip', lang), type: 'text' },
                    { key: 'macAddress', label: t('asset.mac', lang), type: 'text' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-white/60 text-xs mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        value={(formData as Record<string, string | number>)[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                        className="glass-input w-full px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">{t('asset.category', lang)}</label>
                    <select
                      value={formData.category || 'laptop'}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="glass-input w-full px-3 py-2 text-sm"
                    >
                      {['laptop', 'desktop', 'server', 'printer', 'phone', 'monitor', 'network', 'peripheral', 'software', 'other'].map(c => (
                        <option key={c} value={c} className="bg-gray-800">{t(`cat.${c}`, lang)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">{t('asset.status', lang)}</label>
                    <select
                      value={formData.status || 'available'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="glass-input w-full px-3 py-2 text-sm"
                    >
                      {['available', 'assigned', 'maintenance', 'retired', 'disposed'].map(s => (
                        <option key={s} value={s} className="bg-gray-800">{t(`status.${s}`, lang)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-white/60 text-xs mb-1.5">{t('asset.notes', lang)}</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="glass-input w-full px-3 py-2 text-sm h-20 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="glass-button px-4 py-2 text-sm">
                    {t('common.cancel', lang)}
                  </button>
                  <motion.button
                    onClick={handleSave}
                    className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('common.save', lang)}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barcode Scanner */}
        {showScanner && (
          <BarcodeScanner
            onScan={(code) => {
              setShowScanner(false);
              const found = assets.find(a =>
                a.assetTag.toLowerCase() === code.toLowerCase() ||
                a.serialNumber.toLowerCase() === code.toLowerCase()
              );
              if (found) {
                setShowDetail(found);
              } else {
                setSearchTerm(code);
              }
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </motion.div>
    </MainLayout>
  );
}
