'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@unitech.sg');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, lang, setLang } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    router.push('/dashboard');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} animated-gradient flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.5) 0%, transparent 70%)' }}
          animate={{ x: [0, 100, -50, 0], y: [0, -80, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ top: '-10%', left: '-10%' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)' }}
          animate={{ x: [0, -80, 40, 0], y: [0, 60, -40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ bottom: '-10%', right: '-10%' }}
        />
      </div>

      <motion.div
        className="glass-card p-8 w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/20 border border-accent-400/30 mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Cpu className="w-8 h-8 text-accent-400" />
          </motion.div>
          <motion.h1
            className="text-3xl font-bold text-white mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Unitech IT System
          </motion.h1>
          <motion.p
            className="text-white/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {lang === 'en' ? 'IT Inventory Management System' : 'IT 资产管理系统'}
          </motion.p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-6">
          <div className="glass-button flex rounded-xl overflow-hidden p-0.5">
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-all ${lang === 'en' ? 'bg-white/20 text-white' : 'text-white/50'}`}
            >
              English
            </button>
            <button
              onClick={() => setLang('zh')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-all ${lang === 'zh' ? 'bg-white/20 text-white' : 'text-white/50'}`}
            >
              中文
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <label className="block text-white/70 text-sm mb-1.5">
              {lang === 'en' ? 'Email Address' : '邮箱地址'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full px-4 py-3 text-sm"
              placeholder="admin@unitech.sg"
              required
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <label className="block text-white/70 text-sm mb-1.5">
              {lang === 'en' ? 'Password' : '密码'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 pr-12 text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {loading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <Shield className="w-4 h-4" />
                {lang === 'en' ? 'Sign In' : '登录'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <motion.div
          className="mt-6 p-3 rounded-xl bg-accent-500/10 border border-accent-400/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-blue-300/80 text-xs text-center">
            {lang === 'en' ? 'Demo credentials pre-filled. Click Sign In to continue.' : '演示凭据已预填。点击登录继续。'}
          </p>
        </motion.div>

        <p className="text-center text-white/30 text-xs mt-4">
          © 2026 Unitech IT System • Singapore
        </p>
      </motion.div>
    </div>
  );
}
