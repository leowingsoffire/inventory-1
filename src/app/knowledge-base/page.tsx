'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, Plus, Eye, Edit, Trash2, X, Filter, ChevronLeft, ChevronRight, Tag,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string;
  status: string;
  authorId: string;
  viewCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const categories = ['General', 'Hardware', 'Software', 'Network', 'Security', 'Policy', 'How-To'];
const PAGE_SIZE = 12;

export default function KnowledgeBasePage() {
  const { lang } = useApp();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editArticle, setEditArticle] = useState<KBArticle | null>(null);
  const [viewArticle, setViewArticle] = useState<KBArticle | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', tags: '' });

  useEffect(() => { fetchArticles(); }, [page, categoryFilter]);

  async function fetchArticles() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((page - 1) * PAGE_SIZE).toString(),
      });
      if (search) params.set('search', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await fetch(`/api/knowledge-base?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
    } catch { /* */ } finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      if (editArticle) {
        await fetch(`/api/knowledge-base/${editArticle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/knowledge-base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, authorId: 'system' }),
        });
      }
      setShowModal(false);
      setEditArticle(null);
      setForm({ title: '', content: '', category: 'General', tags: '' });
      fetchArticles();
    } catch { /* */ }
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'en' ? 'Delete this article?' : '删除此文章？')) return;
    await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' });
    fetchArticles();
  }

  async function handleView(id: string) {
    const res = await fetch(`/api/knowledge-base/${id}`);
    const article = await res.json();
    setViewArticle(article);
  }

  function openEdit(article: KBArticle) {
    setEditArticle(article);
    setForm({ title: article.title, content: article.content, category: article.category, tags: article.tags });
    setShowModal(true);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              {lang === 'en' ? 'Knowledge Base' : '知识库'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Browse and manage articles, guides, and solutions' : '浏览和管理文章、指南和解决方案'}
            </p>
          </div>
          <button onClick={() => { setEditArticle(null); setForm({ title: '', content: '', category: 'General', tags: '' }); setShowModal(true); }}
            className="glass-button px-4 py-2 flex items-center gap-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30">
            <Plus className="w-4 h-4" /> {lang === 'en' ? 'New Article' : '新建文章'}
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchArticles()}
              placeholder={lang === 'en' ? 'Search articles...' : '搜索文章...'}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-white/30" />
            <button onClick={() => { setCategoryFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${categoryFilter === 'all' ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
              {lang === 'en' ? 'All' : '全部'}
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => { setCategoryFilter(c); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${categoryFilter === c ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30' : 'text-white/50 hover:bg-white/10'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="glass-card p-6 animate-pulse h-40" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">{lang === 'en' ? 'No articles found' : '未找到文章'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, i) => (
              <motion.div key={article.id} className="glass-card p-5 hover:bg-white/10 transition-all cursor-pointer group"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => handleView(article.id)}>
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                    {article.category}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); openEdit(article); }}
                      className="p-1 rounded hover:bg-white/10"><Edit className="w-3.5 h-3.5 text-white/50" /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(article.id); }}
                      className="p-1 rounded hover:bg-white/10"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-white/40 text-xs line-clamp-3 mb-3">{article.content?.replace(/<[^>]*>/g, '').slice(0, 150)}</p>
                <div className="flex items-center justify-between text-white/30 text-xs">
                  <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.viewCount}</div>
                  <div className="flex items-center gap-1">
                    {article.tags && article.tags.split(',').slice(0, 2).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-white/30 flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" /> {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="glass-button p-2 disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-white" /></button>
            <span className="text-white/50 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="glass-button p-2 disabled:opacity-30"><ChevronRight className="w-4 h-4 text-white" /></button>
          </div>
        )}

        {/* View Modal */}
        <AnimatePresence>
          {viewArticle && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewArticle(null)}>
              <motion.div className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 mb-2 inline-block">
                      {viewArticle.category}
                    </span>
                    <h2 className="text-xl font-bold text-white">{viewArticle.title}</h2>
                    <p className="text-white/30 text-xs mt-1">
                      v{viewArticle.version} &middot; {viewArticle.viewCount} {lang === 'en' ? 'views' : '次浏览'} &middot; {new Date(viewArticle.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setViewArticle(null)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-white/70 whitespace-pre-wrap">{viewArticle.content}</div>
                {viewArticle.tags && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    {viewArticle.tags.split(',').map(tag => (
                      <span key={tag} className="px-2 py-1 rounded-lg bg-white/5 text-white/40 text-xs flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="glass-card p-6 w-full max-w-lg" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    {editArticle ? (lang === 'en' ? 'Edit Article' : '编辑文章') : (lang === 'en' ? 'New Article' : '新建文章')}
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
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Category' : '分类'}</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Content' : '内容'}</label>
                    <textarea rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">{lang === 'en' ? 'Tags (comma separated)' : '标签（逗号分隔）'}</label>
                    <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-sm" placeholder="e.g. vpn, network, setup" />
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
