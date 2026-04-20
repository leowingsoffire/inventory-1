'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock, Plus, Edit, Trash2, X, Play, Pause, ChevronLeft, ChevronRight, Search, Clock,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface ScheduledTask {
  id: string;
  title: string;
  description: string;
  type: string;
  assetId: string | null;
  assignedTo: string | null;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  priority: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  isActive: number;
  createdAt: string;
}

const frequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
const priorities = ['low', 'medium', 'high', 'critical'];

export default function ScheduledTasksPage() {
  const { lang } = useApp();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<ScheduledTask | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', type: 'maintenance', frequency: 'monthly',
    priority: 'medium', assignedTo: '', dayOfWeek: 1, dayOfMonth: 1,
  });

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/scheduled-tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch { /* */ } finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      if (editTask) {
        await fetch(`/api/scheduled-tasks/${editTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/scheduled-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      setEditTask(null);
      fetchTasks();
    } catch { /* */ }
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'en' ? 'Delete this task?' : '删除此任务？')) return;
    await fetch(`/api/scheduled-tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  }

  async function toggleActive(task: ScheduledTask) {
    await fetch(`/api/scheduled-tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: task.isActive ? 0 : 1 }),
    });
    fetchTasks();
  }

  async function runNow() {
    const res = await fetch('/api/scheduled-tasks/run', { method: 'POST' });
    const data = await res.json();
    alert(lang === 'en' ? `Generated ${data.count} ticket(s)` : `生成了 ${data.count} 个工单`);
    fetchTasks();
  }

  function openEdit(task: ScheduledTask) {
    setEditTask(task);
    setForm({
      title: task.title, description: task.description || '', type: task.type,
      frequency: task.frequency, priority: task.priority, assignedTo: task.assignedTo || '',
      dayOfWeek: task.dayOfWeek || 1, dayOfMonth: task.dayOfMonth || 1,
    });
    setShowModal(true);
  }

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-300', high: 'bg-orange-500/20 text-orange-300',
    medium: 'bg-yellow-500/20 text-yellow-300', low: 'bg-green-500/20 text-green-300',
  };

  const filtered = search.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks;

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Scheduled Tasks' : '计划任务'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Manage recurring maintenance and inspection schedules' : '管理定期维护和检查计划'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={runNow}
              className="glass-button px-4 py-2 flex items-center gap-2 text-sm text-amber-300 border border-amber-500/30 hover:bg-amber-500/20">
              <Play className="w-4 h-4" /> {lang === 'en' ? 'Run Now' : '立即执行'}
            </button>
            <button onClick={() => { setEditTask(null); setForm({ title: '', description: '', type: 'maintenance', frequency: 'monthly', priority: 'medium', assignedTo: '', dayOfWeek: 1, dayOfMonth: 1 }); setShowModal(true); }}
              className="glass-button px-4 py-2 flex items-center gap-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30">
              <Plus className="w-4 h-4" /> {lang === 'en' ? 'New Task' : '新建任务'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'en' ? 'Search tasks...' : '搜索任务...'}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm" />
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Task' : '任务'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Frequency' : '频率'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Priority' : '优先级'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Next Run' : '下次执行'}</th>
                  <th className="text-left p-4 text-white/50 font-medium">{lang === 'en' ? 'Status' : '状态'}</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3].map(i => <tr key={i}><td colSpan={6} className="p-4"><div className="h-8 animate-pulse bg-white/5 rounded" /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-white/30">{lang === 'en' ? 'No tasks found' : '未找到任务'}</td></tr>
                ) : (
                  filtered.map((task, i) => (
                    <motion.tr key={task.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td className="p-4">
                        <div className="font-medium text-white">{task.title}</div>
                        {task.description && <div className="text-white/30 text-xs mt-0.5 line-clamp-1">{task.description}</div>}
                      </td>
                      <td className="p-4 text-white/60 capitalize">{task.frequency}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[task.priority] || 'bg-white/10 text-white/50'}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4 text-white/50 text-xs">
                        {task.nextRunAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(task.nextRunAt).toLocaleDateString()}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${task.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {task.isActive ? (lang === 'en' ? 'Active' : '活跃') : (lang === 'en' ? 'Paused' : '已暂停')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button onClick={() => toggleActive(task)} className="p-1.5 rounded hover:bg-white/10" title={task.isActive ? 'Pause' : 'Resume'}>
                            {task.isActive ? <Pause className="w-3.5 h-3.5 text-yellow-400" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
                          </button>
                          <button onClick={() => openEdit(task)} className="p-1.5 rounded hover:bg-white/10">
                            <Edit className="w-3.5 h-3.5 text-white/50" />
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="p-1.5 rounded hover:bg-white/10">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    {editTask ? (lang === 'en' ? 'Edit Task' : '编辑任务') : (lang === 'en' ? 'New Scheduled Task' : '新建计划任务')}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Title' : '标题'}</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Description' : '描述'}</label>
                    <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Frequency' : '频率'}</label>
                      <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm">
                        {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Priority' : '优先级'}</label>
                      <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                        className="glass-input w-full px-3 py-2 text-sm">
                        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  {(form.frequency === 'weekly' || form.frequency === 'biweekly') && (
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Day of Week' : '星期几'}</label>
                      <select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
                        className="glass-input w-full px-3 py-2 text-sm">
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => <option key={d} value={i}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  {(form.frequency === 'monthly' || form.frequency === 'quarterly' || form.frequency === 'yearly') && (
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Day of Month' : '每月几号'}</label>
                      <input type="number" min={1} max={28} value={form.dayOfMonth} onChange={e => setForm({ ...form, dayOfMonth: parseInt(e.target.value) })}
                        className="glass-input w-full px-3 py-2 text-sm" />
                    </div>
                  )}
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Assigned To' : '分配给'}</label>
                    <input type="text" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" placeholder={lang === 'en' ? 'User ID' : '用户ID'} />
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
