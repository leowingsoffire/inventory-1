'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Eye, EyeOff, ArrowRight, Shield, AlertCircle, Mail, Zap, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useAuth } from '@/lib/auth-context';
import { APP_VERSION } from '@/lib/version';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [glitchText, setGlitchText] = useState(false);
  const router = useRouter();
  const { theme, lang, setLang } = useApp();
  const { login: authLogin } = useAuth();

  // Periodic glitch effect on title
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authLogin(login, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetSent(true);
    } catch {
      setResetSent(true);
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated cyber grid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,255,255,0.15) 0%, rgba(0,100,255,0.05) 40%, transparent 70%)', top: '-20%', left: '-15%' }}
          animate={{ x: [0, 120, -60, 0], y: [0, -100, 80, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)', bottom: '-15%', right: '-10%' }}
          animate={{ x: [0, -100, 50, 0], y: [0, 80, -60, 0], scale: [1, 0.8, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 60%)', top: '50%', left: '60%' }}
          animate={{ x: [0, -70, 30, 0], y: [0, -50, 70, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Scan line effect */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
          animate={{ y: ['-100vh', '100vh'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/40"
            style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.7 }}
          />
        ))}
      </div>

      {/* Main card */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Outer glow border */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-cyan-500/30 via-violet-500/20 to-pink-500/30 blur-[1px]" />
        <motion.div
          className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-cyan-500/50 via-violet-500/30 to-pink-500/50 opacity-60"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/[0.08] p-8 overflow-hidden">
          {/* Inner corner accents */}
          <div className="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-cyan-400/60 to-transparent" />
          <div className="absolute top-0 left-0 w-[1px] h-12 bg-gradient-to-b from-cyan-400/60 to-transparent" />
          <div className="absolute bottom-0 right-0 w-12 h-[1px] bg-gradient-to-l from-violet-400/60 to-transparent" />
          <div className="absolute bottom-0 right-0 w-[1px] h-12 bg-gradient-to-t from-violet-400/60 to-transparent" />

          {/* Logo section */}
          <div className="text-center mb-8">
            {/* Animated logo with rotating rings */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
              {/* Outer rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border border-cyan-500/30"
                style={{ borderStyle: 'dashed' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              />
              {/* Middle pulsing ring */}
              <motion.div
                className="absolute inset-1.5 rounded-full border border-violet-400/25"
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Inner rotating ring (opposite direction) */}
              <motion.div
                className="absolute inset-3 rounded-full border border-pink-400/20"
                style={{ borderStyle: 'dotted' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              {/* Icon container */}
              <motion.div
                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/20 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Cpu className="w-5 h-5 text-cyan-400" />
              </motion.div>
              {/* Corner dots */}
              {[0, 90, 180, 270].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
                  style={{
                    top: `${50 - 48 * Math.cos((deg * Math.PI) / 180)}%`,
                    left: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: deg / 360 }}
                />
              ))}
            </div>

            {/* Glitch title */}
            <motion.h1
              className="text-3xl font-bold mb-1 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
                Unitech IT System
              </span>
              {glitchText && (
                <>
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent" style={{ clipPath: 'inset(20% 0 40% 0)', transform: 'translateX(-2px)' }}>
                    Unitech IT System
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent" style={{ clipPath: 'inset(60% 0 10% 0)', transform: 'translateX(2px)' }}>
                    Unitech IT System
                  </span>
                </>
              )}
            </motion.h1>
            <motion.div
              className="flex items-center justify-center gap-2 text-white/40 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'IT Inventory Management System' : 'IT 资产管理系统'}</span>
            </motion.div>
          </div>

          {/* Language Toggle */}
          <div className="flex justify-center mb-6">
            <div className="flex rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] p-0.5">
              <button
                onClick={() => setLang('en')}
                className={`px-4 py-1.5 text-sm rounded-lg transition-all ${lang === 'en' ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/20' : 'text-white/40 hover:text-white/60'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('zh')}
                className={`px-4 py-1.5 text-sm rounded-lg transition-all ${lang === 'zh' ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/20' : 'text-white/40 hover:text-white/60'}`}
              >
                中文
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5 uppercase tracking-wider font-medium">
                <Zap className="w-3 h-3 text-cyan-400/60" />
                {lang === 'en' ? 'Username or Email' : '用户名或邮箱'}
              </label>
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-violet-500/0 group-focus-within:from-cyan-500/30 group-focus-within:via-violet-500/20 group-focus-within:to-pink-500/30 transition-all duration-300" />
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="relative w-full px-4 py-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:bg-white/[0.06] transition-all"
                  placeholder="myoadmin / admin@unitech.sg"
                  required
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5 uppercase tracking-wider font-medium">
                <Shield className="w-3 h-3 text-violet-400/60" />
                {lang === 'en' ? 'Password' : '密码'}
              </label>
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-violet-500/0 group-focus-within:from-cyan-500/30 group-focus-within:via-violet-500/20 group-focus-within:to-pink-500/30 transition-all duration-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative w-full px-4 py-3 pr-12 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:bg-white/[0.06] transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-cyan-300 transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-300 text-xs">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign In button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl font-medium overflow-hidden group disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* Button gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-500 via-cyan-500 to-violet-500"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Shine sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />
              <span className="relative flex items-center justify-center gap-2 text-white">
                {loading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    {lang === 'en' ? 'Initialize Session' : '初始化会话'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Forgot password link */}
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="text-cyan-400/60 hover:text-cyan-300 text-xs transition-colors"
            >
              <Mail className="w-3 h-3 inline mr-1" />
              {lang === 'en' ? 'Forgot Password?' : '忘记密码？'}
            </button>
          </motion.div>

          {/* Forgot Password Modal */}
          <AnimatePresence>
            {showReset && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="relative w-full max-w-sm rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/[0.08] p-6"
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                >
                  <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-cyan-400/40 to-transparent" />
                  <div className="absolute top-0 left-0 w-[1px] h-8 bg-gradient-to-b from-cyan-400/40 to-transparent" />
                  {resetSent ? (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                        <Mail className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">
                        {lang === 'en' ? 'Check Your Email' : '检查您的邮箱'}
                      </h3>
                      <p className="text-white/40 text-sm mb-4">
                        {lang === 'en'
                          ? 'If an account exists with that email, a password reset link has been sent.'
                          : '如果该邮箱存在账户，密码重置链接已发送。'}
                      </p>
                      <button
                        onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); }}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl text-sm"
                      >
                        {lang === 'en' ? 'Back to Login' : '返回登录'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleResetRequest}>
                      <h3 className="text-white font-semibold mb-2">
                        {lang === 'en' ? 'Reset Password' : '重置密码'}
                      </h3>
                      <p className="text-white/40 text-xs mb-4">
                        {lang === 'en'
                          ? 'Enter your personal email (Gmail, etc.) to receive a reset link.'
                          : '输入您的个人邮箱（Gmail等）以接收重置链接。'}
                      </p>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        className="w-full px-4 py-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30 mb-3"
                        required
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowReset(false); setResetEmail(''); }}
                          className="flex-1 py-2 rounded-xl text-sm border border-white/[0.08] text-white/60 hover:bg-white/[0.04] transition-all"
                        >
                          {lang === 'en' ? 'Cancel' : '取消'}
                        </button>
                        <button
                          type="submit"
                          disabled={resetLoading}
                          className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                        >
                          {resetLoading ? '...' : (lang === 'en' ? 'Send Reset Link' : '发送重置链接')}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo Accounts — always visible */}
          <motion.div
            className="mt-5 p-3 rounded-xl bg-gradient-to-br from-cyan-500/[0.06] to-violet-500/[0.06] border border-cyan-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-cyan-300/60 text-[10px] uppercase tracking-widest font-medium">
                {lang === 'en' ? 'Access Credentials' : '访问凭据'}
              </p>
            </div>
            <div className="text-white/35 text-[9px] text-center space-y-0.5 font-mono">
              <p><span className="text-cyan-300/70">myoadmin</span> / myo123 — Myo Min (Dev Admin)</p>
              <p><span className="text-violet-300/70">yuadmin</span> / yu123 — Yulius Herman (Finance)</p>
              <p><span className="text-pink-300/70">admin</span> / admin123 — System Admin</p>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="mt-4 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-white/20 text-[10px]">
              <div className="w-4 h-[1px] bg-gradient-to-r from-transparent to-white/20" />
              <span>© 2026 Unitech IT System • Singapore</span>
              <div className="w-4 h-[1px] bg-gradient-to-l from-transparent to-white/20" />
            </div>
            <span className="text-white/15 text-[9px] font-mono tracking-wider">v{APP_VERSION}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
