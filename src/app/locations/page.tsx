'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Plus, Edit, Trash2, X, Search, ChevronRight, Building2, ArrowRightLeft, Check, Clock,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface Location {
  id: string;
  name: string;
  type: string;
  address: string | null;
  floor: string | null;
  room: string | null;
  parentId: string | null;
  isActive: number;
  createdAt: string;
}

interface AssetTransfer {
  id: string;
  assetId: string;
  fromLocationId: string | null;
  toLocationId: string;
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  reason: string | null;
  createdAt: string;
}

const locationTypes = ['headquarters', 'office', 'warehouse', 'datacenter', 'branch', 'floor', 'room'];

export default function LocationsPage() {
  const { lang } = useApp();
  const [locations, setLocations] = useState<Location[]>([]);
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'locations' | 'transfers'>('locations');
  const [showModal, setShowModal] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', type: 'office', address: '', parentId: '', floor: '', room: '' });

  useEffect(() => { fetchLocations(); fetchTransfers(); }, []);

  async function fetchLocations() {
    setLoading(true);
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data || []);
    } catch { /* */ } finally { setLoading(false); }
  }

  async function fetchTransfers() {
    try {
      const res = await fetch('/api/assets/transfers');
      const data = await res.json();
      setTransfers(data.transfers || data || []);
    } catch { /* */ }
  }

  async function handleSave() {
    try {
      if (editLocation) {
        await fetch(`/api/locations/${editLocation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, parentId: form.parentId || undefined }),
        });
      }
      setShowModal(false);
      setEditLocation(null);
      setForm({ name: '', type: 'office', address: '', parentId: '', floor: '', room: '' });
      fetchLocations();
    } catch { /* */ }
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'en' ? 'Delete this location?' : '删除此位置？')) return;
    await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    fetchLocations();
  }

  async function handleTransferAction(id: string, action: string) {
    await fetch(`/api/assets/transfers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, userId: 'system' }),
    });
    fetchTransfers();
  }

  function openEdit(loc: Location) {
    setEditLocation(loc);
    setForm({ name: loc.name, type: loc.type, address: loc.address || '', parentId: loc.parentId || '', floor: loc.floor || '', room: loc.room || '' });
    setShowModal(true);
  }

  function getLocationName(id: string): string {
    return locations.find(l => l.id === id)?.name || id;
  }

  const filtered = search.trim()
    ? locations.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
    : locations;

  const typeColors: Record<string, string> = {
    headquarters: 'bg-violet-500/20 text-violet-300', office: 'bg-blue-500/20 text-blue-300',
    warehouse: 'bg-amber-500/20 text-amber-300', datacenter: 'bg-cyan-500/20 text-cyan-300',
    branch: 'bg-green-500/20 text-green-300', floor: 'bg-slate-500/20 text-slate-300', room: 'bg-gray-500/20 text-gray-300',
  };

  const transferStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300', approved: 'bg-blue-500/20 text-blue-300',
    completed: 'bg-green-500/20 text-green-300', rejected: 'bg-red-500/20 text-red-300',
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Locations & Transfers' : '位置和调拨'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Manage office locations and asset transfers' : '管理办公位置和资产调拨'}
            </p>
          </div>
          {tab === 'locations' && (
            <button onClick={() => { setEditLocation(null); setForm({ name: '', type: 'office', address: '', parentId: '', floor: '', room: '' }); setShowModal(true); }}
              className="glass-button px-4 py-2 flex items-center gap-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30">
              <Plus className="w-4 h-4" /> {lang === 'en' ? 'New Location' : '新建位置'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('locations')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === 'locations' ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'glass-button text-white/50'}`}>
            <Building2 className="w-4 h-4 inline mr-2" /> {lang === 'en' ? `Locations (${locations.length})` : `位置 (${locations.length})`}
          </button>
          <button onClick={() => setTab('transfers')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === 'transfers' ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'glass-button text-white/50'}`}>
            <ArrowRightLeft className="w-4 h-4 inline mr-2" /> {lang === 'en' ? `Transfers (${transfers.length})` : `调拨 (${transfers.length})`}
          </button>
        </div>

        {tab === 'locations' && (
          <>
            {/* Search */}
            <div className="glass-card p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={lang === 'en' ? 'Search locations...' : '搜索位置...'}
                  className="glass-input w-full pl-10 pr-4 py-2 text-sm" />
              </div>
            </div>

            {/* Location Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="glass-card p-6 animate-pulse h-32" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <MapPin className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30">{lang === 'en' ? 'No locations found' : '未找到位置'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((loc, i) => {
                  const parent = loc.parentId ? locations.find(l => l.id === loc.parentId) : null;
                  return (
                    <motion.div key={loc.id} className="glass-card p-5 group"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${typeColors[loc.type] || 'bg-white/10 text-white/50'}`}>
                          {loc.type}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(loc)} className="p-1 rounded hover:bg-white/10"><Edit className="w-3.5 h-3.5 text-white/50" /></button>
                          <button onClick={() => handleDelete(loc.id)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold text-sm mb-1">{loc.name}</h3>
                      {loc.floor && <p className="text-white/30 text-xs mb-1">{lang === 'en' ? 'Floor' : '楼层'}: {loc.floor}{loc.room ? ` / ${loc.room}` : ''}</p>}
                      {parent && (
                        <div className="flex items-center gap-1 text-white/20 text-xs mb-2">
                          <MapPin className="w-3 h-3" /> {parent.name} <ChevronRight className="w-3 h-3" /> {loc.name}
                        </div>
                      )}
                      {loc.address && <p className="text-white/30 text-xs mb-2">{loc.address}</p>}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'transfers' && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Asset' : '资产'}</th>
                    <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'From' : '从'}</th>
                    <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'To' : '到'}</th>
                    <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Status' : '状态'}</th>
                    <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Date' : '日期'}</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-white/30">{lang === 'en' ? 'No transfers found' : '未找到调拨记录'}</td></tr>
                  ) : (
                    transfers.map((t, i) => (
                      <motion.tr key={t.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <td className="p-4 text-white text-xs">{t.assetId.slice(0, 8)}...</td>
                        <td className="p-4 text-white/50 text-xs">{t.fromLocationId ? getLocationName(t.fromLocationId) : '—'}</td>
                        <td className="p-4 text-white/50 text-xs">{getLocationName(t.toLocationId)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${transferStatusColors[t.status] || 'bg-white/10 text-white/50'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-white/30 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          {t.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleTransferAction(t.id, 'approve')}
                                className="p-1.5 rounded hover:bg-white/10" title="Approve">
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              </button>
                              <button onClick={() => handleTransferAction(t.id, 'reject')}
                                className="p-1.5 rounded hover:bg-white/10" title="Reject">
                                <X className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          )}
                          {t.status === 'approved' && (
                            <button onClick={() => handleTransferAction(t.id, 'complete')}
                              className="glass-button px-3 py-1 text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                              {lang === 'en' ? 'Complete' : '完成'}
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Location Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="glass-card p-6 w-full max-w-lg" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    {editLocation ? (lang === 'en' ? 'Edit Location' : '编辑位置') : (lang === 'en' ? 'New Location' : '新建位置')}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Name' : '名称'}</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Floor' : '楼层'}</label>
                      <input type="text" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm" placeholder="e.g. 3F" />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Room' : '房间'}</label>
                      <input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm" placeholder="e.g. 301" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Type' : '类型'}</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm">
                      {locationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Parent Location' : '上级位置'}</label>
                    <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm">
                      <option value="">{lang === 'en' ? 'None (Top Level)' : '无（顶级）'}</option>
                      {locations.filter(l => l.id !== editLocation?.id).map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Address' : '地址'}</label>
                    <textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setShowModal(false)} className="glass-button px-4 py-2 text-sm text-white/50">
                      {lang === 'en' ? 'Cancel' : '取消'}
                    </button>
                    <button onClick={handleSave}
                      className="glass-button px-4 py-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30">
                      {lang === 'en' ? 'Save' : '保存'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}
