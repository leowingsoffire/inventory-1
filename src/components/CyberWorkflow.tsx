'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, CheckCircle, Circle, ArrowRight, Zap, ThumbsUp, ThumbsDown,
  ChevronRight, Sparkles, AlertTriangle, Clock, Play,
} from 'lucide-react';

export interface WorkflowStep {
  id: string;
  label: string;
  labelZh?: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'current' | 'upcoming' | 'skipped';
  description?: string;
  descriptionZh?: string;
}

export interface AIAction {
  id: string;
  label: string;
  labelZh?: string;
  description: string;
  descriptionZh?: string;
  priority: 'high' | 'medium' | 'low';
  type: 'auto' | 'approval';
}

export interface WorkflowDefinition {
  id: string;
  title: string;
  titleZh?: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: WorkflowStep[];
  aiActions: AIAction[];
}

interface CyberWorkflowProps {
  workflow: WorkflowDefinition;
  lang?: string;
  onApprove?: (actionId: string) => void;
  onReject?: (actionId: string) => void;
  onExecute?: (actionId: string) => void;
  compact?: boolean;
}

const priorityConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-red-500/20', label: 'Urgent', labelZh: '紧急' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/20', label: 'Normal', labelZh: '普通' },
  low: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/20', label: 'Low', labelZh: '低' },
};

