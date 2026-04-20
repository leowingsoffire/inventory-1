'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Play, Pause, Plus, Trash2, Settings, RefreshCw, CheckCircle, XCircle,
  Clock, AlertTriangle, TrendingUp, Shield, Bot, Activity, ChevronDown,
  ChevronRight, ToggleLeft, ToggleRight, FileText, Target, ArrowRight,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { t } from '@/lib/i18n';

interface AutomationRule {
  id: string; name: string; description: string | null; trigger: string;
  conditions: string; actions: string; priority: number; isActive: boolean;
  requiresApproval: boolean; autoApproveBelow: number | null;
  executionCount: number; lastExecutedAt: string | null;
  createdAt: string; updatedAt: string;
}

interface AutomationLog {
  id: string; ruleId: string; ruleName: string; trigger: string;
  entityId: string | null; entityType: string | null;
  action: string; result: string; details: string | null; executedAt: string;
}

interface AutomationStats {
  totalRules: number; activeRules: number; totalExecutions: number;
  autoApproved: number; escalatedToHuman: number; failedExecutions: number;
  automationRate: number;
}

const TRIGGER_LABELS: Record<string, { en: string; zh: string; icon: React.ElementType; color: string }> = {
  'ticket-created': { en: 'Ticket Created', zh: '工单创建', icon: FileText, color: 'text-blue-400' },
  'ticket-updated': { en: 'Ticket Updated', zh: '工单更新', icon: RefreshCw, color: 'text-cyan-400' },
  'asset-created': { en: 'Asset Added', zh: '资产添加', icon: Plus, color: 'text-green-400' },
  'asset-status-changed': { en: 'Asset Status Changed', zh: '资产状态变更', icon: Activity, color: 'text-teal-400' },
  'approval-created': { en: 'Approval Request', zh: '审批请求', icon: Shield, color: 'text-purple-400' },
  'warranty-expiring': { en: 'Warranty Expiring', zh: '保修到期', icon: AlertTriangle, color: 'text-amber-400' },
  'invoice-overdue': { en: 'Invoice Overdue', zh: '发票逾期', icon: Clock, color: 'text-red-400' },
  'sla-at-risk': { en: 'SLA At Risk', zh: 'SLA 风险', icon: AlertTriangle, color: 'text-orange-400' },
  'sla-breached': { en: 'SLA Breached', zh: 'SLA 违规', icon: XCircle, color: 'text-red-500' },
  'scheduled-task-due': { en: 'Scheduled Task Due', zh: '计划任务到期', icon: Clock, color: 'text-indigo-400' },
  'employee-onboarded': { en: 'Employee Onboarded', zh: '员工入职', icon: Plus, color: 'text-emerald-400' },
  'employee-offboarded': { en: 'Employee Offboarded', zh: '员工离职', icon: Trash2, color: 'text-rose-400' },
  'stock-low': { en: 'Stock Low', zh: '库存不足', icon: AlertTriangle, color: 'text-yellow-400' },
  'change-request-created': { en: 'Change Request', zh: '变更请求', icon: Settings, color: 'text-violet-400' },
  'contract-expiring': { en: 'Contract Expiring', zh: '合同到期', icon: Clock, color: 'text-pink-400' },
};

const ACTION_LABELS: Record<string, { en: string; zh: string }> = {
  'auto-assign': { en: 'Auto-Assign', zh: '自动分配' },
  'auto-approve': { en: 'Auto-Approve', zh: '自动审批' },
  'auto-escalate': { en: 'Auto-Escalate', zh: '自动升级' },
  'auto-notify': { en: 'Auto-Notify', zh: '自动通知' },
  'auto-create-ticket': { en: 'Auto-Create Ticket', zh: '自动创建工单' },
  'auto-create-po': { en: 'Auto-Create PO', zh: '自动创建采购单' },
  'auto-provision': { en: 'Auto-Provision', zh: '自动配置' },
  'auto-deprovision': { en: 'Auto-Deprovision', zh: '自动回收' },
  'auto-update-status': { en: 'Auto-Update Status', zh: '自动更新状态' },
  'auto-schedule': { en: 'Auto-Schedule', zh: '自动安排' },
  'flag-for-review': { en: 'Flag for Review', zh: '标记人工审核' },
};

const RESULT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'success': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: '✅ Auto' },
  'pending-approval': { bg: 'bg-amber-500/15', text: 'text-amber-400', label: '👤 Human' },
  'failed': { bg: 'bg-red-500/15', text: 'text-red-400', label: '❌ Failed' },
  'skipped': { bg: 'bg-white/5', text: 'text-white/40', label: '⏭ Skipped' },
};

