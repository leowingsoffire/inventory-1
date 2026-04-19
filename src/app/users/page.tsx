'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Plus, Edit2, Trash2, X, Check, ChevronDown,
  UserCog, Lock, Unlock, Eye, EyeOff, Save, ToggleLeft, ToggleRight,
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';
import {
  ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, RESOURCES, RESOURCE_LABELS,
  DEFAULT_PERMISSIONS, type RoleKey, type Resource, type PermissionSet, type RolePermissions,
} from '@/lib/rbac';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  isActive: boolean;
  permissions: Partial<RolePermissions>;
  lastLogin?: string;
}

const sampleUsers: UserAccount[] = [
  { id: '1', name: 'Admin User', email: 'admin@unitech.sg', role: 'dev_admin', isActive: true, permissions: {}, lastLogin: '2026-04-19 09:30' },
  { id: '2', name: 'Sarah Lim', email: 'sarah@unitech.sg', role: 'tenant_admin', isActive: true, permissions: {}, lastLogin: '2026-04-18 14:20' },
  { id: '3', name: 'Tan Wei Ming', email: 'weiming@unitech.sg', role: 'engineer', isActive: true, permissions: {}, lastLogin: '2026-04-19 08:45' },
  { id: '4', name: 'Ahmad Rahman', email: 'ahmad@unitech.sg', role: 'engineer', isActive: true, permissions: {}, lastLogin: '2026-04-17 16:10' },
  { id: '5', name: 'Kumar Patel', email: 'kumar@unitech.sg', role: 'engineer', isActive: false, permissions: {}, lastLogin: '2026-03-25 11:00' },
];

const PERM_LABELS = {
  canCreate: { en: 'Create', zh: '创建' },
  canRead: { en: 'Read', zh: '读取' },
  canUpdate: { en: 'Update', zh: '更新' },
  canDelete: { en: 'Delete', zh: '删除' },
};

function getEffectivePermissions(user: UserAccount): RolePermissions {
  const base = { ...DEFAULT_PERMISSIONS[user.role] };
  // Override with user-specific permissions
  for (const [resource, perms] of Object.entries(user.permissions)) {
    if (perms) {
      base[resource as Resource] = { ...base[resource as Resource], ...perms };
    }
  }
  return base;
}