export function CyberWorkflow({ workflow, lang = 'en', onApprove, onReject, onExecute, compact = false }: CyberWorkflowProps) {
  const [approvedActions, setApprovedActions] = useState<Set<string>>(new Set());
  const [rejectedActions, setRejectedActions] = useState<Set<string>>(new Set());
  const isZh = lang === 'zh';
  const Icon = workflow.icon;
  const currentStepIndex = workflow.steps.findIndex(s => s.status === 'current');

  const handleApprove = (actionId: string) => {
    setApprovedActions(prev => new Set([...prev, actionId]));
    onApprove?.(actionId);
  };

  const handleReject = (actionId: string) => {
    setRejectedActions(prev => new Set([...prev, actionId]));
    onReject?.(actionId);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Cyber border glow */}
      <div className="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-cyan-400/50 to-transparent" />
      <div className="absolute top-0 left-0 w-[1px] h-16 bg-gradient-to-b from-cyan-400/50 to-transparent" />
      <div className="absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-violet-400/50 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[1px] h-16 bg-gradient-to-t from-violet-400/50 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
        <motion.div
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Icon className="w-4.5 h-4.5 text-cyan-400" />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-white text-sm font-semibold flex items-center gap-2">
            {isZh && workflow.titleZh ? workflow.titleZh : workflow.title}
            <motion.span
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isZh ? '实时' : 'Live'}
            </motion.span>
          </h3>
          <p className="text-white/30 text-[10px]">
            {isZh ? `步骤 ${currentStepIndex + 1}/${workflow.steps.length}` : `Step ${currentStepIndex + 1} of ${workflow.steps.length}`}
          </p>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className={`p-4 ${compact ? '' : 'pb-2'}`}>
        <div className="flex items-center gap-1">
          {workflow.steps.map((step, i) => {
            const StepIcon = step.icon;
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isLast = i === workflow.steps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                {/* Step node */}
                <motion.div
                  className="relative flex flex-col items-center group"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring' as const, stiffness: 300 }}
                >
                  {/* Glow ring for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 -m-1.5 rounded-full bg-cyan-400/20"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Node circle */}
                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    isCompleted
                      ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border-emerald-500/40'
                      : isCurrent
                        ? 'bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-cyan-400/50'
                        : 'bg-white/[0.03] border-white/[0.08]'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                        <StepIcon className="w-4 h-4 text-cyan-400" />
                      </motion.div>
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-white/20" />
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-[9px] mt-1.5 text-center leading-tight max-w-[60px] ${
                    isCurrent ? 'text-cyan-300 font-medium' : isCompleted ? 'text-emerald-400/70' : 'text-white/25'
                  }`}>
                    {isZh && step.labelZh ? step.labelZh : step.label}
                  </span>
                </motion.div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-[1px] mx-1 relative mt-[-14px]">
                    <div className={`absolute inset-0 ${isCompleted ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />
                    {isCurrent && (
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400/60 to-transparent"
                        animate={{ width: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Actions Panel */}
      {workflow.aiActions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Bot className="w-3.5 h-3.5 text-violet-400" />
            </motion.div>
            <span className="text-violet-300/80 text-[10px] uppercase tracking-widest font-medium">
              {isZh ? 'AI 建议操作' : 'AI Suggested Actions'}
            </span>
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          <div className="space-y-2">
            {workflow.aiActions.map((action, i) => {
              const isApproved = approvedActions.has(action.id);
              const isRejected = rejectedActions.has(action.id);
              const prio = priorityConfig[action.priority];

              return (
                <motion.div
                  key={action.id}
                  className={`relative rounded-xl border p-3 transition-all ${
                    isApproved
                      ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                      : isRejected
                        ? 'bg-red-500/[0.04] border-red-500/10 opacity-50'
                        : `bg-white/[0.02] ${prio.border}`
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-start gap-2.5">
                    <motion.div
                      className={`w-6 h-6 rounded-lg ${prio.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                      animate={!isApproved && !isRejected ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    >
                      {action.type === 'auto' ? (
                        <Zap className={`w-3 h-3 ${prio.color}`} />
                      ) : (
                        <Sparkles className={`w-3 h-3 ${prio.color}`} />
                      )}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-xs font-medium">
                          {isZh && action.labelZh ? action.labelZh : action.label}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${prio.bg} ${prio.color} border ${prio.border}`}>
                          {isZh ? prio.labelZh : prio.label}
                        </span>
                      </div>
                      <p className="text-white/40 text-[10px] leading-relaxed">
                        {isZh && action.descriptionZh ? action.descriptionZh : action.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <AnimatePresence mode="wait">
                        {isApproved ? (
                          <motion.div
                            key="approved"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 text-emerald-400 text-[10px]"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{isZh ? '已批准' : 'Approved'}</span>
                          </motion.div>
                        ) : isRejected ? (
                          <motion.div
                            key="rejected"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-red-400/50 text-[10px]"
                          >
                            {isZh ? '已拒绝' : 'Declined'}
                          </motion.div>
                        ) : (
                          <motion.div key="buttons" className="flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {action.type === 'approval' ? (
                              <>
                                <motion.button
                                  onClick={() => handleApprove(action.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title={isZh ? '批准' : 'Approve'}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleReject(action.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title={isZh ? '拒绝' : 'Reject'}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </motion.button>
                              </>
                            ) : (
                              <motion.button
                                onClick={() => { handleApprove(action.id); onExecute?.(action.id); }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[10px] transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Play className="w-2.5 h-2.5" />
                                {isZh ? '执行' : 'Run'}
                              </motion.button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Compact workflow status bar for page headers
export function WorkflowStatusBar({ workflow, lang = 'en' }: { workflow: WorkflowDefinition; lang?: string }) {
  const isZh = lang === 'zh';
  const currentStep = workflow.steps.find(s => s.status === 'current');
  const completedCount = workflow.steps.filter(s => s.status === 'completed').length;
  const progress = (completedCount / workflow.steps.length) * 100;

  return (
    <motion.div
      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/30 border border-white/[0.06]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Progress ring */}
        <div className="relative w-6 h-6 flex-shrink-0">
          <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
            <motion.circle
              cx="12" cy="12" r="10" fill="none" stroke="url(#cyberGrad)" strokeWidth="2"
              strokeLinecap="round" strokeDasharray={62.8}
              initial={{ strokeDashoffset: 62.8 }}
              animate={{ strokeDashoffset: 62.8 - (62.8 * progress / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-cyan-300 font-bold">
            {completedCount}
          </span>
        </div>

        {/* Current step */}
        {currentStep && (
          <div className="flex items-center gap-1.5 text-[10px] min-w-0">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-white/50 truncate">
              {isZh ? '当前：' : 'Current: '}
              <span className="text-cyan-300">
                {isZh && currentStep.labelZh ? currentStep.labelZh : currentStep.label}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Action count badge */}
      {workflow.aiActions.length > 0 && (
        <motion.div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Bot className="w-2.5 h-2.5 text-violet-400" />
          <span className="text-violet-300 text-[9px] font-medium">{workflow.aiActions.length}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