export default function AutomationPage() {
  const { lang } = useApp();
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [tab, setTab] = useState<'overview' | 'rules' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, rulesRes, logsRes] = await Promise.all([
        fetch('/api/automation?view=stats'),
        fetch('/api/automation'),
        fetch('/api/automation?view=logs&limit=50'),
      ]);
      const statsData = await statsRes.json();
      const rulesData = await rulesRes.json();
      const logsData = await logsRes.json();
      setStats(statsData);
      setRules(rulesData.rules || []);
      setLogs(logsData.logs || []);
    } catch (err) {
      console.error('Failed to fetch automation data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Seed defaults if no rules exist
  useEffect(() => {
    if (!loading && rules.length === 0) {
      fetch('/api/automation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'seed' }) })
        .then(() => fetchData());
    }
  }, [loading, rules.length, fetchData]);

  const runAutomation = async () => {
    setRunning(true);
    try {
      await fetch('/api/automation/run', { method: 'POST' });
      await fetchData();
    } finally {
      setRunning(false);
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    await fetch(`/api/automation/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await fetchData();
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/automation/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const addRule = async (data: { name: string; trigger: string; description: string; actions: { type: string; params: Record<string, unknown> }[]; requiresApproval: boolean }) => {
    await fetch('/api/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setShowAddRule(false);
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Zap className="w-8 h-8 text-amber-400" />
        </motion.div>
      </div>
    );
  }

  const automationRate = stats?.automationRate ?? 90;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(255,200,50,0.15), rgba(255,150,30,0.08))' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="w-6 h-6" style={{ color: '#ffc850' }} />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">{lang === 'en' ? 'Automation Center' : '自动化中心'}</h1>
            <p className="text-white/40 text-sm">{lang === 'en' ? '90% automated • 10% human approval' : '90% 自动化 • 10% 人工审批'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={runAutomation}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/90 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, rgba(255,200,50,0.2), rgba(255,150,30,0.1))', border: '1px solid rgba(255,200,60,0.25)' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {lang === 'en' ? 'Run All Checks' : '运行所有检查'}
          </motion.button>
          <motion.button
            onClick={() => setShowAddRule(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-sm font-medium text-emerald-300 hover:bg-emerald-500/25 transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus className="w-4 h-4" />
            {lang === 'en' ? 'Add Rule' : '添加规则'}
          </motion.button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: lang === 'en' ? 'Automation Rate' : '自动化率', value: `${automationRate}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'from-amber-500/15 to-yellow-500/8' },
          { label: lang === 'en' ? 'Active Rules' : '活跃规则', value: stats?.activeRules ?? 0, icon: Zap, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-teal-500/8' },
          { label: lang === 'en' ? 'Total Executed' : '总执行数', value: stats?.totalExecutions ?? 0, icon: Activity, color: 'text-blue-400', bg: 'from-blue-500/15 to-cyan-500/8' },
          { label: lang === 'en' ? 'Auto-Approved' : '自动审批', value: stats?.autoApproved ?? 0, icon: CheckCircle, color: 'text-green-400', bg: 'from-green-500/15 to-emerald-500/8' },
          { label: lang === 'en' ? 'Human Review' : '人工审核', value: stats?.escalatedToHuman ?? 0, icon: Shield, color: 'text-purple-400', bg: 'from-purple-500/15 to-violet-500/8' },
          { label: lang === 'en' ? 'Failed' : '失败', value: stats?.failedExecutions ?? 0, icon: XCircle, color: 'text-red-400', bg: 'from-red-500/15 to-rose-500/8' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            className={`glass-card p-4 rounded-xl bg-gradient-to-br ${kpi.bg}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-white/40 text-xs mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Automation Rate Progress Bar */}
      <div className="glass-card p-5 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" style={{ color: '#ffc850' }} />
            <span className="text-white font-medium">{lang === 'en' ? 'Automation vs Human Decision' : '自动化 vs 人工决策'}</span>
          </div>
          <span className="text-amber-400 font-bold text-lg">{automationRate}% {lang === 'en' ? 'Automated' : '自动化'}</span>
        </div>
        <div className="w-full h-4 rounded-full bg-white/5 overflow-hidden relative">
          <motion.div
            className="h-full rounded-full relative"
            style={{ background: 'linear-gradient(90deg, #22c55e, #ffc850, #ffd700)' }}
            initial={{ width: 0 }}
            animate={{ width: `${automationRate}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            />
          </motion.div>
          {/* 10% Human marker */}
          <div className="absolute right-0 top-0 h-full w-[10%] bg-purple-500/20 rounded-r-full flex items-center justify-center">
            <span className="text-[9px] text-purple-300 font-medium">👤 10%</span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/30">
          <span>🤖 {lang === 'en' ? 'Fully Automated' : '完全自动'}</span>
          <span>👤 {lang === 'en' ? 'Your Approval Only' : '仅需您批准'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        {(['overview', 'rules', 'logs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            {t === 'overview' ? (lang === 'en' ? '📊 Overview' : '📊 概览') : t === 'rules' ? (lang === 'en' ? '⚙️ Rules Engine' : '⚙️ 规则引擎') : (lang === 'en' ? '📋 Execution Logs' : '📋 执行日志')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* What gets automated vs what needs approval */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card p-5 rounded-xl border border-emerald-500/15">
                <h3 className="text-emerald-400 font-medium mb-3 flex items-center gap-2"><Bot className="w-4 h-4" /> {lang === 'en' ? '🤖 Auto-Handled (90%)' : '🤖 自动处理 (90%)'}</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  {[
                    lang === 'en' ? 'Low-value purchase approvals (< $500)' : '低价值采购审批 (< $500)',
                    lang === 'en' ? 'Ticket auto-assignment by priority' : '按优先级自动分配工单',
                    lang === 'en' ? 'SLA breach auto-escalation' : 'SLA 违规自动升级',
                    lang === 'en' ? 'Warranty expiry alerts' : '保修到期提醒',
                    lang === 'en' ? 'Scheduled maintenance execution' : '计划维护执行',
                    lang === 'en' ? 'Employee onboarding IT provisioning' : '员工入职 IT 配置',
                    lang === 'en' ? 'Employee offboarding asset collection' : '员工离职资产回收',
                    lang === 'en' ? 'Invoice overdue status updates' : '逾期发票状态更新',
                    lang === 'en' ? 'Standard change request approvals' : '标准变更请求审批',
                    lang === 'en' ? 'Low stock procurement alerts' : '低库存采购提醒',
                    lang === 'en' ? 'Contract renewal notifications' : '合同续签通知',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-5 rounded-xl border border-purple-500/15">
                <h3 className="text-purple-400 font-medium mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> {lang === 'en' ? '👤 Your Approval (10%)' : '👤 您的审批 (10%)'}</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  {[
                    lang === 'en' ? 'High-value purchases (≥ $500)' : '高价值采购 (≥ $500)',
                    lang === 'en' ? 'Emergency change requests' : '紧急变更请求',
                    lang === 'en' ? 'Large procurement orders' : '大额采购订单',
                    lang === 'en' ? 'Policy exceptions & overrides' : '策略例外和覆盖',
                    lang === 'en' ? 'New automation rule activation' : '新自动化规则激活',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Automation Flow Diagram */}
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-white font-medium mb-4">{lang === 'en' ? '⚡ How It Works' : '⚡ 工作原理'}</h3>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                {[
                  { icon: Target, label: lang === 'en' ? 'Event Triggered' : '事件触发', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { icon: Settings, label: lang === 'en' ? 'Rules Evaluated' : '规则评估', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                  { icon: Bot, label: lang === 'en' ? 'Auto-Execute 90%' : '自动执行 90%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { icon: Shield, label: lang === 'en' ? 'Human Review 10%' : '人工审核 10%', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { icon: CheckCircle, label: lang === 'en' ? 'Action Completed' : '操作完成', color: 'text-green-400', bg: 'bg-green-500/10' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`${step.bg} border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2`}>
                      <step.icon className={`w-4 h-4 ${step.color}`} />
                      <span className="text-white/70">{step.label}</span>
                    </div>
                    {i < 4 && <ChevronRight className="w-4 h-4 text-white/20" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'rules' && (
          <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {rules.map((rule, i) => {
              const triggerInfo = TRIGGER_LABELS[rule.trigger] || { en: rule.trigger, zh: rule.trigger, icon: Settings, color: 'text-white/60' };
              const TriggerIcon = triggerInfo.icon;
              const actions: { type: string; params: Record<string, unknown> }[] = JSON.parse(rule.actions || '[]');
              const isExpanded = expandedRule === rule.id;

              return (
                <motion.div
                  key={rule.id}
                  className={`glass-card rounded-xl overflow-hidden border ${rule.isActive ? 'border-emerald-500/15' : 'border-white/5 opacity-60'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedRule(isExpanded ? null : rule.id)}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <TriggerIcon className={`w-5 h-5 ${triggerInfo.color} flex-shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{rule.name}</p>
                        <p className="text-white/30 text-xs truncate">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {rule.requiresApproval && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-medium">
                          {lang === 'en' ? '10% HUMAN' : '10% 人工'}
                        </span>
                      )}
                      <span className="text-white/30 text-xs">{rule.executionCount}x</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleRule(rule.id, !!rule.isActive); }}
                        className="transition-colors"
                      >
                        {rule.isActive ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-white/20" />}
                      </button>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5"
                      >
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div><span className="text-white/30">{lang === 'en' ? 'Trigger' : '触发'}</span><br /><span className="text-white/70">{lang === 'en' ? triggerInfo.en : triggerInfo.zh}</span></div>
                            <div><span className="text-white/30">{lang === 'en' ? 'Priority' : '优先级'}</span><br /><span className="text-white/70">{rule.priority}</span></div>
                            <div><span className="text-white/30">{lang === 'en' ? 'Executions' : '执行次数'}</span><br /><span className="text-white/70">{rule.executionCount}</span></div>
                            <div><span className="text-white/30">{lang === 'en' ? 'Last Run' : '上次运行'}</span><br /><span className="text-white/70">{rule.lastExecutedAt ? new Date(rule.lastExecutedAt).toLocaleString() : 'Never'}</span></div>
                          </div>

                          <div>
                            <span className="text-white/30 text-xs">{lang === 'en' ? 'Actions:' : '动作:'}</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {actions.map((a, j) => {
                                const actionLabel = ACTION_LABELS[a.type] || { en: a.type, zh: a.type };
                                return (
                                  <span key={j} className="px-2 py-1 rounded-md bg-white/5 text-white/60 text-xs">
                                    {lang === 'en' ? actionLabel.en : actionLabel.zh}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {rule.autoApproveBelow && (
                            <div className="text-xs text-amber-400/70">
                              ⚡ {lang === 'en' ? `Auto-approve below $${rule.autoApproveBelow}` : `$${rule.autoApproveBelow} 以下自动审批`}
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              {lang === 'en' ? 'Delete' : '删除'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {tab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {logs.length === 0 ? (
              <div className="glass-card p-8 rounded-xl text-center text-white/30">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p>{lang === 'en' ? 'No automation logs yet. Click "Run All Checks" to start.' : '暂无自动化日志。点击"运行所有检查"开始。'}</p>
              </div>
            ) : (
              logs.map((log, i) => {
                const resultStyle = RESULT_STYLES[log.result] || RESULT_STYLES['skipped'];
                const actionLabel = ACTION_LABELS[log.action] || { en: log.action, zh: log.action };
                return (
                  <motion.div
                    key={log.id}
                    className="glass-card p-3 rounded-xl flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <span className={`px-2 py-0.5 rounded-full ${resultStyle.bg} ${resultStyle.text} text-[10px] font-medium flex-shrink-0`}>
                      {resultStyle.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm truncate">{log.ruleName}</p>
                      <p className="text-white/30 text-xs truncate">{lang === 'en' ? actionLabel.en : actionLabel.zh} — {log.details}</p>
                    </div>
                    <span className="text-white/20 text-xs flex-shrink-0">{new Date(log.executedAt).toLocaleString()}</span>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showAddRule && <AddRuleModal lang={lang} onClose={() => setShowAddRule(false)} onAdd={addRule} />}
      </AnimatePresence>
    </div>
  );
}

function AddRuleModal({ lang, onClose, onAdd }: { lang: string; onClose: () => void; onAdd: (data: { name: string; trigger: string; description: string; actions: { type: string; params: Record<string, unknown> }[]; requiresApproval: boolean }) => Promise<void> }) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('ticket-created');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState('auto-assign');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({ name, trigger, description, actions: [{ type: actionType, params: {} }], requiresApproval });
    setSaving(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card p-6 rounded-2xl w-full max-w-md border border-white/10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-4">{lang === 'en' ? '➕ New Automation Rule' : '➕ 新自动化规则'}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-white/40 text-xs">{lang === 'en' ? 'Rule Name' : '规则名称'}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-amber-500/30" placeholder={lang === 'en' ? 'e.g. Auto-assign network tickets' : '例如：自动分配网络工单'} />
          </div>
          <div>
            <label className="text-white/40 text-xs">{lang === 'en' ? 'Trigger Event' : '触发事件'}</label>
            <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none">
              {Object.entries(TRIGGER_LABELS).map(([key, val]) => (
                <option key={key} value={key} className="bg-gray-900">{lang === 'en' ? val.en : val.zh}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-white/40 text-xs">{lang === 'en' ? 'Action' : '动作'}</label>
            <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none">
              {Object.entries(ACTION_LABELS).map(([key, val]) => (
                <option key={key} value={key} className="bg-gray-900">{lang === 'en' ? val.en : val.zh}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-white/40 text-xs">{lang === 'en' ? 'Description' : '描述'}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none resize-none h-16" />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} className="rounded" />
            {lang === 'en' ? 'Requires human approval (10% path)' : '需要人工审批 (10% 路径)'}
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white/40 text-sm hover:bg-white/10 transition-colors">{lang === 'en' ? 'Cancel' : '取消'}</button>
          <button onClick={handleSubmit} disabled={saving || !name.trim()} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
            {saving ? '...' : (lang === 'en' ? 'Create Rule' : '创建规则')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
