'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, PieChart as PieChartIcon, TrendingUp, DollarSign, Calendar, Cpu, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Legend } from 'recharts';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { FeatureGuide, MODULE_GUIDES } from '@/components/FeatureGuide';
import { t } from '@/lib/i18n';
import * as XLSX from 'xlsx';

const monthlyData: {month: string; acquisitions: number; disposals: number; maintenance: number}[] = [];
const costData: {month: string; acquisition: number; maintenance: number; total: number}[] = [];
const departmentData: {dept: string; assets: number; value: number}[] = [];

export default function ReportsPage() {
  const { lang } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'costs' | 'department'>('overview');
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [categoryData, setCategoryData] = useState<{name: string; value: number; color: string}[]>([]);
  const [statusData, setStatusData] = useState<{name: string; value: number; color: string}[]>([]);
  const [summaryStats, setSummaryStats] = useState<{key: string; value: string; icon: typeof Cpu; change: string}[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.totalAssets > 0) {
          setHasData(true);
          if (data.categoryData) setCategoryData(data.categoryData.map((c: { name: string; count: number }, i: number) => ({ name: c.name, value: c.count, color: ['#3b82f6','#8b5cf6','#ef4444','#f59e0b','#10b981','#ec4899','#06b6d4'][i % 7] })));
          if (data.assetsByStatus) {
            const colors: Record<string, string> = { active: '#10b981', in_storage: '#3b82f6', maintenance: '#f59e0b', retired: '#6b7280' };
            setStatusData(Object.entries(data.assetsByStatus as Record<string, number>).map(([k, v]) => ({ name: k, value: v, color: colors[k] || '#6b7280' })));
          }
          setSummaryStats([
            { key: 'totalAssets', value: String(data.totalAssets), icon: Cpu, change: '' },
            { key: 'totalValue', value: `S$${(data.revenue / 1000).toFixed(0)}K`, icon: DollarSign, change: '' },
            { key: 'openTickets', value: String(data.openTickets), icon: Calendar, change: '' },
            { key: 'employees', value: String(data.activeEmployees), icon: TrendingUp, change: '' },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'overview' as const, label: lang === 'en' ? 'Overview' : '概况' },
    { id: 'assets' as const, label: lang === 'en' ? 'Assets' : '资产' },
    { id: 'costs' as const, label: lang === 'en' ? 'Costs' : '费用' },
    { id: 'department' as const, label: lang === 'en' ? 'By Department' : '按部门' },
  ];

  const handleExport = (format: 'csv' | 'xlsx') => {
    const wb = XLSX.utils.book_new();
    // Summary sheet
    const summaryRows = summaryStats.map(s => ({
      Metric: s.key === 'totalAssets' ? 'Total Assets' : s.key === 'totalValue' ? 'Total Value' : s.key === 'openTickets' ? 'Open Tickets' : 'Employees',
      Value: s.value,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
    // Category sheet
    if (categoryData.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryData.map(c => ({ Category: c.name, Count: c.value }))), 'By Category');
    }
    // Status sheet
    if (statusData.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statusData.map(s => ({ Status: s.name, Count: s.value }))), 'By Status');
    }
    // Department sheet
    if (departmentData.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(departmentData.map(d => ({ Department: d.dept, Assets: d.assets, Value: d.value }))), 'By Department');
    }
    const filename = `report_${new Date().toISOString().slice(0, 10)}.${format}`;
    XLSX.writeFile(wb, filename, { bookType: format === 'csv' ? 'csv' : 'xlsx' });
    setShowExportMenu(false);
  };

  const tooltipStyle = {
    contentStyle: { background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' },
    itemStyle: { color: '#fff' },
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-emerald-400" />
              {t('reports.title', lang)}
            </h1>
            <p className="text-white/50 text-sm mt-1">{t('reports.subtitle', lang)}</p>
          </div>
          <div className="relative">
            <motion.button
              className="glass-button px-4 py-2 text-sm flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" />
              {lang === 'en' ? 'Export' : '导出'}
              <ChevronDown className="w-3 h-3" />
            </motion.button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-44 glass-card rounded-xl p-1 z-50 shadow-2xl">
                <button onClick={() => handleExport('xlsx')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-all">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Excel (.xlsx)
                </button>
                <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-all">
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  CSV (.csv)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {!hasData && !loading ? (
          <FeatureGuide {...MODULE_GUIDES.reports} lang={lang} />
        ) : (
        <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, i) => (
            <motion.div
              key={stat.key}
              className="glass-card p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <stat.icon className="w-5 h-5 text-white/40" />
                <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
              <p className="text-white/40 text-xs mt-1">
                {stat.key === 'totalAssets' && (lang === 'en' ? 'Total Assets' : '资产总数')}
                {stat.key === 'totalValue' && (lang === 'en' ? 'Total Value' : '总价值')}
                {stat.key === 'openTickets' && (lang === 'en' ? 'Open Tickets' : '工单数')}
                {stat.key === 'employees' && (lang === 'en' ? 'Employees' : '员工数')}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div className="glass-card p-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-accent-400" />
                {lang === 'en' ? 'Assets by Category' : '按类别资产'}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: '#fff', fontSize: '12px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div className="glass-card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-400" />
                {lang === 'en' ? 'Assets by Status' : '按状态资产'}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: '#fff', fontSize: '12px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-white font-semibold mb-4">
              {lang === 'en' ? 'Monthly Asset Movement' : '月度资产变动'}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#fff6" fontSize={12} />
                <YAxis stroke="#fff6" fontSize={12} />
                <Tooltip {...tooltipStyle} />
                <Legend formatter={(value) => <span style={{ color: '#fff', fontSize: '12px' }}>{value}</span>} />
                <Bar dataKey="acquisitions" fill="#3b82f6" radius={[4, 4, 0, 0]} name={lang === 'en' ? 'Acquisitions' : '采购'} />
                <Bar dataKey="disposals" fill="#ef4444" radius={[4, 4, 0, 0]} name={lang === 'en' ? 'Disposals' : '报废'} />
                <Bar dataKey="maintenance" fill="#f59e0b" radius={[4, 4, 0, 0]} name={lang === 'en' ? 'Maintenance' : '维护'} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-white font-semibold mb-4">
              {lang === 'en' ? 'Monthly Cost Analysis (SGD)' : '月度费用分析 (新元)'}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={costData}>
                <defs>
                  <linearGradient id="colorAcq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMnt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#fff6" fontSize={12} />
                <YAxis stroke="#fff6" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip {...tooltipStyle} />
                <Legend formatter={(value) => <span style={{ color: '#fff', fontSize: '12px' }}>{value}</span>} />
                <Area type="monotone" dataKey="acquisition" stroke="#3b82f6" fill="url(#colorAcq)" name={lang === 'en' ? 'Acquisition' : '采购'} />
                <Area type="monotone" dataKey="maintenance" stroke="#f59e0b" fill="url(#colorMnt)" name={lang === 'en' ? 'Maintenance' : '维护'} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Department Tab */}
        {activeTab === 'department' && (
          <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-white font-semibold mb-4">
              {lang === 'en' ? 'Assets by Department' : '按部门资产'}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#fff6" fontSize={12} />
                <YAxis type="category" dataKey="dept" stroke="#fff6" fontSize={12} width={90} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="assets" fill="#8b5cf6" radius={[0, 4, 4, 0]} name={lang === 'en' ? 'Assets' : '资产数'} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm text-white/70">
                <thead><tr className="border-b border-white/10 text-white/40 text-xs">
                  <th className="text-left py-2">{lang === 'en' ? 'Department' : '部门'}</th>
                  <th className="text-right py-2">{lang === 'en' ? 'Assets' : '资产数'}</th>
                  <th className="text-right py-2">{lang === 'en' ? 'Value (SGD)' : '价值 (新元)'}</th>
                </tr></thead>
                <tbody>
                  {departmentData.map(d => (
                    <tr key={d.dept} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2">{d.dept}</td>
                      <td className="text-right py-2">{d.assets}</td>
                      <td className="text-right py-2">${d.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        </>
        )}
      </motion.div>
    </MainLayout>
  );
}
