'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Lock, Check, AlertCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, lang } = useApp();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Reset failed');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/'), 3000);
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} animated-gradient flex items-center justify-center p-4`}>
      <motion.div
        className="glass-card p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-500/20 border border-accent-400/30 mb-3">
            <Lock className="w-7 h-7 text-accent-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {lang === 'en' ? 'Reset Password' : '重置密码'}
          </h1>
          <p className="text-white/50 text-sm mt-1">Unitech IT System</p>
        </div>

        {success ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-white font-medium mb-2">
              {lang === 'en' ? 'Password Reset Successfully!' : '密码重置成功！'}
            </p>
            <p className="text-white/50 text-sm">
              {lang === 'en' ? 'Redirecting to login...' : '正在跳转到登录页...'}
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-red-300 text-xs">{error}</span>
              </div>
            )}
            <div>
              <label className="block text-white/70 text-sm mb-1.5">
                {lang === 'en' ? 'New Password' : '新密码'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">
                {lang === 'en' ? 'Confirm Password' : '确认密码'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? '...' : (lang === 'en' ? 'Reset Password' : '重置密码')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-2 text-white/50 hover:text-white/70 text-sm transition-colors"
            >
              {lang === 'en' ? 'Back to Login' : '返回登录'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
