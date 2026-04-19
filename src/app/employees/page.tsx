'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, X, Users, Mail, Phone, Building2, ChevronDown, ExternalLink, Monitor } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { FeatureGuide, MODULE_GUIDES } from '@/components/FeatureGuide';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  phone: string;
  status: string;
  joinDate: string;
  assignedAssets: number;
}



const departments = ['All', 'Engineering', 'Sales', 'HR', 'Finance', 'Marketing', 'Operations', 'IT'];

export default function EmployeesPage() {
  const { lang } = useApp();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});

  // Fetch employees from API
  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setEmployees(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle URL query params for cross-page navigation
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) setSearchTerm(searchParam);
  }, [searchParams]);

  const filtered = employees.filter(emp => {
    const matchSearch = !searchTerm ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept === 'All' || emp.department === filterDept;
    const matchStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      employeeId: `UT-E${String(employees.length + 1).padStart(3, '0')}`,
      name: '', email: '', department: 'Engineering', position: '',
      phone: '', status: 'active', joinDate: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({ ...emp });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingEmployee) {
      setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? { ...e, ...formData } as Employee : e));
    } else {
      setEmployees(prev => [...prev, { ...formData, id: String(Date.now()), assignedAssets: 0 } as Employee]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('emp.title', lang)}</h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? `${filtered.length} employees` : `${filtered.length} 名员工`}
            </p>
          </div>
          <motion.button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            {t('emp.add', lang)}
          </motion.button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search employees...' : '搜索员工...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          <div className="relative">
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="glass-input px-4 py-2.5 text-sm pr-8 appearance-none cursor-pointer min-w-[150px]">
              {departments.map(d => (
                <option key={d} value={d} className="bg-gray-800">{d === 'All' ? (lang === 'en' ? 'All Departments' : '所有部门') : d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input px-4 py-2.5 text-sm pr-8 appearance-none cursor-pointer min-w-[120px]">
              <option value="all" className="bg-gray-800">{t('common.all', lang)}</option>
              <option value="active" className="bg-gray-800">{t('status.active', lang)}</option>
              <option value="inactive" className="bg-gray-800">{t('status.inactive', lang)}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Employee Cards Grid */}
        {employees.length === 0 && !loading ? (
          <FeatureGuide {...MODULE_GUIDES.employees} lang={lang} />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp, i) => (
            <motion.div
              key={emp.id}
              className="glass-card glass-card-hover p-5 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setShowDetail(emp)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{emp.name.charAt(0)}</span>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                  emp.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                }`}>
                  {t(`status.${emp.status}`, lang)}
                </span>
              </div>
              <h3 className="text-white font-semibold text-sm">{emp.name}</h3>
              <p className="text-white/40 text-xs mb-3">{emp.position}</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Building2 className="w-3 h-3" />
                  <span>{emp.department}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Phone className="w-3 h-3" />
                  <span>{emp.phone}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <Link
                  href={`/assets?search=${encodeURIComponent(emp.name)}`}
                  className="text-accent-400 hover:text-accent-300 text-xs flex items-center gap-1 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Monitor className="w-3 h-3" />
                  {lang === 'en' ? `${emp.assignedAssets} assets` : `${emp.assignedAssets} 项资产`}
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEditModal(emp)} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-blue-300 transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-300 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {filtered.length === 0 && employees.length > 0 && (
          <div className="text-center py-12 glass-card">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">{t('common.noData', lang)}</p>
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetail && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(null)} />
              <motion.div className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-lg relative z-10 max-h-[90vh] overflow-y-auto" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{showDetail.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{showDetail.name}</h2>
                      <p className="text-blue-300 text-sm">{showDetail.employeeId}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetail(null)} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    [t('emp.email', lang), showDetail.email],
                    [t('emp.phone', lang), showDetail.phone],
                    [t('emp.department', lang), showDetail.department],
                    [t('emp.position', lang), showDetail.position],
                    [t('emp.status', lang), t(`status.${showDetail.status}`, lang)],
                    [t('emp.joinDate', lang), showDetail.joinDate],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="p-3 rounded-xl bg-white/5">
                      <p className="text-white/40 text-xs mb-1">{label}</p>
                      <p className="text-white text-sm">{value}</p>
                    </div>
                  ))}
                  {/* Assigned Assets - clickable */}
                  <div className="p-3 rounded-xl bg-white/5 col-span-2">
                    <p className="text-white/40 text-xs mb-1">{t('emp.assignedAssets', lang)}</p>
                    <Link
                      href={`/assets?search=${encodeURIComponent(showDetail.name)}`}
                      className="text-blue-300 text-sm hover:text-blue-200 flex items-center gap-1"
                      onClick={() => setShowDetail(null)}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      {showDetail.assignedAssets} {lang === 'en' ? 'assigned assets' : '项已分配资产'}
                      <ExternalLink className="w-3 h-3 ml-1" />
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
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              <motion.div className="glass-card p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-lg relative z-10 max-h-[90vh] overflow-y-auto" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {editingEmployee ? t('emp.edit', lang) : t('emp.add', lang)}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'employeeId', label: t('emp.id', lang) },
                    { key: 'name', label: t('emp.name', lang) },
                    { key: 'email', label: t('emp.email', lang) },
                    { key: 'phone', label: t('emp.phone', lang) },
                    { key: 'position', label: t('emp.position', lang) },
                    { key: 'joinDate', label: t('emp.joinDate', lang), type: 'date' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-white/60 text-xs mb-1.5">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        value={(formData as Record<string, string>)[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="glass-input w-full px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">{t('emp.department', lang)}</label>
                    <select
                      value={formData.department || 'Engineering'}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="glass-input w-full px-3 py-2 text-sm"
                    >
                      {departments.filter(d => d !== 'All').map(d => (
                        <option key={d} value={d} className="bg-gray-800">{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">{t('emp.status', lang)}</label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="glass-input w-full px-3 py-2 text-sm"
                    >
                      <option value="active" className="bg-gray-800">{t('status.active', lang)}</option>
                      <option value="inactive" className="bg-gray-800">{t('status.inactive', lang)}</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="glass-button px-4 py-2 text-sm">{t('common.cancel', lang)}</button>
                  <motion.button onClick={handleSave} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {t('common.save', lang)}
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