export default function RBACPage() {
  const { lang } = useApp();
  const [users, setUsers] = useState<UserAccount[]>(sampleUsers);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editPerms, setEditPerms] = useState<RolePermissions | null>(null);
  const [saved, setSaved] = useState(false);

  // New user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<RoleKey>('engineer');

  const handleToggleActive = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  const handleSelectUser = (user: UserAccount) => {
    setSelectedUser(user);
    setEditPerms(getEffectivePermissions(user));
  };

  const handlePermToggle = (resource: Resource, perm: keyof PermissionSet) => {
    if (!editPerms) return;
    setEditPerms({
      ...editPerms,
      [resource]: { ...editPerms[resource], [perm]: !editPerms[resource][perm] },
    });
  };

  const handleSavePerms = () => {
    if (!selectedUser || !editPerms) return;
    const basePerms = DEFAULT_PERMISSIONS[selectedUser.role];
    const overrides: Partial<RolePermissions> = {};
    for (const resource of RESOURCES) {
      const base = basePerms[resource];
      const edited = editPerms[resource];
      if (JSON.stringify(base) !== JSON.stringify(edited)) {
        overrides[resource] = edited;
      }
    }
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, permissions: overrides } : u));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const newUser: UserAccount = {
      id: String(Date.now()),
      name: newName,
      email: newEmail,
      role: newRole,
      isActive: true,
      permissions: {},
    };
    setUsers(prev => [...prev, newUser]);
    setNewName('');
    setNewEmail('');
    setNewRole('engineer');
    setShowAddUser(false);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (selectedUser?.id === userId) {
      setSelectedUser(null);
      setEditPerms(null);
    }
  };

  const handleRoleChange = (userId: string, role: RoleKey) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role, permissions: {} } : u));
    if (selectedUser?.id === userId) {
      const updated = { ...selectedUser, role, permissions: {} };
      setSelectedUser(updated);
      setEditPerms(getEffectivePermissions(updated));
    }
  };

  const roleColors: Record<RoleKey, string> = {
    dev_admin: 'bg-red-500/20 text-red-300 border-red-500/30',
    tenant_admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    engineer: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-amber-400" />
              {lang === 'en' ? 'User & Role Management' : '用户与角色管理'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {lang === 'en' ? 'Manage user accounts, roles, and granular permissions' : '管理用户账户、角色和细粒度权限'}
            </p>
          </div>
          <motion.button
            onClick={() => setShowAddUser(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            {lang === 'en' ? 'Add User' : '添加用户'}
          </motion.button>
        </div>

        {/* Role Legend */}
        <div className="flex flex-wrap gap-3">
          {(Object.keys(ROLES) as Array<keyof typeof ROLES>).map(roleKey => {
            const role = ROLES[roleKey];
            return (
              <div key={role} className="glass-card p-3 flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <UserCog className="w-4 h-4 text-white/60" />
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${roleColors[role]}`}>
                    {ROLE_LABELS[role][lang]}
                  </span>
                </div>
                <p className="text-white/40 text-[11px] leading-relaxed">{ROLE_DESCRIPTIONS[role][lang]}</p>
              </div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              {lang === 'en' ? 'Users' : '用户'} ({users.length})
            </h3>
            {users.map((user) => (
              <motion.div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`glass-card p-3 cursor-pointer transition-all ${
                  selectedUser?.id === user.id ? 'ring-2 ring-white/30 bg-white/15' : 'hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      user.isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${user.isActive ? 'text-white' : 'text-white/40'}`}>
                        {user.name}
                      </p>
                      <p className="text-white/30 text-[10px]">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${roleColors[user.role]}`}>
                      {ROLE_LABELS[user.role][lang]}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(user.id); }}
                      className="text-white/30 hover:text-white/60 transition-colors"
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive
                        ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                        : <ToggleLeft className="w-5 h-5 text-gray-500" />
                      }
                    </button>
                  </div>
                </div>
                {user.lastLogin && (
                  <p className="text-white/20 text-[9px] mt-1 ml-11">
                    {lang === 'en' ? 'Last login: ' : '最后登录：'}{user.lastLogin}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Permission Editor */}
          <div className="lg:col-span-2">
            {selectedUser && editPerms ? (
              <motion.div className="glass-card p-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      {lang === 'en' ? 'Permissions for ' : '权限设置：'}{selectedUser.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/40 text-xs">{lang === 'en' ? 'Role:' : '角色：'}</span>
                      <select
                        value={selectedUser.role}
                        onChange={(e) => handleRoleChange(selectedUser.id, e.target.value as RoleKey)}
                        className="glass-input px-2 py-1 text-xs"
                      >
                        {Object.values(ROLES).map(r => (
                          <option key={r} value={r} className="bg-gray-900">{ROLE_LABELS[r][lang]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Permission Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-white/40 text-xs font-medium w-40">
                          {lang === 'en' ? 'Resource' : '资源'}
                        </th>
                        {Object.entries(PERM_LABELS).map(([key, label]) => (
                          <th key={key} className="text-center py-2 text-white/40 text-xs font-medium w-20">
                            {label[lang]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RESOURCES.map((resource) => (
                        <tr key={resource} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2 text-white/70 text-xs">{RESOURCE_LABELS[resource][lang]}</td>
                          {(['canCreate', 'canRead', 'canUpdate', 'canDelete'] as const).map(perm => (
                            <td key={perm} className="text-center py-2">
                              <button
                                onClick={() => handlePermToggle(resource, perm)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                  editPerms[resource][perm]
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/5 text-white/20 border border-white/10 hover:border-white/20'
                                }`}
                              >
                                {editPerms[resource][perm] ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Save Button */}
                <div className="mt-4 flex justify-end">
                  <motion.button
                    onClick={handleSavePerms}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <AnimatePresence mode="wait">
                      {saved ? (
                        <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <Check className="w-4 h-4" /> {lang === 'en' ? 'Saved!' : '已保存！'}
                        </motion.span>
                      ) : (
                        <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <Save className="w-4 h-4" /> {lang === 'en' ? 'Save Permissions' : '保存权限'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <Shield className="w-12 h-12 text-white/10 mb-3" />
                <p className="text-white/30 text-sm">
                  {lang === 'en' ? 'Select a user to manage permissions' : '选择用户以管理权限'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add User Modal */}
        <AnimatePresence>
          {showAddUser && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="glass-card p-6 w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">{lang === 'en' ? 'Add New User' : '添加新用户'}</h3>
                  <button onClick={() => setShowAddUser(false)} className="text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={lang === 'en' ? 'Full Name' : '姓名'} className="glass-input w-full px-4 py-3 text-sm" />
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={lang === 'en' ? 'Email' : '邮箱'} type="email" className="glass-input w-full px-4 py-3 text-sm" />
                  <select value={newRole} onChange={e => setNewRole(e.target.value as RoleKey)} className="glass-input w-full px-4 py-3 text-sm">
                    {Object.values(ROLES).map(r => (
                      <option key={r} value={r} className="bg-gray-900">{ROLE_LABELS[r][lang]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => setShowAddUser(false)} className="glass-button px-4 py-2 text-sm">{lang === 'en' ? 'Cancel' : '取消'}</button>
                  <motion.button
                    onClick={handleAddUser}
                    disabled={!newName.trim() || !newEmail.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {lang === 'en' ? 'Add User' : '添加用户'}
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
