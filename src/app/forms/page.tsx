'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Edit, Trash2, X, Search, Eye, CheckSquare, Type, Hash, Calendar, List,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
}

interface FormTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fields: string;
  isActive: number;
  createdBy: string | null;
  createdAt: string;
}

interface FormSubmission {
  id: string;
  formId: string;
  responses: string;
  submittedBy: string | null;
  completionPercent: number;
  createdAt: string;
}

const fieldTypeIcons: Record<string, React.ElementType> = {
  text: Type, number: Hash, date: Calendar, select: List, checkbox: CheckSquare, textarea: Type,
};

export default function FormsPage() {
  const { lang } = useApp();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<FormTemplate | null>(null);
  const [viewTemplate, setViewTemplate] = useState<FormTemplate | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'general', fields: [] as FormField[] });
  const [newField, setNewField] = useState<FormField>({ name: '', label: '', type: 'text', required: false });

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch('/api/forms');
      const data = await res.json();
      setTemplates(data.templates || data || []);
    } catch { /* */ } finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      if (editTemplate) {
        await fetch(`/api/forms/${editTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, fields: JSON.stringify(form.fields) }),
        });
      } else {
        await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, fields: JSON.stringify(form.fields) }),
        });
      }
      setShowModal(false);
      setEditTemplate(null);
      setForm({ title: '', description: '', category: 'general', fields: [] });
      fetchTemplates();
    } catch { /* */ }
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'en' ? 'Delete this form?' : '删除此表单？')) return;
    await fetch(`/api/forms/${id}`, { method: 'DELETE' });
    fetchTemplates();
  }

  async function handleViewSubmissions(template: FormTemplate) {
    setViewTemplate(template);
    try {
      const res = await fetch(`/api/forms/submissions?formId=${template.id}`);
      const data = await res.json();
      setSubmissions(data.submissions || data || []);
    } catch { /* */ }
  }

  function addField() {
    if (!newField.name || !newField.label) return;
    setForm({ ...form, fields: [...form.fields, { ...newField }] });
    setNewField({ name: '', label: '', type: 'text', required: false });
  }

  function removeField(index: number) {
    setForm({ ...form, fields: form.fields.filter((_, i) => i !== index) });
  }

  function openEdit(t: FormTemplate) {
    setEditTemplate(t);
    let fields: FormField[] = [];
    try { fields = JSON.parse(t.fields); } catch { /* */ }
    setForm({ title: t.title, description: t.description || '', category: t.category, fields });
    setShowModal(true);
  }

  const filtered = search.trim()
    ? templates.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : templates;

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Custom Forms' : '自定义表单'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Build and manage custom forms and checklists' : '构建和管理自定义表单和检查清单'}
            </p>
          </div>
          <button onClick={() => { setEditTemplate(null); setForm({ title: '', description: '', category: 'general', fields: [] }); setShowModal(true); }}
            className="glass-button px-4 py-2 flex items-center gap-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30">
            <Plus className="w-4 h-4" /> {lang === 'en' ? 'New Form' : '新建表单'}
          </button>
        </div>

        {/* Search */}
        <div className="glass-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'en' ? 'Search forms...' : '搜索表单...'}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm" />
          </div>
        </div>

        {/* Forms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="glass-card p-6 animate-pulse h-40" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ClipboardList className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">{lang === 'en' ? 'No forms found' : '未找到表单'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template, i) => {
              let fields: FormField[] = [];
              try { fields = JSON.parse(template.fields); } catch { /* */ }
              return (
                <motion.div key={template.id} className="glass-card p-5 group"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/20 capitalize">
                      {template.category}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleViewSubmissions(template)} className="p-1 rounded hover:bg-white/10"><Eye className="w-3.5 h-3.5 text-white/50" /></button>
                      <button onClick={() => openEdit(template)} className="p-1 rounded hover:bg-white/10"><Edit className="w-3.5 h-3.5 text-white/50" /></button>
                      <button onClick={() => handleDelete(template.id)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{template.title}</h3>
                  {template.description && <p className="text-white/40 text-xs mb-3 line-clamp-2">{template.description}</p>}
                  <div className="flex items-center gap-2 text-white/30 text-xs">
                    <ClipboardList className="w-3 h-3" /> {fields.length} {lang === 'en' ? 'fields' : '个字段'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="glass-card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    {editTemplate ? (lang === 'en' ? 'Edit Form' : '编辑表单') : (lang === 'en' ? 'New Form' : '新建表单')}
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
                    <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Category' : '分类'}</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm">
                      <option value="general">General</option>
                      <option value="inspection">Inspection</option>
                      <option value="checklist">Checklist</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="survey">Survey</option>
                    </select>
                  </div>

                  {/* Fields */}
                  <div>
                    <label className="text-white/50 text-xs mb-2 block">{lang === 'en' ? 'Fields' : '字段'}</label>
                    {form.fields.map((field, idx) => {
                      const Icon = fieldTypeIcons[field.type] || Type;
                      return (
                        <div key={idx} className="flex items-center gap-2 mb-2 p-2 bg-white/5 rounded-lg">
                          <Icon className="w-4 h-4 text-white/30 flex-shrink-0" />
                          <div className="flex-1 text-sm text-white/70">{field.label} <span className="text-white/30">({field.type})</span></div>
                          {field.required && <span className="text-red-400 text-xs">*</span>}
                          <button onClick={() => removeField(idx)} className="p-1 hover:bg-white/10 rounded"><X className="w-3 h-3 text-red-400" /></button>
                        </div>
                      );
                    })}
                    <div className="glass-card p-3 mt-2">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })}
                          placeholder={lang === 'en' ? 'Field name' : '字段名'} className="glass-input px-2 py-1.5 text-xs" />
                        <input type="text" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })}
                          placeholder={lang === 'en' ? 'Label' : '标签'} className="glass-input px-2 py-1.5 text-xs" />
                        <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value as FormField['type'] })}
                          className="glass-input px-2 py-1.5 text-xs">
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="textarea">Textarea</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-white/50 text-xs">
                          <input type="checkbox" checked={newField.required} onChange={e => setNewField({ ...newField, required: e.target.checked })} />
                          {lang === 'en' ? 'Required' : '必填'}
                        </label>
                        <button onClick={addField} className="ml-auto glass-button px-3 py-1 text-xs bg-accent-500/20 text-accent-300 border border-accent-500/30">
                          <Plus className="w-3 h-3 inline mr-1" /> {lang === 'en' ? 'Add Field' : '添加字段'}
                        </button>
                      </div>
                    </div>
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

        {/* Submissions Modal */}
        <AnimatePresence>
          {viewTemplate && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewTemplate(null)}>
              <motion.div className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">{viewTemplate.title} — {lang === 'en' ? 'Submissions' : '提交记录'}</h2>
                  <button onClick={() => setViewTemplate(null)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
                </div>
                {submissions.length === 0 ? (
                  <p className="text-white/30 text-center py-8">{lang === 'en' ? 'No submissions yet' : '暂无提交记录'}</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.map(sub => {
                      let responses: Record<string, unknown> = {};
                      try { responses = JSON.parse(sub.responses); } catch { /* */ }
                      return (
                        <div key={sub.id} className="glass-card p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/50 text-xs">{sub.submittedBy || 'Anonymous'}</span>
                            <span className="text-white/30 text-xs">{new Date(sub.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-20 h-1.5 bg-white/10 rounded-full">
                              <div className="h-full bg-accent-400 rounded-full" style={{ width: `${sub.completionPercent}%` }} />
                            </div>
                            <span className="text-white/30 text-xs">{sub.completionPercent}%</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(responses).map(([key, val]) => (
                              <div key={key} className="text-xs">
                                <span className="text-white/30">{key}: </span>
                                <span className="text-white/60">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}
