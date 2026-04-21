'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Camera, Save, Lock, Mail, Shield, Eye, EyeOff, Check, X, Briefcase,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { useAuth } from '@/lib/auth-context';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function ProfilePage() {
  const { lang } = useApp();
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || '');
  const [personalEmail, setPersonalEmail] = useState(user?.personalEmail || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  // Photo upload
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, personalEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }
      updateUser({ displayName, personalEmail });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (newPassword.length < 6) {
      setPwError(lang === 'en' ? 'Password must be at least 6 characters' : '密码至少需要6个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(lang === 'en' ? 'Passwords do not match' : '密码不匹配');
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPwError(data.error || 'Failed to change password');
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2000);
    } catch {
      setPwError('Network error');
    } finally {
      setPwSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('userId', user.id);
      const res = await fetch('/api/users/photo', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        updateUser({ profilePhoto: data.profilePhoto });
      }
    } catch { /* silent */ } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    technician: 'Technician',
    viewer: 'Viewer',
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
              <User className="w-6 h-6 text-violet-400" />
            </div>
            {lang === 'en' ? 'My Profile' : '我的资料'}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {lang === 'en' ? 'Manage your account settings and preferences' : '管理您的账户设置和偏好'}
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div className="glass-card p-6" custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Photo */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/15 bg-white/5 flex items-center justify-center">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-white/25" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg font-bold text-white">{user.displayName || user.name}</h2>
              <p className="text-white/40 text-sm">@{user.username}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                <span className="px-2.5 py-0.5 rounded-full bg-accent-500/15 border border-accent-500/25 text-accent-400 text-[11px] font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {roleLabel[user.role] || user.role}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium">
                  {user.isActive ? (lang === 'en' ? 'Active' : '活跃') : (lang === 'en' ? 'Inactive' : '未激活')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Profile */}
        <motion.div className="glass-card p-6" custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400" />
            {lang === 'en' ? 'Profile Information' : '个人信息'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-1 block">{lang === 'en' ? 'Display Name' : '显示名称'}</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="glass-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">{lang === 'en' ? 'Username' : '用户名'}</label>
              <input value={user.username} disabled className="glass-input w-full px-3 py-2 text-sm opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {lang === 'en' ? 'Work Email' : '工作邮箱'}
              </label>
              <input value={user.email} disabled className="glass-input w-full px-3 py-2 text-sm opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {lang === 'en' ? 'Personal Email' : '个人邮箱'}
              </label>
              <input
                value={personalEmail}
                onChange={e => setPersonalEmail(e.target.value)}
                className="glass-input w-full px-3 py-2 text-sm"
                placeholder="optional@email.com"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <motion.button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-4 px-4 py-2 rounded-xl bg-accent-500/20 border border-accent-500/30 text-accent-400 text-xs font-medium flex items-center gap-2 hover:bg-accent-500/30 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            {saved ? <><Check className="w-3.5 h-3.5" /> {lang === 'en' ? 'Saved!' : '已保存！'}</> : <><Save className="w-3.5 h-3.5" /> {lang === 'en' ? 'Save Changes' : '保存更改'}</>}
          </motion.button>
        </motion.div>

        {/* Change Password */}
        <motion.div className="glass-card p-6" custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            {lang === 'en' ? 'Change Password' : '修改密码'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-white/40 text-xs mb-1 block">{lang === 'en' ? 'New Password' : '新密码'}</label>
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="glass-input w-full px-3 py-2 text-sm pr-10"
                placeholder="••••••••"
              />
              <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-7 text-white/30 hover:text-white/60">
                {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">{lang === 'en' ? 'Confirm Password' : '确认密码'}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="glass-input w-full px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>
          {pwError && <p className="text-red-400 text-xs mt-2">{pwError}</p>}
          <motion.button
            onClick={handleChangePassword}
            disabled={pwSaving || !newPassword}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-2 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            {pwSaved ? <><Check className="w-3.5 h-3.5" /> {lang === 'en' ? 'Changed!' : '已修改！'}</> : <><Lock className="w-3.5 h-3.5" /> {lang === 'en' ? 'Update Password' : '更新密码'}</>}
          </motion.button>
        </motion.div>

        {/* Account Info */}
        <motion.div className="glass-card p-6" custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            {lang === 'en' ? 'Account Details' : '账户详情'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: lang === 'en' ? 'User ID' : '用户ID', value: user.id.slice(0, 8) + '...' },
              { label: lang === 'en' ? 'Role' : '角色', value: roleLabel[user.role] || user.role },
              { label: lang === 'en' ? 'Status' : '状态', value: user.isActive ? (lang === 'en' ? 'Active' : '活跃') : (lang === 'en' ? 'Inactive' : '未激活') },
              { label: lang === 'en' ? 'Email' : '邮箱', value: user.email },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-white/30 text-[10px] mb-0.5">{item.label}</p>
                <p className="text-white/70 text-xs font-medium truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
